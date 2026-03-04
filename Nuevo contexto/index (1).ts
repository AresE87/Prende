// supabase/functions/mp-webhook/index.ts
// Recibe y procesa todos los eventos de MercadoPago
//
// POST /functions/v1/mp-webhook
// Eventos manejados: payment.approved, payment.rejected, payment.refunded
//
// CRÍTICO: verificar firma HMAC-SHA256 antes de procesar cualquier evento

import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

serve(async (req) => {
  try {
    // ── 1. Verificar firma HMAC-SHA256 ────────────────────────
    // MP envía el header x-signature con el hash del payload
    const signature   = req.headers.get("x-signature");
    const requestId   = req.headers.get("x-request-id");
    const rawBody     = await req.text();
    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET")!;

    if (!await verifyMPSignature(signature, rawBody, requestId, webhookSecret)) {
      console.error("Firma inválida en webhook MP. Posible fraude.");
      return new Response("Unauthorized", { status: 401 });
    }

    const event = JSON.parse(rawBody);
    console.log("MP Webhook event:", event.type, event.data?.id);

    // ── 2. Solo procesar eventos de payment ───────────────────
    if (event.type !== "payment") {
      return new Response("OK", { status: 200 });
    }

    const paymentId = String(event.data.id);

    // ── 3. Obtener detalles del pago desde MP ─────────────────
    // No confiar en los datos del webhook — siempre consultar la API
    const mpAccessToken = Deno.env.get("MP_ACCESS_TOKEN")!;
    const paymentResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      { headers: { "Authorization": `Bearer ${mpAccessToken}` } }
    );

    if (!paymentResponse.ok) {
      console.error("Error obteniendo pago de MP:", paymentId);
      return new Response("Error fetching payment", { status: 500 });
    }

    const payment = await paymentResponse.json();

    // ── 4. Inicializar Supabase (service role para escribir) ──
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // ── 5. Despachar según estado del pago ────────────────────
    switch (payment.status) {
      case "approved":
        await handlePaymentApproved(supabase, payment);
        break;

      case "rejected":
      case "cancelled":
        await handlePaymentFailed(supabase, payment);
        break;

      case "refunded":
        await handlePaymentRefunded(supabase, payment);
        break;

      case "in_mediation":
        await handleChargeback(supabase, payment);
        break;

      default:
        console.log("Estado de pago no manejado:", payment.status);
    }

    return new Response("OK", { status: 200 });

  } catch (err) {
    console.error("Error en mp-webhook:", err);
    // Retornar 200 para que MP no reintente — el error está loggeado
    return new Response("OK", { status: 200 });
  }
});

// ─── HANDLERS POR ESTADO ────────────────────────────────────

async function handlePaymentApproved(supabase: ReturnType<typeof createClient>, payment: Record<string, unknown>) {
  const paymentId        = String(payment.id);
  const externalRef      = payment.external_reference as string;

  if (!externalRef) {
    console.error("Pago sin external_reference:", paymentId);
    return;
  }

  let bookingData: Record<string, unknown>;
  try {
    bookingData = JSON.parse(externalRef);
  } catch {
    console.error("external_reference no es JSON válido:", externalRef);
    return;
  }

  // Verificar que no procesamos este pago dos veces (idempotencia)
  const { data: existingBooking } = await supabase
    .from("bookings")
    .select("id, status")
    .eq("mp_payment_id", paymentId)
    .maybeSingle();

  if (existingBooking) {
    console.log("Pago ya procesado:", paymentId, "Booking:", existingBooking.id);
    return;
  }

  // Actualizar la reserva con el payment_id y cambiar estado a "paid"
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({
      mp_payment_id:  paymentId,
      status:         "paid",
      payment_status: "approved",
      updated_at:     new Date().toISOString(),
    })
    .eq("mp_preference_id", payment.preference_id as string)
    .select()
    .single();

  if (error || !booking) {
    console.error("Error actualizando booking:", error);
    // Si no encontró por preference_id, intentar crear nueva reserva
    // (puede pasar si el usuario pagó directo sin pasar por crear-preference)
    return;
  }

  console.log("Reserva confirmada:", booking.id);

  // Disparar notificaciones (no bloqueante)
  await triggerNotifications(supabase, booking.id, "payment_approved");
}

async function handlePaymentFailed(supabase: ReturnType<typeof createClient>, payment: Record<string, unknown>) {
  const { error } = await supabase
    .from("bookings")
    .update({
      mp_payment_id:  String(payment.id),
      status:         "cancelled",
      payment_status: "rejected",
      updated_at:     new Date().toISOString(),
    })
    .eq("mp_preference_id", payment.preference_id as string);

  if (error) console.error("Error marcando pago fallido:", error);
}

async function handlePaymentRefunded(supabase: ReturnType<typeof createClient>, payment: Record<string, unknown>) {
  const { data: booking, error } = await supabase
    .from("bookings")
    .update({
      status:         "refunded",
      payment_status: "refunded",
      updated_at:     new Date().toISOString(),
    })
    .eq("mp_payment_id", String(payment.id))
    .select()
    .single();

  if (error) {
    console.error("Error marcando reembolso:", error);
    return;
  }

  if (booking) {
    await triggerNotifications(supabase, booking.id, "payment_refunded");
  }
}

async function handleChargeback(supabase: ReturnType<typeof createClient>, payment: Record<string, unknown>) {
  // Marcar para revisión manual — no reembolsar automáticamente
  const { error } = await supabase
    .from("bookings")
    .update({
      payment_status: "in_mediation",
      updated_at:     new Date().toISOString(),
    })
    .eq("mp_payment_id", String(payment.id));

  if (error) console.error("Error marcando contracargo:", error);

  // TODO: notificar al equipo de Prende por email para revisión manual
  console.warn("CONTRACARGO recibido para pago:", payment.id);
}

// ─── HELPERS ────────────────────────────────────────────────

async function triggerNotifications(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  trigger: string
) {
  try {
    await supabase.functions.invoke("send-notifications", {
      body: { bookingId, trigger },
    });
  } catch (err) {
    console.error("Error disparando notificaciones:", err);
    // No fallar el webhook por error en notificaciones
  }
}

async function verifyMPSignature(
  signature: string | null,
  body: string,
  requestId: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) return false;

  // MP firma: ts=TIMESTAMP,v1=HASH
  // El mensaje a firmar es: id:PAYMENT_ID;request-id:REQUEST_ID;ts:TIMESTAMP;
  const parts = Object.fromEntries(
    signature.split(",").map(part => {
      const [key, value] = part.split("=");
      return [key.trim(), value.trim()];
    })
  );

  const ts = parts["ts"];
  const hash = parts["v1"];
  if (!ts || !hash) return false;

  // Extraer ID del body para construir el mensaje
  let dataId = "";
  try {
    const parsed = JSON.parse(body);
    dataId = String(parsed.data?.id ?? "");
  } catch {
    return false;
  }

  const message = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const computed = encodeHex(new Uint8Array(sig));

  return computed === hash;
}
