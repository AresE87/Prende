import { useEffect, useState } from "react";
import { Payment } from "@mercadopago/sdk-react";
import { CalendarDays, Clock3, CreditCard, Landmark, ShieldCheck, TimerReset, Users, Wallet } from "lucide-react";
import { Badge, Button, Input, Textarea } from "../shared";
import { hasMercadoPagoPublicKey, initMercadoPagoClient } from "../../lib/payments";
import { useReservation, type EmbeddedPaymentPayload, type ReservationForm } from "../../hooks/useReservation";

interface CheckoutButtonProps {
  spaceId: string;
  pricePerHour: number;
  minHours: number;
  maxGuests: number;
  spaceName: string;
  onConfirmed?: (bookingId: string) => void;
}

const PAYMENT_BRICK_CUSTOMIZATION = {
  visual: {
    hideRedirectionPanel: true,
    defaultPaymentOption: {
      creditCardForm: true,
    },
  },
  paymentMethods: {
    maxInstallments: 6,
    minInstallments: 1,
    types: {
      included: ["creditCard", "debitCard", "ticket"],
    },
  },
};

export default function CheckoutButton({
  spaceId,
  pricePerHour,
  minHours,
  maxGuests,
  spaceName,
  onConfirmed,
}: CheckoutButtonProps) {
  const {
    step,
    booking,
    preferenceId,
    mpInitPoint,
    checkoutExpiresAt,
    error,
    totalCharged,
    ticketInstructions,
    calculatePrice,
    startReservation,
    submitEmbeddedPayment,
    openMercadoPagoWallet,
    discardCheckout,
    reset,
  } = useReservation();

  const [embeddedCheckoutReady, setEmbeddedCheckoutReady] = useState(hasMercadoPagoPublicKey());
  const [brickError, setBrickError] = useState<string | null>(null);
  const [form, setForm] = useState<Omit<ReservationForm, "spaceId">>({
    date: "",
    startTime: "14:00",
    endTime: "17:00",
    guestCount: 1,
    specialRequests: "",
  });

  const priceCalc = form.startTime && form.endTime
    ? calculatePrice(pricePerHour, form.startTime, form.endTime)
    : null;

  const isFormValid = Boolean(
    form.date
    && form.startTime
    && form.endTime
    && priceCalc
    && priceCalc.totalHours >= minHours
    && form.guestCount >= 1
    && form.guestCount <= maxGuests
  );

  useEffect(() => {
    setEmbeddedCheckoutReady(initMercadoPagoClient());
  }, []);

  useEffect(() => {
    if (step === "confirmed" && booking?.id) {
      onConfirmed?.(booking.id);
    }
  }, [step, booking?.id, onConfirmed]);

  useEffect(() => {
    if (step === "payment_ready" && !embeddedCheckoutReady && mpInitPoint) {
      openMercadoPagoWallet();
    }
  }, [step, embeddedCheckoutReady, mpInitPoint, openMercadoPagoWallet]);

  const handlePrepareCheckout = () => {
    if (!isFormValid) return;
    setBrickError(null);
    startReservation({ spaceId, ...form });
  };

  const handleDiscardCheckout = async () => {
    setBrickError(null);
    try {
      await discardCheckout();
    } catch (err) {
      setBrickError(err instanceof Error ? err.message : "No se pudo liberar el checkout.");
    }
  };

  const handlePaymentSubmit = async (
    paymentData: EmbeddedPaymentPayload,
    additionalData?: Record<string, unknown> | null,
  ) => {
    setBrickError(null);
    await submitEmbeddedPayment({
      ...paymentData,
      additionalData: paymentData.additionalData ?? additionalData ?? null,
    });
  };

  if (step === "confirmed" && booking) {
    return (
      <div className="rounded-[28px] border border-emerald-200 bg-[linear-gradient(180deg,#ffffff_0%,#f2fbf5_100%)] p-5 shadow-[0_24px_80px_-40px_rgba(28,25,23,0.35)]">
        <Badge variant="success">Pago acreditado</Badge>
        <h3 className="mt-3 text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Reserva confirmada</h3>
        <p className="mt-1 text-sm text-[#1C1917]/60 font-['Inter']">
          {spaceName} - {formatLongDate(booking.date)} - {sliceTime(booking.start_time)} a {sliceTime(booking.end_time)}
        </p>

        <div className="mt-5 rounded-2xl border border-[#1C1917]/8 bg-white px-4 py-3">
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#1C1917]/35 font-['Inter']">Total pagado</p>
          <p className="mt-1 text-2xl font-bold text-[#D4541B] font-['JetBrains_Mono']">$U {booking.total_charged.toLocaleString("es-UY")}</p>
        </div>

        <div className="mt-5 flex gap-2">
          <Button fullWidth variant="outline" onClick={reset}>Hacer otra reserva</Button>
        </div>
      </div>
    );
  }

  if (step === "awaiting_offline_payment" && booking && ticketInstructions) {
    return (
      <div className="rounded-[28px] border border-amber-200 bg-[linear-gradient(180deg,#fffdf7_0%,#fff6df_100%)] p-5 shadow-[0_24px_80px_-40px_rgba(28,25,23,0.35)]">
        <Badge variant="warning">Pago pendiente</Badge>
        <h3 className="mt-3 text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">
          Completa el pago en {ticketInstructions.methodLabel}
        </h3>
        <p className="mt-1 text-sm text-[#1C1917]/65 font-['Inter']">
          La reserva queda bloqueada mientras el ticket siga vigente. Cuando el pago impacte, la confirmacion sera automatica.
        </p>

        <div className="mt-5 grid gap-3">
          <InfoRow icon={<Landmark size={16} />} label="Red de cobranza" value={ticketInstructions.methodLabel} />
          <InfoRow icon={<TimerReset size={16} />} label="Vence" value={formatDateTime(ticketInstructions.expiresAt)} />
          {ticketInstructions.reference && (
            <InfoRow icon={<CreditCard size={16} />} label="Referencia" value={ticketInstructions.reference} />
          )}
        </div>

        {ticketInstructions.barcode && (
          <div className="mt-4 rounded-2xl border border-dashed border-[#1C1917]/15 bg-white/70 px-4 py-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#1C1917]/35 font-['Inter']">Codigo</p>
            <p className="mt-1 break-all font-['JetBrains_Mono'] text-sm text-[#1C1917]">{ticketInstructions.barcode}</p>
          </div>
        )}

        <div className="mt-5 flex gap-2">
          {ticketInstructions.ticketUrl && (
            <Button fullWidth onClick={() => window.open(ticketInstructions.ticketUrl ?? "", "_blank", "noopener,noreferrer")}>
              Ver comprobante
            </Button>
          )}
          <Button fullWidth variant="outline" onClick={reset}>Cerrar</Button>
        </div>
      </div>
    );
  }

  if (step === "awaiting_confirmation" || step === "processing_payment") {
    return (
      <div className="rounded-[28px] border border-[#1C1917]/10 bg-[linear-gradient(180deg,#ffffff_0%,#faf7f2_100%)] p-5 text-center shadow-[0_24px_80px_-40px_rgba(28,25,23,0.35)]">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#D4541B]/10">
          <span className="h-6 w-6 animate-spin rounded-full border-2 border-[#D4541B] border-t-transparent" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">
          {step === "processing_payment" ? "Procesando pago" : "Esperando confirmacion"}
        </h3>
        <p className="mt-2 text-sm text-[#1C1917]/60 font-['Inter']">
          No cierres esta ventana mientras validamos la operacion con Mercado Pago.
        </p>
      </div>
    );
  }

  const showPaymentPanel = step === "payment_ready" && booking && preferenceId;

  return (
    <div className="rounded-[30px] border border-[#1C1917]/10 bg-[linear-gradient(180deg,#ffffff_0%,#faf7f2_100%)] shadow-[0_28px_90px_-48px_rgba(28,25,23,0.38)] overflow-hidden">
      <div className="border-b border-[#1C1917]/8 bg-[radial-gradient(circle_at_top_left,#f7e0d5_0%,transparent_42%),linear-gradient(180deg,#fffaf6_0%,#ffffff_100%)] px-5 pb-5 pt-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[#1C1917]/35 font-['Inter']">Checkout seguro</p>
            <h3 className="mt-1 text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{spaceName}</h3>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#D4541B] font-['JetBrains_Mono']">$U {pricePerHour.toLocaleString("es-UY")}</p>
            <p className="text-xs text-[#1C1917]/45 font-['Inter']">por hora</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Badge variant="default">Tarjeta credito</Badge>
          <Badge variant="default">Tarjeta debito</Badge>
          <Badge variant="warning">Abitab</Badge>
          <Badge variant="warning">Red Pagos</Badge>
          <Badge variant="brasa">Mercado Pago</Badge>
        </div>
      </div>

      {!showPaymentPanel ? (
        <div className="space-y-5 px-5 pb-5 pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              label="Fecha"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={form.date}
              onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Desde"
                type="time"
                step="1800"
                value={form.startTime}
                onChange={(event) => setForm((prev) => ({ ...prev, startTime: event.target.value }))}
              />
              <Input
                label="Hasta"
                type="time"
                step="1800"
                min={form.startTime}
                value={form.endTime}
                onChange={(event) => setForm((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,180px)_1fr]">
            <Input
              label="Personas"
              type="number"
              min="1"
              max={String(maxGuests)}
              value={String(form.guestCount)}
              onChange={(event) => setForm((prev) => ({
                ...prev,
                guestCount: Number(event.target.value || 1),
              }))}
            />
            <Textarea
              label="Pedidos especiales"
              rows={3}
              placeholder="Alergias, horario de llegada, datos relevantes para el anfitrion."
              value={form.specialRequests}
              onChange={(event) => setForm((prev) => ({ ...prev, specialRequests: event.target.value }))}
            />
          </div>

          <div className="rounded-[24px] border border-[#1C1917]/8 bg-white px-4 py-4">
            <div className="grid gap-2 text-sm text-[#1C1917]/62 font-['Inter']">
              <SummaryLine icon={<CalendarDays size={15} />} label="Fecha" value={form.date ? formatLongDate(form.date) : "Selecciona una fecha"} />
              <SummaryLine icon={<Clock3 size={15} />} label="Horario" value={`${form.startTime} a ${form.endTime}`} />
              <SummaryLine icon={<Users size={15} />} label="Invitados" value={`${form.guestCount} personas`} />
            </div>

            <div className="mt-4 border-t border-[#1C1917]/8 pt-4">
              {priceCalc ? (
                <div className="space-y-2 text-sm font-['Inter']">
                  <PriceRow label={`$U ${pricePerHour.toLocaleString("es-UY")} x ${priceCalc.totalHours}h`} value={`$U ${priceCalc.subtotal.toLocaleString("es-UY")}`} />
                  <PriceRow label="Fee de servicio" value={`$U ${priceCalc.platformFee.toLocaleString("es-UY")}`} muted />
                  <PriceRow label="Tu pago hoy" value={`$U ${priceCalc.totalCharged.toLocaleString("es-UY")}`} strong />
                </div>
              ) : (
                <p className="text-sm text-[#1C1917]/45 font-['Inter']">Completa fecha y horario para ver el total.</p>
              )}
            </div>
          </div>

          {priceCalc && priceCalc.totalHours < minHours && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-['Inter']">
              El minimo para este espacio es de {minHours} horas.
            </div>
          )}

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-['Inter']">
              {error}
            </div>
          )}

          <Button fullWidth size="lg" onClick={handlePrepareCheckout} disabled={!isFormValid} loading={step === "preparing_checkout"}>
            Bloquear horario y continuar al pago
          </Button>

          <p className="px-2 text-center text-xs leading-relaxed text-[#1C1917]/48 font-['Inter']">
            El horario se bloquea al preparar el checkout. Tus datos de tarjeta se tokenizan con Mercado Pago.
          </p>
        </div>
      ) : (
        <div className="space-y-5 px-5 pb-5 pt-5">
          <div className="rounded-[24px] border border-[#1C1917]/8 bg-white px-4 py-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#1C1917]/35 font-['Inter']">Reserva preparada</p>
                <p className="mt-1 text-sm font-semibold text-[#1C1917] font-['Inter']">
                  {formatLongDate(booking.date)} - {sliceTime(booking.start_time)} a {sliceTime(booking.end_time)}
                </p>
              </div>
              <Badge variant="brasa">$U {totalCharged.toLocaleString("es-UY")}</Badge>
            </div>

            <div className="mt-4 grid gap-2 text-sm text-[#1C1917]/62 font-['Inter']">
              <SummaryLine icon={<Users size={15} />} label="Invitados" value={`${booking.guest_count} personas`} />
              <SummaryLine icon={<TimerReset size={15} />} label="Checkout valido hasta" value={formatDateTime(checkoutExpiresAt)} />
            </div>
          </div>

          {embeddedCheckoutReady ? (
            <div className="rounded-[24px] border border-[#1C1917]/8 bg-white px-4 py-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#1C1917]/35 font-['Inter']">Pago embebido</p>
                  <h4 className="mt-1 text-base font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">
                    Tarjetas, Abitab y Red Pagos
                  </h4>
                </div>
                <Badge variant="success">PCI by MP</Badge>
              </div>

              <Payment
                key={booking.id}
                initialization={{
                  amount: totalCharged,
                  preferenceId,
                }}
                customization={PAYMENT_BRICK_CUSTOMIZATION}
                locale="es-UY"
                onSubmit={handlePaymentSubmit}
                onError={(event) => {
                  const brickMessage = typeof event?.message === "string"
                    ? event.message
                    : "No se pudo renderizar el checkout embebido.";
                  setBrickError(brickMessage);
                }}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 font-['Inter']">
              Falta configurar `VITE_MP_PUBLIC_KEY` para habilitar tarjetas y pagos en redes locales dentro de la app.
            </div>
          )}

          {(brickError || error) && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-['Inter']">
              {brickError || error}
            </div>
          )}

          <div className="rounded-[24px] border border-[#D4541B]/15 bg-[#FFF5EF] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#D4541B]/10 p-2 text-[#D4541B]">
                <Wallet size={16} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-[#1C1917] font-['Inter']">Preferis pagar con tu cuenta Mercado Pago?</h4>
                <p className="mt-1 text-sm text-[#1C1917]/60 font-['Inter']">
                  Tambien puedes completar la reserva con wallet y medios guardados en Mercado Pago.
                </p>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button fullWidth variant="outline" onClick={openMercadoPagoWallet} disabled={!mpInitPoint}>
                Ir a Mercado Pago
              </Button>
              <Button fullWidth variant="ghost" onClick={() => void handleDiscardCheckout()}>
                Cambiar datos
              </Button>
            </div>
          </div>

          <div className="rounded-[24px] border border-[#4A5E3A]/15 bg-[#F5F8F1] px-4 py-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-full bg-[#4A5E3A]/10 p-2 text-[#4A5E3A]">
                <ShieldCheck size={16} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#1C1917] font-['Inter']">Seguridad y confirmacion</h4>
                <p className="mt-1 text-sm text-[#1C1917]/60 font-['Inter']">
                  Prende no almacena datos de tarjeta. El backend valida la reserva y el webhook confirma el pago en tiempo real.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryLine({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-[#1C1917]/48">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-right text-[#1C1917]">{value}</span>
    </div>
  );
}

function PriceRow({ label, value, muted = false, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={muted ? "text-[#1C1917]/45" : "text-[#1C1917]/68"}>{label}</span>
      <span className={strong ? "font-bold text-[#1C1917] font-['JetBrains_Mono']" : "font-['JetBrains_Mono'] text-[#1C1917]"}>
        {value}
      </span>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-[#1C1917]/8 bg-white/70 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-[#1C1917]/55 font-['Inter']">
        {icon}
        <span>{label}</span>
      </div>
      <span className="text-right text-sm font-semibold text-[#1C1917] font-['Inter']">{value || "-"}</span>
    </div>
  );
}

function formatLongDate(value: string) {
  if (!value) return "-";
  return new Date(`${value}T12:00:00`).toLocaleDateString("es-UY", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "-";
  return new Date(value).toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function sliceTime(value: string) {
  return String(value).slice(0, 5);
}
