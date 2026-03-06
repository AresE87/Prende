import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type PaymentBody = {
  bookingId?: string;
  submissionId?: string;
  paymentType?: string;
  selectedPaymentMethod?: string;
  formData?: Record<string, unknown>;
  additionalData?: Record<string, unknown> | null;
};

type BookingRow = {
  id: string;
  guest_id: string;
  host_id: string;
  space_id: string;
  date: string;
  start_time: string;
  end_time: string;
  total_charged: number;
  status: string;
  payment_status: string;
  checkout_expires_at: string | null;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  payment_method_id: string | null;
  payment_method_type: string | null;
  payment_metadata: Record<string, unknown> | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") return json({ error: "Metodo no permitido" }, 405);

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "No autorizado" }, 401);

    const accessToken = authHeader.replace("Bearer ", "");
    const body = await req.json().catch(() => null) as PaymentBody | null;
    const bookingId = typeof body?.bookingId === "string" ? body.bookingId : "";
    const formData = isRecord(body?.formData) ? body.formData : null;

    if (!bookingId || !formData) {
      return json({ error: "Faltan datos para procesar el pago" }, 400);
    }

    const supabase = createClient(
      mustEnv("SUPABASE_URL"),
      mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) return json({ error: "Token invalido" }, 401);

    const bookingQuery = await supabase
      .from("bookings")
      .select(`
        id,
        guest_id,
        host_id,
        space_id,
        date,
        start_time,
        end_time,
        total_charged,
        status,
        payment_status,
        checkout_expires_at,
        mp_preference_id,
        mp_payment_id,
        payment_method_id,
        payment_method_type,
        payment_metadata
      `)
      .eq("id", bookingId)
      .maybeSingle();

    const booking = bookingQuery.data as BookingRow | null;
    const bookingError = bookingQuery.error;

    if (bookingError || !booking) return json({ error: "Reserva no encontrada" }, 404);
    if (booking.guest_id !== user.id) return json({ error: "No autorizado" }, 403);

    if (["paid", "confirmed", "completed", "refunded"].includes(booking.status) || booking.payment_status === "approved") {
      return json({ ok: true, booking, reused: true });
    }

    if (booking.checkout_expires_at && new Date(booking.checkout_expires_at).getTime() < Date.now()) {
      return json({ error: "La sesion de pago expiro. Inicia la reserva nuevamente." }, 409);
    }

    const ticketInstructions = getExistingTicketInstructions(booking);
    if (booking.payment_status === "pending" && booking.payment_method_type === "ticket" && ticketInstructions.ticket_url) {
      return json({ ok: true, booking, reused: true });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();

    const { data: space } = await supabase
      .from("spaces")
      .select("title")
      .eq("id", booking.space_id)
      .maybeSingle();

    const paymentMethodKind = normalizePaymentKind(body?.selectedPaymentMethod, body?.paymentType);
    if (!paymentMethodKind) {
      return json({ error: "Metodo de pago no soportado" }, 400);
    }

    const webhookUrl = mustEnv("MP_WEBHOOK_URL");
    const description = `Reserva Prende - ${space?.title ?? "Espacio"} - ${booking.date} ${sliceTime(booking.start_time)}-${sliceTime(booking.end_time)}`;
    const submissionId = typeof body?.submissionId === "string" && body.submissionId.trim().length > 0
      ? body.submissionId
      : crypto.randomUUID();

    const paymentPayload = buildMercadoPagoPayload({
      booking,
      formData,
      paymentMethodKind,
      fallbackEmail: user.email ?? "",
      fallbackName: profile?.full_name ?? user.user_metadata?.full_name ?? "Invitado Prende",
      webhookUrl,
      description,
    });

    const mpResponse = await fetch("https://api.mercadopago.com/v1/payments", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mustEnv("MP_ACCESS_TOKEN")}`,
        "Content-Type": "application/json",
        "X-Idempotency-Key": `booking-${booking.id}-${submissionId}`,
      },
      body: JSON.stringify(paymentPayload),
    });

    const mpData = await safeJson(mpResponse);
    if (!mpResponse.ok || !isRecord(mpData)) {
      const providerMessage = getProviderErrorMessage(mpData);

      await supabase
        .from("bookings")
        .update({
          payment_status: "rejected",
          payment_error: providerMessage,
          updated_at: new Date().toISOString(),
        })
        .eq("id", booking.id);

      return json({ error: providerMessage }, mpResponse.status >= 400 && mpResponse.status < 500 ? 422 : 502);
    }

    const paymentSnapshot = extractPaymentSnapshot(mpData, body?.additionalData);
    const updatePayload = buildBookingUpdate(mpData, paymentSnapshot, booking.checkout_expires_at);

    const { data: updatedBooking, error: updateError } = await supabase
      .from("bookings")
      .update({
        ...updatePayload,
        updated_at: new Date().toISOString(),
      })
      .eq("id", booking.id)
      .select("*")
      .single();

    if (updateError || !updatedBooking) {
      console.error("Error actualizando booking luego del pago", updateError);
      return json({ error: "No se pudo guardar el resultado del pago" }, 500);
    }

    return json({
      ok: true,
      booking: updatedBooking,
      paymentStatus: updatedBooking.payment_status,
      paymentMethodId: updatedBooking.payment_method_id,
      paymentMethodType: updatedBooking.payment_method_type,
      ticketUrl: paymentSnapshot.payment_metadata.ticket_url,
      expiresAt: paymentSnapshot.payment_metadata.date_of_expiration ?? updatedBooking.checkout_expires_at,
    });
  } catch (err) {
    console.error("Error en mp-process-payment", err);
    return json({ error: "Error interno del servidor" }, 500);
  }
});

function buildMercadoPagoPayload(params: {
  booking: BookingRow;
  formData: Record<string, unknown>;
  paymentMethodKind: "card" | "ticket";
  fallbackEmail: string;
  fallbackName: string;
  webhookUrl: string;
  description: string;
}): Record<string, unknown> {
  const { booking, formData, paymentMethodKind, fallbackEmail, fallbackName, webhookUrl, description } = params;
  const payer = normalizePayer(formData.payer, fallbackEmail, fallbackName);
  const paymentMethodId = valueAsString(formData.payment_method_id);

  if (!paymentMethodId) throw new Error("No se pudo identificar el medio de pago");

  const basePayload: Record<string, unknown> = {
    transaction_amount: booking.total_charged,
    description,
    external_reference: booking.id,
    notification_url: webhookUrl,
    payment_method_id: paymentMethodId,
    payer,
    metadata: {
      booking_id: booking.id,
      space_id: booking.space_id,
      host_id: booking.host_id,
      guest_id: booking.guest_id,
    },
    statement_descriptor: "PRENDE",
  };

  if (paymentMethodKind === "card") {
    const token = valueAsString(formData.token);
    const installments = valueAsNumber(formData.installments) ?? 1;
    if (!token) throw new Error("No se pudo tokenizar la tarjeta");

    return {
      ...basePayload,
      token,
      installments,
      issuer_id: valueAsString(formData.issuer_id),
      payment_method_option_id: valueAsString(formData.payment_method_option_id),
      processing_mode: valueAsString(formData.processing_mode),
    };
  }

  const expiration = new Date(Date.now() + ticketTtlHours() * 60 * 60 * 1000).toISOString();
  if (!isRecord(payer.address)) {
    throw new Error("Falta la direccion del pagador para generar el ticket.");
  }

  return {
    ...basePayload,
    date_of_expiration: expiration,
    additional_info: {
      items: [
        {
          id: booking.space_id,
          title: description,
          quantity: 1,
          unit_price: booking.total_charged,
        },
      ],
    },
  };
}

function buildBookingUpdate(
  payment: Record<string, unknown>,
  snapshot: {
    payment_method_id: string | null;
    payment_method_type: string | null;
    payment_metadata: Record<string, unknown>;
  },
  currentCheckoutExpiration: string | null,
): Record<string, unknown> {
  const paymentStatus = valueAsString(payment.status) ?? "unknown";
  const statusDetail = valueAsString(payment.status_detail);
  const nextExpiration = valueAsString(snapshot.payment_metadata.date_of_expiration) ?? currentCheckoutExpiration;

  const base = {
    mp_payment_id: valueAsString(payment.id),
    mp_preference_id: valueAsString(payment.preference_id),
    mp_merchant_order_id: readString(payment.order, "id"),
    payment_method_id: snapshot.payment_method_id,
    payment_method_type: snapshot.payment_method_type,
    payment_metadata: snapshot.payment_metadata,
    checkout_expires_at: nextExpiration,
  };

  if (paymentStatus === "approved") {
    return {
      ...base,
      status: "paid",
      payment_status: "approved",
      payment_error: null,
    };
  }

  if (paymentStatus === "pending" || paymentStatus === "in_process") {
    return {
      ...base,
      status: "pending",
      payment_status: "pending",
      payment_error: null,
    };
  }

  if (paymentStatus === "rejected" || paymentStatus === "cancelled") {
    return {
      ...base,
      status: "pending",
      payment_status: "rejected",
      payment_error: statusDetail ?? "payment_rejected",
    };
  }

  if (paymentStatus === "refunded") {
    return {
      ...base,
      status: "refunded",
      payment_status: "refunded",
      payment_error: null,
    };
  }

  if (paymentStatus === "in_mediation") {
    return {
      ...base,
      payment_status: "in_mediation",
      payment_error: statusDetail ?? "payment_in_mediation",
    };
  }

  return {
    ...base,
    payment_status: "pending",
    payment_error: statusDetail,
  };
}

function extractPaymentSnapshot(
  payment: Record<string, unknown>,
  additionalData?: Record<string, unknown> | null,
) {
  const transactionDetails = isRecord(payment.transaction_details) ? payment.transaction_details : {};
  const pointOfInteraction = isRecord(payment.point_of_interaction) ? payment.point_of_interaction : {};
  const transactionData = isRecord(pointOfInteraction.transaction_data) ? pointOfInteraction.transaction_data : {};
  const card = isRecord(payment.card) ? payment.card : {};

  return {
    payment_method_id: valueAsString(payment.payment_method_id),
    payment_method_type: valueAsString(payment.payment_type_id),
    payment_metadata: {
      status: valueAsString(payment.status),
      status_detail: valueAsString(payment.status_detail),
      payment_method_id: valueAsString(payment.payment_method_id),
      payment_type_id: valueAsString(payment.payment_type_id),
      ticket_url: valueAsString(transactionData.ticket_url) ?? valueAsString(transactionDetails.external_resource_url),
      external_resource_url: valueAsString(transactionDetails.external_resource_url),
      payment_reference: valueAsString(transactionDetails.payment_method_reference_id),
      barcode_content: valueAsString(transactionData.barcode_content),
      date_of_expiration: valueAsString(payment.date_of_expiration),
      installments: valueAsNumber(payment.installments),
      last_four_digits: valueAsString(card.last_four_digits) ?? valueAsString(additionalData?.lastFourDigits),
      bin: valueAsString(card.first_six_digits) ?? valueAsString(additionalData?.bin),
      cardholder_name: valueAsString(additionalData?.cardholderName),
    },
  };
}

function getExistingTicketInstructions(booking: BookingRow) {
  const metadata = isRecord(booking.payment_metadata) ? booking.payment_metadata : {};
  return {
    ticket_url: valueAsString(metadata.ticket_url) ?? valueAsString(metadata.external_resource_url),
  };
}

function normalizePayer(
  payerValue: unknown,
  fallbackEmail: string,
  fallbackName: string,
) {
  const payer = isRecord(payerValue) ? payerValue : {};
  const identification = isRecord(payer.identification) ? payer.identification : {};
  const address = isRecord(payer.address) ? payer.address : {};
  const [firstName, ...rest] = fallbackName.trim().split(/\s+/);
  const lastName = rest.join(" ") || "Prende";
  const email = valueAsString(payer.email) ?? fallbackEmail;
  const identificationType = valueAsString(identification.type);
  const identificationNumber = valueAsString(identification.number);

  if (!email) {
    throw new Error("Falta el email del pagador.");
  }

  if (!identificationType || !identificationNumber) {
    throw new Error("Falta el documento del pagador.");
  }

  const streetName = valueAsString(address.street_name);
  const streetNumber = valueAsString(address.street_number);
  const zipCode = valueAsString(address.zip_code);
  const neighborhood = valueAsString(address.neighborhood);
  const city = valueAsString(address.city);
  const federalUnit = valueAsString(address.federal_unit);

  const normalizedPayer: Record<string, unknown> = {
    email,
    first_name: valueAsString(payer.first_name) ?? firstName,
    last_name: valueAsString(payer.last_name) ?? lastName,
    entity_type: valueAsString(payer.entity_type),
    identification: {
      type: identificationType,
      number: identificationNumber,
    },
  };

  if (streetName && streetNumber && zipCode) {
    normalizedPayer.address = {
      zip_code: zipCode,
      street_name: streetName,
      street_number: streetNumber,
      neighborhood: neighborhood ?? "Centro",
      city: city ?? "Montevideo",
      federal_unit: federalUnit ?? "MO",
    };
  }

  return normalizedPayer;
}

function normalizePaymentKind(selectedPaymentMethod?: string, paymentType?: string): "card" | "ticket" | null {
  const value = (selectedPaymentMethod ?? paymentType ?? "").trim();
  if (["creditCard", "debitCard", "prepaidCard"].includes(value)) return "card";
  if (value === "ticket") return "ticket";
  return null;
}

function getProviderErrorMessage(payload: unknown): string {
  if (!isRecord(payload)) return "No se pudo procesar el pago";

  const message = valueAsString(payload.message);
  if (message) return humanizeMercadoPagoMessage(message);

  const cause = Array.isArray(payload.cause) ? payload.cause[0] : null;
  if (isRecord(cause)) {
    const description = valueAsString(cause.description);
    if (description) return humanizeMercadoPagoMessage(description);
  }

  return "No se pudo procesar el pago";
}

function humanizeMercadoPagoMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("cc_rejected_insufficient_amount")) return "La tarjeta no tiene saldo suficiente.";
  if (lower.includes("cc_rejected_bad_filled_card_number")) return "Revisa el numero de tarjeta.";
  if (lower.includes("cc_rejected_bad_filled_security_code")) return "Revisa el codigo de seguridad.";
  if (lower.includes("cc_rejected_bad_filled_date")) return "Revisa la fecha de vencimiento.";
  if (lower.includes("cc_rejected_high_risk")) return "El banco rechazo el pago por seguridad. Proba con otra tarjeta.";
  if (lower.includes("cc_rejected_call_for_authorize")) return "Tu banco requiere autorizacion para este pago.";
  if (lower.includes("cc_rejected_other_reason")) return "La tarjeta fue rechazada. Proba con otro medio de pago.";
  return message;
}

function ticketTtlHours(): number {
  const envValue = Number(Deno.env.get("BOOKING_TICKET_TTL_HOURS") ?? "6");
  return Number.isFinite(envValue) && envValue > 0 ? envValue : 6;
}

function readString(source: unknown, key: string): string | null {
  if (!isRecord(source)) return null;
  return valueAsString(source[key]);
}

function sliceTime(value: string) {
  return String(value).slice(0, 5);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAsString(value: unknown): string | null {
  if (typeof value === "string" && value.trim().length > 0) return value;
  if (typeof value === "number") return String(value);
  return null;
}

function valueAsNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function mustEnv(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing env var: ${name}`);
  return value;
}

async function safeJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}
