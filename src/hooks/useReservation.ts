// src/hooks/useReservation.ts
// Hook que maneja el flujo completo de una reserva:
// selección de horario → creación de preferencia → polling de estado

import { useState, useCallback, useEffect, useRef } from "react";
import { supabase, subscribeToBookingStatus, type Booking } from "../lib/supabase";

// ─── TIPOS ───────────────────────────────────────────────────

export interface ReservationForm {
  spaceId:         string;
  date:            string;    // YYYY-MM-DD
  startTime:       string;    // HH:MM
  endTime:         string;    // HH:MM
  guestCount:      number;
  specialRequests: string;
}

export type ReservationStep =
  | "idle"
  | "validating"
  | "creating_preference"
  | "redirecting_to_mp"
  | "waiting_payment"
  | "confirmed"
  | "error"
  | "cancelled";

export interface ReservationState {
  step:            ReservationStep;
  booking:         Booking | null;
  preferenceId:    string | null;
  mpInitPoint:     string | null;
  error:           string | null;
  totalHours:      number;
  totalCharged:    number;    // UYU — lo que paga el guest
  hostPayout:      number;    // UYU — lo que recibe el host
  platformFee:     number;    // UYU — comisión de Prende
}

// ─── HOOK ────────────────────────────────────────────────────

