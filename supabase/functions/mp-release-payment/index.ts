import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-payments-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ReleaseRequest = {
  bookingId?: string;
  action?: "release" | "refund" | "cancel";
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  try {
    const supabase = createClient(
      mustEnv("SUPABASE_URL"),
      mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const body = await req.json().catch(() => ({})) as ReleaseRequest;
    const action = body.action ?? "release";

    if (action === "refund") {
      return await handleRefundAction(req, supabase, body.bookingId);
    }

    if (action === "cancel") {
      return await handleCancelAction(req, supabase, body.bookingId);
    }

    return await handleReleaseAction(req, supabase, body.bookingId);
  } catch (err) {
    console.error("Error en mp-release-payment", err);
    return json({ error: "internal_error" }, 500);
  }
});

async function handleReleaseAction(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  bookingId?: string,
): Promise<Response> {
  const releaseSecret = mustEnv("PAYMENT_RELEASE_SECRET");
  const receivedSecret = req.headers.get("x-payments-secret");
  if (!receivedSecret || receivedSecret !== releaseSecret) {
    return json({ error: "No autorizado para liberar pagos" }, 401);
  }

  const releaseDelayDays = parseInt(Deno.env.get("PAYMENT_RELEASE_DELAY_DAYS") ?? "1", 10);
  const releaseThreshold = new Date();
  releaseThreshold.setDate(releaseThreshold.getDate() - releaseDelayDays);

  let query = supabase
    .from("bookings")
    .select(`
      id,
      host_id,
      host_payout,
      payment_status,
      status,
      date,
      mp_disbursement_id,
      profiles!host_id ( mp_account_id )
    `)
    .in("status", ["paid", "confirmed"])
    .eq("payment_status", "approved")
    .is("payment_released_at", null)
    .lte("date", releaseThreshold.toISOString().slice(0, 10));

  if (bookingId) {
    query = query.eq("id", bookingId);
  }

  const { data: bookings, error: bookingsError } = await query;
  if (bookingsError) {
    console.error("Error buscando bookings para release", bookingsError);
    return json({ error: "No se pudo cargar reservas pendientes" }, 500);
  }

  if (!bookings || bookings.length === 0) {
    return json({ message: "No hay pagos pendientes de liberar", processed: 0, failed: 0 });
  }

  const results = await Promise.allSettled(
    bookings.map((booking) => releasePaymentToHost(supabase, booking as Record<string, unknown>)),
  );

  const successful = results.filter((result) => result.status === "fulfilled").length;
  const failed = results.length - successful;

  const errors = results
    .filter((result): result is PromiseRejectedResult => result.status === "rejected")
    .map((result) => String(result.reason));

  return json({
    message: `Procesados ${results.length} pagos`,
    processed: successful,
    failed,
    errors,
  });
}

async function handleRefundAction(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  bookingId?: string,
): Promise<Response> {
  if (!bookingId) return json({ error: "bookingId es obligatorio para reembolso" }, 400);

  const user = await getUserFromRequest(req, supabase);
  if (!user) return json({ error: "No autorizado" }, 401);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, guest_id, status, cancellation_deadline, mp_payment_id, total_charged")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) return json({ error: "Reserva no encontrada" }, 404);
  if (booking.guest_id !== user.id) return json({ error: "No podes cancelar esta reserva" }, 403);
  if (!(["paid", "confirmed"] as string[]).includes(booking.status)) {
    return json({ error: "Esta reserva no admite reembolso" }, 400);
  }

  if (!booking.mp_payment_id) {
    return json({ error: "La reserva no tiene pago asociado" }, 400);
  }

  const now = new Date();
  const deadline = new Date(booking.cancellation_deadline);
  if (now > deadline) {
    return json({ error: "Fuera del plazo de reembolso" }, 400);
  }

  const refundResponse = await fetch(
    `https://api.mercadopago.com/v1/payments/${booking.mp_payment_id}/refunds`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mustEnv("MP_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `refund-${booking.id}`,
      },
      body: JSON.stringify({ amount: booking.total_charged }),
    },
  );

  if (!refundResponse.ok) {
    const error = await safeJson(refundResponse);
    console.error("Error reembolsando en MP", error);
    return json({ error: "No se pudo procesar el reembolso" }, 502);
  }

  await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: "refunded",
      payment_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  await triggerNotifications(supabase, booking.id, "payment_refunded");

  return json({
    ok: true,
    refunded: true,
    bookingId: booking.id,
    amount: booking.total_charged,
  });
}

