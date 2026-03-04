// supabase/functions/mp-release-payment/index.ts
// Transfiere el pago al host una vez que el evento se completó
//
// Puede ser llamada:
//   - Por un cron job diario (Supabase Cron, o GitHub Actions)
//   - Manualmente por el equipo de Prende para un booking específico
//
// POST /functions/v1/mp-release-payment
// Body: { bookingId?: string }  ← si se omite, procesa todos los pendientes

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const { bookingId } = body;

    // ── 1. Obtener reservas listas para pagar al host ─────────
    // Criterios:
    // - status = 'paid' o 'confirmed'
    // - payment_status = 'approved'
    // - El evento ya ocurrió (date + end_time < ahora)
    // - payment_released_at IS NULL (no pagadas aún)
    // - Opcionalmente filtrar por bookingId específico

    const RELEASE_DELAY_DAYS = parseInt(Deno.env.get("PAYMENT_RELEASE_DELAY_DAYS") ?? "1");
    const releaseThreshold   = new Date();
    releaseThreshold.setDate(releaseThreshold.getDate() - RELEASE_DELAY_DAYS);

    let query = supabase
      .from("bookings")
      .select(`
        *,
        profiles!host_id ( full_name, phone, mp_account_id )
      `)
      .in("status", ["paid", "confirmed"])
      .eq("payment_status", "approved")
      .is("payment_released_at", null)
      .lte("date", releaseThreshold.toISOString().split("T")[0]);

    if (bookingId) {
      query = query.eq("id", bookingId);
    }

    const { data: bookings, error: fetchError } = await query;

    if (fetchError) {
      return json({ error: "Error obteniendo reservas" }, 500);
    }

    if (!bookings || bookings.length === 0) {
      return json({ message: "No hay pagos pendientes de liberar", processed: 0 });
    }

    const results = await Promise.allSettled(
      bookings.map(booking => releasePaymentToHost(supabase, booking))
    );

    const successful = results.filter(r => r.status === "fulfilled").length;
    const failed     = results.filter(r => r.status === "rejected").length;

    if (failed > 0) {
      const errors = results
        .filter((r): r is PromiseRejectedResult => r.status === "rejected")
        .map(r => r.reason?.message);
      console.error("Pagos fallidos:", errors);
    }

    return json({
      message: `Procesados ${bookings.length} pagos: ${successful} exitosos, ${failed} fallidos`,
      processed: successful,
      failed,
    });

  } catch (err) {
    console.error("Error en mp-release-payment:", err);
    return json({ error: "Error interno" }, 500);
  }
});

// ─── TRANSFER AL HOST ────────────────────────────────────────

async function releasePaymentToHost(
  supabase: ReturnType<typeof createClient>,
  booking: Record<string, unknown> & { profiles?: { mp_account_id?: string } }
) {
  const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")!;
  const hostMPAccountId = booking.profiles?.mp_account_id;

  console.log(`Procesando pago booking ${booking.id}, host_payout: ${booking.host_payout} UYU`);

  if (!hostMPAccountId) {
    // Host no tiene cuenta MP vinculada → marcar para pago manual
    await supabase
      .from("bookings")
      .update({
        payment_status: "released",  // marcado como procesado
        payment_released_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id as string);

    console.warn(`Host ${booking.host_id} sin cuenta MP. Pago marcado para liquidación manual.`);

    // Notificar al equipo interno
    await supabase.functions.invoke("send-notifications", {
      body: { bookingId: booking.id, trigger: "manual_payout_required" },
    });
    return;
  }

  // ── Transfer via MP Payments API ─────────────────────────────
  // Prende debe tener el dinero en su cuenta MP primero (ya cobrado en el checkout)
  // Luego transfiere al host usando la API de transferencias

  const transferPayload = {
    transaction_amount: booking.host_payout as number,
    currency_id: "UYU",
    description: `Pago reserva Prende: ${booking.id}`,
    payment_method_id: "account_money",    // desde el saldo de MP de Prende
    payer: {
      type: "customer",
      id: hostMPAccountId,
    },
  };

  const transferResponse = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${mpAccessToken}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `payout-${booking.id}`,
    },
    body: JSON.stringify(transferPayload),
  });

  if (!transferResponse.ok) {
    const err = await transferResponse.json();
    console.error("Error en transfer MP:", JSON.stringify(err));

    // FALLBACK: marcar para revisión manual en lugar de fallar silenciosamente
    await supabase
      .from("bookings")
      .update({
        payment_status: "approved",  // mantener approved, no liberar hasta review
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id as string);

    throw new Error(`MP transfer falló para booking ${booking.id}: ${JSON.stringify(err)}`);
  }

  const transfer = await transferResponse.json();

  // ── Actualizar booking con el ID de la transferencia ─────────
  await supabase
    .from("bookings")
    .update({
      mp_disbursement_id:  String(transfer.id),
      payment_status:      "released",
      payment_released_at: new Date().toISOString(),
      status:              "completed",
      updated_at:          new Date().toISOString(),
    })
    .eq("id", booking.id as string);

  console.log(`✅ Pago liberado al host para booking ${booking.id}. Transfer ID: ${transfer.id}`);

  // Notificar al host y solicitar reseña al guest
  await supabase.functions.invoke("send-notifications", {
    body: { bookingId: booking.id, trigger: "payment_released" },
  });
}

// ─── ENDPOINT MANUAL DE REEMBOLSO ───────────────────────────
// Para cancelaciones >24h antes → reembolso automático

export async function refundBooking(
  bookingId: string,
  mpAccessToken: string,
  supabase: ReturnType<typeof createClient>
) {
  const { data: booking } = await supabase
    .from("bookings")
    .select("mp_payment_id, total_charged, cancellation_deadline")
    .eq("id", bookingId)
    .single();

  if (!booking || !booking.mp_payment_id) {
    throw new Error("Booking no encontrado o sin pago");
  }

  // Verificar que está dentro del plazo de reembolso
  const now      = new Date();
  const deadline = new Date(booking.cancellation_deadline);

  if (now > deadline) {
    throw new Error("Fuera del plazo de reembolso (24h antes del evento)");
  }

  // Emitir reembolso en MP
  const refundResponse = await fetch(
    `https://api.mercadopago.com/v1/payments/${booking.mp_payment_id}/refunds`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mpAccessToken}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `refund-${bookingId}`,
      },
      body: JSON.stringify({ amount: booking.total_charged }),
    }
  );

  if (!refundResponse.ok) {
    throw new Error("Error procesando reembolso en MP");
  }

  await supabase
    .from("bookings")
    .update({
      status:         "cancelled",
      payment_status: "refunded",
      updated_at:     new Date().toISOString(),
    })
    .eq("id", bookingId);
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
