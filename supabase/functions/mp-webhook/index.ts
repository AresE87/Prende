import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { crypto } from "https://deno.land/std@0.208.0/crypto/mod.ts";
import { encodeHex } from "https://deno.land/std@0.208.0/encoding/hex.ts";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  try {
    const supabase = createClient(
      mustEnv("SUPABASE_URL"),
      mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const requestUrl = new URL(req.url);
    const requestId = req.headers.get("x-request-id");
    const signature = req.headers.get("x-signature");
    const rawBody = await req.text();
    const event = parseJson(rawBody) ?? {};

    const eventType = asString((event as Record<string, unknown>).type)
      ?? requestUrl.searchParams.get("type")
      ?? requestUrl.searchParams.get("topic")
      ?? "";

    const paymentIdFromBody = extractEventPaymentId(event);
    const paymentId = paymentIdFromBody
      ?? requestUrl.searchParams.get("data.id")
      ?? requestUrl.searchParams.get("id")
      ?? "";

    if (eventType !== "payment") {
      return json({ ok: true, skipped: true, reason: "unsupported_event_type" });
    }

    if (!paymentId) {
      return json({ ok: false, error: "missing_payment_id" }, 400);
    }

    const webhookSecret = Deno.env.get("MP_WEBHOOK_SECRET");
    if (webhookSecret) {
      const signatureOk = await verifyMPSignature({
        signature,
        body: rawBody,
        requestId,
        secret: webhookSecret,
        fallbackPaymentId: paymentId,
      });

      if (!signatureOk) {
        console.error("Firma invalida en webhook MP", { paymentId, requestId });
        return json({ error: "unauthorized" }, 401);
      }
    }

    const payment = await fetchPaymentFromMP(paymentId);

    const preferenceId = asString(payment.preference_id);
    const externalReference = asString(payment.external_reference);
    const paymentStatus = asString(payment.status) ?? "unknown";
    const paymentStatusDetail = asString(payment.status_detail);
    const currencyId = asString(payment.currency_id);
    const transactionAmount = toInteger(payment.transaction_amount);
    const netReceivedAmount = toInteger(payment.transaction_details && typeof payment.transaction_details === "object"
      ? (payment.transaction_details as Record<string, unknown>).net_received_amount
      : null);
    const merchantOrderId = asString(payment.order && typeof payment.order === "object"
      ? (payment.order as Record<string, unknown>).id
      : null);

    const dedupeKey = requestId
      ? `mp:${requestId}`
      : `mp:${paymentId}:${paymentStatus}:${paymentStatusDetail ?? "na"}`;

    const { data: createdEvent, error: eventInsertError } = await supabase
      .from("payment_events")
      .insert({
        provider: "mercadopago",
        dedupe_key: dedupeKey,
        mp_event_type: eventType,
        mp_payment_id: paymentId,
        mp_preference_id: preferenceId,
        mp_merchant_order_id: merchantOrderId,
        status: paymentStatus,
        status_detail: paymentStatusDetail,
        currency_id: currencyId,
        transaction_amount: transactionAmount,
        net_received_amount: netReceivedAmount,
        payload: payment,
      })
      .select("id")
      .single();

    if (eventInsertError?.code === "23505") {
      return json({ ok: true, duplicate: true });
    }

    if (eventInsertError || !createdEvent) {
      console.error("Error insertando payment_event", eventInsertError);
      return json({ error: "event_log_insert_failed" }, 500);
    }

    const booking = await findBookingForPayment(supabase, {
      externalReference,
      preferenceId,
      paymentId,
    });

    if (!booking) {
      await markEventError(supabase, createdEvent.id, "booking_not_found");
      return json({ ok: true, warning: "booking_not_found" });
    }

    const reconciliationError = reconcilePayment(booking.total_charged, transactionAmount, currencyId);
    if (reconciliationError) {
      await supabase
        .from("bookings")
        .update({
          payment_status: "in_mediation",
          payment_error: reconciliationError,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      await markEventError(supabase, createdEvent.id, reconciliationError);
      return json({ ok: true, warning: reconciliationError });
    }

    const paymentSnapshot = extractPaymentSnapshot(payment);
    const updatePayload = buildBookingUpdate(paymentStatus, {
      paymentId,
      preferenceId,
      merchantOrderId,
      statusDetail: paymentStatusDetail,
    }, paymentSnapshot, booking.checkout_expires_at);

    if (!updatePayload) {
      await markEventProcessed(supabase, createdEvent.id);
      return json({ ok: true, skipped: true, reason: "status_not_mapped" });
    }

    const { error: updateBookingError } = await supabase
      .from("bookings")
      .update({ ...updatePayload, updated_at: new Date().toISOString() })
      .eq("id", booking.id);

    if (updateBookingError) {
      console.error("Error actualizando booking por webhook", updateBookingError);
      await markEventError(supabase, createdEvent.id, "booking_update_failed");
      return json({ error: "booking_update_failed" }, 500);
    }

    await markEventProcessed(supabase, createdEvent.id);

    if (paymentStatus === "approved") {
      await triggerNotifications(supabase, booking.id, "payment_approved");
    } else if (paymentStatus === "refunded") {
      await triggerNotifications(supabase, booking.id, "payment_refunded");
    }

    return json({ ok: true });
  } catch (err) {
    console.error("Error en mp-webhook", err);
    return json({ error: "internal_error" }, 500);
  }
});

async function fetchPaymentFromMP(paymentId: string): Promise<Record<string, unknown>> {
  const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${mustEnv("MP_ACCESS_TOKEN")}`,
    },
  });

  if (!response.ok) {
    const error = await safeJson(response);
    console.error("Error consultando pago en MP", error);
    throw new Error("payment_fetch_failed");
  }

  return await response.json() as Record<string, unknown>;
}

async function findBookingForPayment(
  supabase: ReturnType<typeof createClient>,
  params: { externalReference: string | null; preferenceId: string | null; paymentId: string },
): Promise<{ id: string; total_charged: number; checkout_expires_at: string | null } | null> {
  const { externalReference, preferenceId, paymentId } = params;

  if (externalReference) {
    const { data } = await supabase
      .from("bookings")
      .select("id, total_charged, checkout_expires_at")
      .eq("id", externalReference)
      .maybeSingle();

    if (data) return data;
  }

  if (preferenceId) {
    const { data } = await supabase
      .from("bookings")
      .select("id, total_charged, checkout_expires_at")
      .eq("mp_preference_id", preferenceId)
      .maybeSingle();

    if (data) return data;
  }

  const { data } = await supabase
    .from("bookings")
    .select("id, total_charged, checkout_expires_at")
    .eq("mp_payment_id", paymentId)
    .maybeSingle();

  return data ?? null;
}

function buildBookingUpdate(
  paymentStatus: string,
  paymentIds: {
    paymentId: string;
    preferenceId: string | null;
    merchantOrderId: string | null;
    statusDetail: string | null;
  },
  paymentSnapshot: {
    payment_method_id: string | null;
    payment_method_type: string | null;
    payment_metadata: Record<string, unknown>;
  },
  currentCheckoutExpiration: string | null,
): Record<string, unknown> | null {
  const base = {
    mp_payment_id: paymentIds.paymentId,
    mp_preference_id: paymentIds.preferenceId,
    mp_merchant_order_id: paymentIds.merchantOrderId,
    payment_method_id: paymentSnapshot.payment_method_id,
    payment_method_type: paymentSnapshot.payment_method_type,
    payment_metadata: paymentSnapshot.payment_metadata,
    checkout_expires_at: asString(paymentSnapshot.payment_metadata.date_of_expiration) ?? currentCheckoutExpiration,
    payment_error: null,
  };

  if (paymentStatus === "approved") {
    return {
      ...base,
      status: "paid",
      payment_status: "approved",
    };
  }

  if (paymentStatus === "pending" || paymentStatus === "in_process") {
    return {
      ...base,
      status: "pending",
      payment_status: "pending",
    };
  }

  if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
    return {
      ...base,
      status: "pending",
      payment_status: "rejected",
      payment_error: paymentIds.statusDetail ?? "payment_rejected",
    };
  }

  if (paymentStatus === "refunded") {
    return {
      ...base,
      status: "refunded",
      payment_status: "refunded",
    };
  }

  if (paymentStatus === "in_mediation") {
    return {
      ...base,
      payment_status: "in_mediation",
      payment_error: paymentIds.statusDetail ?? "payment_in_mediation",
    };
  }

  return null;
}

function extractPaymentSnapshot(payment: Record<string, unknown>) {
  const transactionDetails = isRecord(payment.transaction_details) ? payment.transaction_details : {};
  const pointOfInteraction = isRecord(payment.point_of_interaction) ? payment.point_of_interaction : {};
  const transactionData = isRecord(pointOfInteraction.transaction_data) ? pointOfInteraction.transaction_data : {};
  const card = isRecord(payment.card) ? payment.card : {};

  return {
    payment_method_id: asString(payment.payment_method_id),
    payment_method_type: asString(payment.payment_type_id),
    payment_metadata: {
      status: asString(payment.status),
      status_detail: asString(payment.status_detail),
      payment_method_id: asString(payment.payment_method_id),
      payment_type_id: asString(payment.payment_type_id),
      ticket_url: asString(transactionData.ticket_url) ?? asString(transactionDetails.external_resource_url),
      external_resource_url: asString(transactionDetails.external_resource_url),
      payment_reference: asString(transactionDetails.payment_method_reference_id),
      barcode_content: asString(transactionData.barcode_content),
      date_of_expiration: asString(payment.date_of_expiration),
      installments: toInteger(payment.installments),
      last_four_digits: asString(card.last_four_digits),
    },
  };
}

function reconcilePayment(expectedAmount: number, chargedAmount: number | null, currencyId: string | null): string | null {
  if (currencyId !== "UYU") return `currency_mismatch:${currencyId ?? "null"}`;
  if (chargedAmount == null) return "amount_missing";
  if (chargedAmount !== expectedAmount) return `amount_mismatch:expected_${expectedAmount}_got_${chargedAmount}`;
  return null;
}

async function triggerNotifications(
  supabase: ReturnType<typeof createClient>,
  bookingId: string,
  trigger: "payment_approved" | "payment_refunded",
): Promise<void> {
  try {
    await supabase.functions.invoke("send-notifications", {
      body: { bookingId, trigger },
    });
  } catch (err) {
    console.error("Error disparando notificaciones", err);
  }
}

async function markEventProcessed(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
): Promise<void> {
  await supabase
    .from("payment_events")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      processing_error: null,
    })
    .eq("id", eventId);
}

async function markEventError(
  supabase: ReturnType<typeof createClient>,
  eventId: string,
  message: string,
): Promise<void> {
  await supabase
    .from("payment_events")
    .update({
      processed: false,
      processing_error: message,
      processed_at: new Date().toISOString(),
    })
    .eq("id", eventId);
}

async function verifyMPSignature(params: {
  signature: string | null;
  body: string;
  requestId: string | null;
  secret: string;
  fallbackPaymentId: string;
}): Promise<boolean> {
  const { signature, body, requestId, secret, fallbackPaymentId } = params;
  if (!signature) return false;

  const parts = Object.fromEntries(
    signature.split(",").map((entry) => {
      const [key, value] = entry.split("=");
      return [key?.trim(), value?.trim()];
    }),
  ) as Record<string, string>;

  const ts = parts.ts;
  const hash = parts.v1;
  if (!ts || !hash) return false;

  const parsedBody = parseJson(body);
  const dataId = extractEventPaymentId(parsedBody) ?? fallbackPaymentId;

  const message = `id:${dataId};request-id:${requestId ?? ""};ts:${ts};`;

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );

  const signatureBytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  const computed = encodeHex(new Uint8Array(signatureBytes));

  return timingSafeEqual(computed.toLowerCase(), hash.toLowerCase());
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

function parseJson(value: string): unknown | null {
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function extractEventPaymentId(event: unknown): string | null {
  if (!event || typeof event !== "object") return null;
  const data = (event as Record<string, unknown>).data;
  if (!data || typeof data !== "object") return null;
  return asString((data as Record<string, unknown>).id);
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
    headers: {
      ...CORS,
      "Content-Type": "application/json",
    },
  });
}

