import { initMercadoPago } from "@mercadopago/sdk-react";

let mercadoPagoInitialized = false;

const PAYMENT_METHOD_LABELS = {
  abitab: "Abitab",
  redpagos: "Red Pagos",
  visa: "Visa",
  master: "Mastercard",
  master_debit: "Mastercard Debito",
  debmaster: "Mastercard Debito",
  oca: "OCA",
  oca_blue: "OCA Blue",
  diners: "Diners",
  discover: "Discover",
  mercado_pago: "Mercado Pago",
};

export function initMercadoPagoClient() {
  const publicKey = import.meta.env.VITE_MP_PUBLIC_KEY;
  if (!publicKey) return false;

  if (!mercadoPagoInitialized) {
    initMercadoPago(publicKey, {
      locale: "es-UY",
      trackingDisabled: true,
      frontEndStack: "react",
    });
    mercadoPagoInitialized = true;
  }

  return true;
}

export function hasMercadoPagoPublicKey() {
  return Boolean(import.meta.env.VITE_MP_PUBLIC_KEY);
}

export function getPaymentMethodLabel(methodId, methodType) {
  if (typeof methodId === "string" && PAYMENT_METHOD_LABELS[methodId]) {
    return PAYMENT_METHOD_LABELS[methodId];
  }

  if (methodType === "ticket") return "Pago en efectivo";
  if (methodType === "credit_card") return "Tarjeta de credito";
  if (methodType === "debit_card") return "Tarjeta de debito";
  return "Medio de pago";
}

export function getTicketInstructions(booking) {
  const metadata = isRecord(booking?.payment_metadata) ? booking.payment_metadata : {};
  const methodId = valueAsString(metadata.payment_method_id) ?? booking?.payment_method_id ?? null;
  const methodType = valueAsString(metadata.payment_type_id) ?? booking?.payment_method_type ?? null;
  const ticketUrl = valueAsString(metadata.ticket_url) ?? valueAsString(metadata.external_resource_url);
  const reference = valueAsString(metadata.payment_reference);
  const barcode = valueAsString(metadata.barcode_content);
  const expiresAt = valueAsString(metadata.date_of_expiration) ?? booking?.checkout_expires_at ?? null;

  return {
    methodId,
    methodType,
    methodLabel: getPaymentMethodLabel(methodId, methodType),
    ticketUrl,
    reference,
    barcode,
    expiresAt,
  };
}

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function valueAsString(value) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}