async function handleCancelAction(
  req: Request,
  supabase: ReturnType<typeof createClient>,
  bookingId?: string,
): Promise<Response> {
  if (!bookingId) return json({ error: "bookingId es obligatorio para cancelar" }, 400);

  const user = await getUserFromRequest(req, supabase);
  if (!user) return json({ error: "No autorizado" }, 401);

  const { data: booking, error: bookingError } = await supabase
    .from("bookings")
    .select("id, guest_id, status, payment_status, cancellation_deadline, mp_payment_id, total_charged")
    .eq("id", bookingId)
    .maybeSingle();

  if (bookingError || !booking) return json({ error: "Reserva no encontrada" }, 404);
  if (booking.guest_id !== user.id) return json({ error: "No podes cancelar esta reserva" }, 403);

  if (booking.status === "cancelled" || booking.status === "refunded") {
    return json({ ok: true, alreadyCancelled: true, refunded: booking.status === "refunded" });
  }

  if (!["pending", "paid", "confirmed"].includes(booking.status)) {
    return json({ error: "Esta reserva no puede ser cancelada" }, 400);
  }

  const deadline = new Date(booking.cancellation_deadline);
  const canRefund = Boolean(booking.mp_payment_id) && new Date() <= deadline;

  if (canRefund && booking.mp_payment_id) {
    const refundResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${booking.mp_payment_id}/refunds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mustEnv("MP_ACCESS_TOKEN")}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `refund-${booking.id}`,
        },
        body: JSON.stringify({ amount: booking.total_charged }),
      },
    );

    if (!refundResponse.ok) {
      const error = await safeJson(refundResponse);
      console.error("Error reembolsando en MP", error);
      return json({ error: "No se pudo procesar el reembolso" }, 502);
    }
  }

  const nextPaymentStatus = canRefund
    ? "refunded"
    : booking.status === "pending"
      ? "rejected"
      : booking.payment_status;

  await supabase
    .from("bookings")
    .update({
      status: "cancelled",
      payment_status: nextPaymentStatus,
      payment_error: canRefund ? null : "cancelled_without_refund",
      updated_at: new Date().toISOString(),
    })
    .eq("id", booking.id);

  if (canRefund) {
    await triggerNotifications(supabase, booking.id, "payment_refunded");
  }

  return json({
    ok: true,
    bookingId: booking.id,
    cancelled: true,
    refunded: canRefund,
  });
}

async function releasePaymentToHost(
  supabase: ReturnType<typeof createClient>,
  booking: Record<string, unknown>,
): Promise<void> {
  const bookingId = asString(booking.id);
  const hostId = asString(booking.host_id);
  const hostPayout = toInteger(booking.host_payout);

  if (!bookingId || !hostId || hostPayout == null || hostPayout <= 0) {
    throw new Error("booking_data_invalida");
  }

  const profile = booking.profiles as Record<string, unknown> | null;
  const hostMPAccountId = asString(profile?.mp_account_id);

  if (!hostMPAccountId) {
    await supabase
      .from("bookings")
      .update({
        payment_status: "approved",
        payment_error: "manual_payout_required",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    await supabase.functions.invoke("send-notifications", {
      body: { bookingId, trigger: "manual_payout_required" },
    });
    return;
  }

  const transferPayload = {
    transaction_amount: hostPayout,
    currency_id: "UYU",
    description: `Pago reserva Prende ${bookingId}`,
    payment_method_id: "account_money",
    payer: {
      type: "customer",
      id: hostMPAccountId,
    },
  };

  const transferResponse = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mustEnv("MP_ACCESS_TOKEN")}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": `payout-${bookingId}`,
    },
    body: JSON.stringify(transferPayload),
  });

  if (!transferResponse.ok) {
    const error = await safeJson(transferResponse);
    console.error("Error en transferencia MP", { bookingId, error });

    await supabase
      .from("bookings")
      .update({
        payment_status: "approved",
        payment_error: "payout_transfer_failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", bookingId);

    throw new Error(`payout_transfer_failed:${bookingId}`);
  }

  const transfer = await transferResponse.json() as { id?: string | number };

  await supabase
    .from("bookings")
    .update({
      mp_disbursement_id: transfer.id ? String(transfer.id) : null,
      payment_status: "released",
      payment_released_at: new Date().toISOString(),
      payment_error: null,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", bookingId);

  await triggerNotifications(supabase, bookingId, "payment_released");
}

async function triggerNotifications(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  trigger: "payment_refunded" | "payment_released" | "manual_payout_required",
): Promise<void> {
  try {
    await supabase.functions.invoke("send-notifications", {
      body: { bookingId, trigger },
    });
  } catch (err) {
    console.error("Error enviando notificacion", err);
  }
}

async function getUserFromRequest(
  req: Request,
  supabase: ReturnType<typeof createClient>,
): Promise<{ id: string } | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) return null;
  return { id: user.id };
}

function asString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

function toInteger(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return Math.round(value);
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return Math.round(parsed);
  }
  return null;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return { message: "Unable to parse JSON" };
  }
}

function mustEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