export function useReservation() {
  const [state, setState] = useState<ReservationState>({
    step:          "idle",
    booking:       null,
    preferenceId:  null,
    mpInitPoint:   null,
    error:         null,
    totalHours:    0,
    totalCharged:  0,
    hostPayout:    0,
    platformFee:   0,
  });

  const subscriptionRef = useRef<ReturnType<typeof subscribeToBookingStatus> | null>(null);

  // Limpiar suscripción al desmontar
  useEffect(() => {
    return () => {
      subscriptionRef.current?.unsubscribe();
    };
  }, []);

  /**
   * Calcula el precio estimado antes de iniciar el pago.
   * Útil para mostrar el resumen en el UI antes de confirmar.
   */
  const calculatePrice = useCallback((
    pricePerHour: number,
    startTime:    string,
    endTime:      string
  ) => {
    const TAKE_RATE = parseFloat(import.meta.env.VITE_TAKE_RATE ?? "0.15");

    const [startH, startM] = startTime.split(":").map(Number);
    const [endH, endM]     = endTime.split(":").map(Number);
    const totalHours       = ((endH * 60 + endM) - (startH * 60 + startM)) / 60;

    if (totalHours <= 0) return null;

    const subtotal    = Math.round(pricePerHour * totalHours);
    const platformFee = Math.round(subtotal * TAKE_RATE);
    const totalCharged = subtotal + platformFee;
    const hostPayout   = subtotal - Math.round(subtotal * TAKE_RATE);

    return { totalHours, subtotal, platformFee, totalCharged, hostPayout };
  }, []);

  /**
   * Inicia el flujo de reserva:
   * 1. Valida que el usuario está autenticado
   * 2. Crea la preferencia de pago en MercadoPago
   * 3. Redirige al usuario a MP o abre el checkout
   */
  const startReservation = useCallback(async (form: ReservationForm) => {
    setState(prev => ({ ...prev, step: "validating", error: null }));

    try {
      // Verificar autenticación
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setState(prev => ({ ...prev, step: "error", error: "Debés iniciar sesión para hacer una reserva" }));
        return;
      }

      setState(prev => ({ ...prev, step: "creating_preference" }));

      // Llamar a la Edge Function
      const { data, error } = await supabase.functions.invoke("mp-create-preference", {
        body: { bookingData: form },
      });

      if (error || !data?.preferenceId) {
        throw new Error(data?.error ?? error?.message ?? "Error creando preferencia de pago");
      }

      const { preferenceId, initPoint, sandboxInitPoint } = data;

      // Determinar si usamos sandbox o producción
      const mpUrl = import.meta.env.DEV ? sandboxInitPoint : initPoint;

      setState(prev => ({
        ...prev,
        step:         "redirecting_to_mp",
        preferenceId,
        mpInitPoint:  mpUrl,
      }));

      // Suscribirse a cambios en tiempo real de la reserva
      subscriptionRef.current = subscribeToBookingStatus(preferenceId, (updatedBooking) => {
        if (updatedBooking.status === "paid" || updatedBooking.status === "confirmed") {
          setState(prev => ({
            ...prev,
            step:         "confirmed",
            booking:      updatedBooking,
            totalCharged: updatedBooking.total_charged,
            hostPayout:   updatedBooking.host_payout,
            platformFee:  updatedBooking.platform_fee,
          }));
          subscriptionRef.current?.unsubscribe();
        } else if (updatedBooking.status === "cancelled") {
          setState(prev => ({ ...prev, step: "cancelled" }));
        }
      });

      // Redirigir a MercadoPago
      window.location.href = mpUrl;

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Error desconocido";
      setState(prev => ({ ...prev, step: "error", error: errorMsg }));
    }
  }, []);

  /**
   * Verifica el estado de una reserva por preferenceId.
   * Llamar desde la página de retorno de MP (back_url).
   */
  const checkPaymentStatus = useCallback(async (preferenceId: string) => {
    setState(prev => ({ ...prev, step: "waiting_payment", preferenceId }));

    try {
      const { data: booking } = await supabase
        .from("bookings")
        .select("*")
        .eq("mp_preference_id", preferenceId)
        .maybeSingle();

      if (!booking) {
        // Aún no procesado — esperar con polling
        startPolling(preferenceId);
        return;
      }

      if (booking.status === "paid" || booking.status === "confirmed") {
        setState(prev => ({
          ...prev,
          step:         "confirmed",
          booking,
          totalCharged: booking.total_charged,
          platformFee:  booking.platform_fee,
          hostPayout:   booking.host_payout,
        }));
      } else if (booking.status === "cancelled") {
        setState(prev => ({ ...prev, step: "cancelled" }));
      } else {
        startPolling(preferenceId);
      }

    } catch (err) {
      setState(prev => ({ ...prev, step: "error", error: "Error verificando el pago" }));
    }
  }, []);

  /**
   * Polling como fallback si el realtime no funciona.
   * Reintentos cada 3 segundos, máximo 20 veces (1 minuto).
   */
  const startPolling = useCallback((preferenceId: string) => {
    let attempts = 0;
    const MAX_ATTEMPTS = 20;

    const poll = async () => {
      attempts++;
      if (attempts > MAX_ATTEMPTS) {
        setState(prev => ({
          ...prev,
          step:  "error",
          error: "El pago tardó demasiado en confirmarse. Si ya pagaste, contactanos.",
        }));
        return;
      }

      try {
        const { data: booking } = await supabase
          .from("bookings")
          .select("*")
          .eq("mp_preference_id", preferenceId)
          .in("status", ["paid", "confirmed"])
          .maybeSingle();

        if (booking) {
          setState(prev => ({
            ...prev,
            step:    "confirmed",
            booking,
          }));
          return; // Detener polling
        }

        // Reintentar
        setTimeout(poll, 3000);

      } catch {
        setTimeout(poll, 3000);
      }
    };

    setTimeout(poll, 2000); // Primera verificación a los 2 segundos
  }, []);

  /**
   * Cancela una reserva y solicita reembolso si aplica.
   */
  const cancelBooking = useCallback(async (bookingId: string) => {
    try {
      const { data: booking } = await supabase
        .from("bookings")
        .select("cancellation_deadline, status")
        .eq("id", bookingId)
        .single();

      if (!booking) throw new Error("Reserva no encontrada");
      if (!["paid", "confirmed"].includes(booking.status)) {
        throw new Error("Esta reserva no puede ser cancelada");
      }

      const canRefund = new Date() < new Date(booking.cancellation_deadline);

      if (canRefund) {
        // Solicitar reembolso via Edge Function
        const { error } = await supabase.functions.invoke("mp-release-payment", {
          body: { bookingId, action: "refund" },
        });
        if (error) throw error;
      } else {
        // Sin reembolso — solo cancelar
        await supabase
          .from("bookings")
          .update({ status: "cancelled" })
          .eq("id", bookingId);
      }

      return { refunded: canRefund };

    } catch (err) {
      throw new Error(err instanceof Error ? err.message : "Error cancelando reserva");
    }
  }, []);

  const reset = useCallback(() => {
    subscriptionRef.current?.unsubscribe();
    setState({
      step:         "idle",
      booking:      null,
      preferenceId: null,
      mpInitPoint:  null,
      error:        null,
      totalHours:   0,
      totalCharged: 0,
      hostPayout:   0,
      platformFee:  0,
    });
  }, []);

  return {
    ...state,
    calculatePrice,
    startReservation,
    checkPaymentStatus,
    cancelBooking,
    reset,
  };
}
