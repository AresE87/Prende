import { useCallback, useEffect, useRef, useState } from "react";
import { getBookingById, subscribeToBooking, supabase, type Booking } from "../lib/supabase";
import { getTicketInstructions } from "../lib/payments";

export interface ReservationForm {
  spaceId: string;
  date: string;
  startTime: string;
  endTime: string;
  guestCount: number;
  specialRequests: string;
}

export interface EmbeddedPaymentPayload {
  paymentType: string;
  selectedPaymentMethod: string;
  formData: Record<string, unknown>;
  additionalData?: Record<string, unknown> | null;
}

export interface TicketInstructions {
  methodId: string | null;
  methodType: string | null;
  methodLabel: string;
  ticketUrl: string | null;
  reference: string | null;
  barcode: string | null;
  expiresAt: string | null;
}

export type ReservationStep =
  | "idle"
  | "preparing_checkout"
  | "payment_ready"
  | "processing_payment"
  | "awaiting_confirmation"
  | "awaiting_offline_payment"
  | "confirmed"
  | "cancelled";

export interface ReservationState {
  step: ReservationStep;
  booking: Booking | null;
  bookingId: string | null;
  preferenceId: string | null;
  mpInitPoint: string | null;
  checkoutExpiresAt: string | null;
  error: string | null;
  totalHours: number;
  totalCharged: number;
  hostPayout: number;
  platformFee: number;
  ticketInstructions: TicketInstructions | null;
}

const INITIAL_STATE: ReservationState = {
  step: "idle",
  booking: null,
  bookingId: null,
  preferenceId: null,
  mpInitPoint: null,
  checkoutExpiresAt: null,
  error: null,
  totalHours: 0,
  totalCharged: 0,
  hostPayout: 0,
  platformFee: 0,
  ticketInstructions: null,
};

export function useReservation() {
  const [state, setState] = useState<ReservationState>(INITIAL_STATE);
  const subscriptionRef = useRef<ReturnType<typeof subscribeToBooking> | null>(null);

  const syncFromBooking = useCallback((booking: Booking) => {
    if (booking.status === "paid" || booking.status === "confirmed" || booking.payment_status === "approved") {
      setState((prev) => ({
        ...prev,
        step: "confirmed",
        booking,
        bookingId: booking.id,
        checkoutExpiresAt: booking.checkout_expires_at,
        totalHours: booking.total_hours,
        totalCharged: booking.total_charged,
        hostPayout: booking.host_payout,
        platformFee: booking.platform_fee,
        ticketInstructions: null,
        error: null,
      }));
      return;
    }

    if (booking.status === "cancelled") {
      setState((prev) => ({
        ...prev,
        step: "cancelled",
        booking,
        bookingId: booking.id,
        error: booking.payment_error ?? null,
      }));
      return;
    }

    if (booking.payment_method_type === "ticket" && booking.payment_status === "pending") {
      setState((prev) => ({
        ...prev,
        step: "awaiting_offline_payment",
        booking,
        bookingId: booking.id,
        checkoutExpiresAt: booking.checkout_expires_at,
        ticketInstructions: getTicketInstructions(booking),
        error: null,
      }));
      return;
    }

    setState((prev) => ({
      ...prev,
      step: "payment_ready",
      booking,
      bookingId: booking.id,
      checkoutExpiresAt: booking.checkout_expires_at,
      totalHours: booking.total_hours,
      totalCharged: booking.total_charged,
      hostPayout: booking.host_payout,
      platformFee: booking.platform_fee,
      error: booking.payment_status === "rejected"
        ? humanizePaymentError(booking.payment_error)
        : null,
    }));
  }, []);

  const attachRealtime = useCallback((bookingId: string) => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = subscribeToBooking(bookingId, (updatedBooking) => {
      syncFromBooking(updatedBooking);
    });
  }, [syncFromBooking]);

  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  const calculatePrice = useCallback((pricePerHour: number, startTime: string, endTime: string) => {
    const takeRate = parseFloat(import.meta.env.VITE_TAKE_RATE ?? "0.15");
    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM] = endTime.split(":").map(Number);
    const totalHours = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

    if (totalHours <= 0) return null;

    const subtotal = Math.round(pricePerHour * totalHours);
    const platformFee = Math.round(subtotal * takeRate);
    const totalCharged = subtotal + platformFee;
    const hostPayout = subtotal - platformFee;

    return { totalHours, subtotal, platformFee, totalCharged, hostPayout };
  }, []);

  const startReservation = useCallback(async (form: ReservationForm) => {
    setState((prev) => ({ ...prev, step: "preparing_checkout", error: null, ticketInstructions: null }));

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState((prev) => ({
          ...prev,
          step: "idle",
          error: "Debes iniciar sesion para reservar este espacio.",
        }));
        return;
      }

      const { data, error } = await supabase.functions.invoke("mp-create-preference", {
        body: { bookingData: form },
      });

      if (error || !data?.bookingId) {
        throw new Error(data?.error ?? error?.message ?? "No se pudo preparar el checkout");
      }

      const booking = await getBookingById(data.bookingId);
      if (!booking) throw new Error("No se pudo cargar la reserva creada");

      attachRealtime(booking.id);

      const mpUrl = import.meta.env.DEV
        ? (data.sandboxInitPoint ?? data.initPoint)
        : data.initPoint;

      setState((prev) => ({
        ...prev,
        step: "payment_ready",
        booking,
        bookingId: booking.id,
        preferenceId: data.preferenceId,
        mpInitPoint: mpUrl,
        checkoutExpiresAt: data.expiresAt ?? booking.checkout_expires_at,
        totalHours: booking.total_hours,
        totalCharged: booking.total_charged,
        hostPayout: booking.host_payout,
        platformFee: booking.platform_fee,
        error: null,
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: "idle",
        error: err instanceof Error ? err.message : "No se pudo preparar el checkout",
      }));
    }
  }, [attachRealtime]);

  const submitEmbeddedPayment = useCallback(async (payload: EmbeddedPaymentPayload) => {
    if (!state.bookingId) {
      setState((prev) => ({ ...prev, error: "Primero debes preparar la reserva." }));
      return;
    }

    setState((prev) => ({ ...prev, step: "processing_payment", error: null }));

    try {
      const submissionId = globalThis.crypto?.randomUUID?.()
        ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;

      const { data, error } = await supabase.functions.invoke("mp-process-payment", {
        body: {
          bookingId: state.bookingId,
          submissionId,
          ...payload,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const nextBooking = data?.booking ?? await getBookingById(state.bookingId);
      if (!nextBooking) throw new Error("No se pudo validar el estado del pago");

      syncFromBooking(nextBooking);
    } catch (err) {
      setState((prev) => ({
        ...prev,
        step: "payment_ready",
        error: humanizePaymentError(err instanceof Error ? err.message : "No se pudo procesar el pago"),
      }));
    }
  }, [state.bookingId, syncFromBooking]);

  const openMercadoPagoWallet = useCallback(() => {
    if (!state.mpInitPoint) {
      setState((prev) => ({
        ...prev,
        error: "No pudimos iniciar Mercado Pago para esta reserva.",
      }));
      return;
    }

    setState((prev) => ({ ...prev, step: "awaiting_confirmation", error: null }));
    window.location.href = state.mpInitPoint;
  }, [state.mpInitPoint]);

  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("mp-release-payment", {
        body: { bookingId, action: "cancel" },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      return { refunded: Boolean(data?.refunded) };
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error cancelando reserva");
    }
  }, []);

  const discardCheckout = useCallback(async () => {
    const currentBookingId = state.bookingId;
    const currentBooking = state.booking;

    if (
      currentBookingId
      && currentBooking
      && currentBooking.status === "pending"
      && currentBooking.payment_status !== "approved"
      && currentBooking.payment_status !== "refunded"
    ) {
      await cancelBooking(currentBookingId);
    }

    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setState(INITIAL_STATE);
  }, [cancelBooking, state.booking, state.bookingId]);

  const reset = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    subscriptionRef.current = null;
    setState(INITIAL_STATE);
  }, []);

  return {
    ...state,
    calculatePrice,
    startReservation,
    submitEmbeddedPayment,
    openMercadoPagoWallet,
    cancelBooking,
    discardCheckout,
    reset,
  };
}

function humanizePaymentError(error: string | null | undefined) {
  const message = (error ?? "").toLowerCase();
  if (!message) return null;
  if (message.includes("cc_rejected_insufficient_amount")) return "La tarjeta no tiene saldo suficiente.";
  if (message.includes("cc_rejected_bad_filled_card_number")) return "Revisa el numero de tarjeta.";
  if (message.includes("cc_rejected_bad_filled_security_code")) return "Revisa el codigo de seguridad.";
  if (message.includes("cc_rejected_bad_filled_date")) return "Revisa la fecha de vencimiento.";
  if (message.includes("cc_rejected_high_risk")) return "El banco rechazo el pago por seguridad. Prueba con otra tarjeta.";
  if (message.includes("cc_rejected_call_for_authorize")) return "Tu banco requiere autorizacion para este pago.";
  return error;
}
