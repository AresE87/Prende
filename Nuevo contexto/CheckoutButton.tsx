// src/components/CheckoutButton.tsx
// Botón de pago con resumen de precio y flujo de reserva completo

import { useState, useEffect, useMemo } from "react";
import { useReservation, type ReservationForm } from "../hooks/useReservation";

interface CheckoutButtonProps {
  spaceId:      string;
  pricePerHour: number;      // UYU
  minHours:     number;
  maxGuests:    number;
  spaceName:    string;
  onConfirmed?: (bookingId: string) => void;
}

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
    error,
    calculatePrice,
    startReservation,
    checkPaymentStatus,
    reset,
  } = useReservation();

  const [form, setForm] = useState<Omit<ReservationForm, "spaceId">>({
    date:            "",
    startTime:       "14:00",
    endTime:         "17:00",
    guestCount:      1,
    specialRequests: "",
  });

  // Detectar retorno de MP por URL params
  useEffect(() => {
    const urlParams   = new URLSearchParams(window.location.search);
    const prefId      = urlParams.get("preference_id");
    const status      = urlParams.get("status");

    if (prefId && status) {
      checkPaymentStatus(prefId);
      // Limpiar params de la URL
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [checkPaymentStatus]);

  // Notificar cuando se confirma la reserva
  useEffect(() => {
    if (booking?.id && step === "confirmed") {
      onConfirmed?.(booking.id);
    }
  }, [step, booking?.id, onConfirmed]);

  // Calcular precio en tiempo real
  const priceCalc = useMemo(() => {
    if (!form.startTime || !form.endTime) return null;
    return calculatePrice(pricePerHour, form.startTime, form.endTime);
  }, [pricePerHour, form.startTime, form.endTime, calculatePrice]);

  const isFormValid = form.date && form.startTime && form.endTime && priceCalc &&
    priceCalc.totalHours >= minHours && form.guestCount >= 1 && form.guestCount <= maxGuests;

  const handleSubmit = () => {
    if (!isFormValid) return;
    startReservation({ spaceId, ...form });
  };

  // ── Estados del flujo ─────────────────────────────────────

  if (step === "confirmed" && booking) {
    return (
      <div style={{
        background:   "rgba(76,175,125,0.1)",
        border:       "1px solid rgba(76,175,125,0.3)",
        borderRadius: 16,
        padding:      "24px",
        textAlign:    "center",
      }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
        <h3 style={{ color: "#4CAF7D", fontFamily: "'Playfair Display', serif", margin: "0 0 8px", fontSize: 20 }}>
          ¡Reserva confirmada!
        </h3>
        <p style={{ color: "#888", fontSize: 13, margin: "0 0 16px" }}>
          {formatDate(booking.date)} · {booking.start_time}–{booking.end_time}
        </p>
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: 10, padding: "12px 16px", marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Total pagado</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#4CAF7D" }}>
            $U {booking.total_charged.toLocaleString("es-UY")}
          </div>
        </div>
        <p style={{ color: "#555", fontSize: 12, margin: 0 }}>
          Recibirás una confirmación por WhatsApp y email.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop:    16,
            background:   "none",
            border:       "1px solid rgba(255,255,255,0.15)",
            borderRadius: 8,
            padding:      "8px 16px",
            color:        "#888",
            fontSize:     12,
            cursor:       "pointer",
          }}
        >
          Hacer otra reserva
        </button>
      </div>
    );
  }

  if (step === "waiting_payment" || step === "redirecting_to_mp") {
    return (
      <div style={{
        background:   "rgba(255,120,30,0.08)",
        border:       "1px solid rgba(255,120,30,0.2)",
        borderRadius: 16,
        padding:      "32px 24px",
        textAlign:    "center",
      }}>
        <div style={{ fontSize: 32, marginBottom: 16, animation: "pulse 1.5s infinite" }}>⏳</div>
        <p style={{ color: "#F5ECD7", fontSize: 14, margin: "0 0 8px" }}>
          {step === "redirecting_to_mp" ? "Redirigiendo a MercadoPago..." : "Esperando confirmación del pago..."}
        </p>
        <p style={{ color: "#666", fontSize: 12, margin: 0 }}>
          No cerrés esta ventana
        </p>
      </div>
    );
  }

  return (
    <div style={{
      background:   "rgba(255,255,255,0.03)",
      border:       "1px solid rgba(255,255,255,0.08)",
      borderRadius: 16,
      overflow:     "hidden",
    }}>
      {/* Header */}
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#FF7820", fontFamily: "'Playfair Display', serif", marginBottom: 4 }}>
          $U {pricePerHour.toLocaleString("es-UY")}
          <span style={{ fontSize: 13, color: "#666", fontWeight: 400, fontFamily: "'DM Sans', sans-serif" }}>/hora</span>
        </div>
        {priceCalc && (
          <div style={{ fontSize: 12, color: "#888" }}>
            {priceCalc.totalHours}h · Total: $U {priceCalc.totalCharged.toLocaleString("es-UY")}
          </div>
        )}
      </div>

      {/* Formulario */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>

        {/* Fecha */}
        <Field label="Fecha">
          <Input
            type="date"
            value={form.date}
            min={new Date().toISOString().split("T")[0]}
            onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
          />
        </Field>

        {/* Horario */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="Desde">
            <Input
              type="time"
              value={form.startTime}
              onChange={e => setForm(prev => ({ ...prev, startTime: e.target.value }))}
            />
          </Field>
          <Field label="Hasta">
            <Input
              type="time"
              value={form.endTime}
              min={form.startTime}
              onChange={e => setForm(prev => ({ ...prev, endTime: e.target.value }))}
            />
          </Field>
        </div>

        {/* Validación de horas mínimas */}
        {priceCalc && priceCalc.totalHours < minHours && (
          <p style={{ margin: 0, fontSize: 12, color: "#FF5C5C" }}>
            Mínimo {minHours} horas por reserva
          </p>
        )}

        {/* Personas */}
        <Field label={`Personas (máx. ${maxGuests})`}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => setForm(prev => ({ ...prev, guestCount: Math.max(1, prev.guestCount - 1) }))}
              style={counterBtnStyle}
            >−</button>
            <span style={{ color: "#F5ECD7", fontSize: 16, fontWeight: 600, minWidth: 24, textAlign: "center" }}>
              {form.guestCount}
            </span>
            <button
              onClick={() => setForm(prev => ({ ...prev, guestCount: Math.min(maxGuests, prev.guestCount + 1) }))}
              style={counterBtnStyle}
            >+</button>
          </div>
        </Field>

        {/* Pedidos especiales */}
        <Field label="Pedidos especiales (opcional)">
          <textarea
            value={form.specialRequests}
            onChange={e => setForm(prev => ({ ...prev, specialRequests: e.target.value }))}
            placeholder="Alergias, necesidades especiales, etc."
            rows={2}
            style={{
              ...inputBaseStyle,
              resize:  "vertical",
              minHeight: 60,
            }}
          />
        </Field>

        {/* Resumen de precio */}
        {priceCalc && priceCalc.totalHours >= minHours && (
          <div style={{
            background:   "rgba(0,0,0,0.2)",
            borderRadius: 10,
            padding:      "14px 16px",
          }}>
            <PriceLine label={`$U ${pricePerHour.toLocaleString("es-UY")} × ${priceCalc.totalHours}h`} value={`$U ${priceCalc.subtotal.toLocaleString("es-UY")}`} />
            <PriceLine label="Fee de servicio (15%)" value={`$U ${priceCalc.platformFee.toLocaleString("es-UY")}`} sub />
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginTop: 10, paddingTop: 10 }}>
              <PriceLine label="Total" value={`$U ${priceCalc.totalCharged.toLocaleString("es-UY")}`} bold />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background:   "rgba(255,92,92,0.1)",
            border:       "1px solid rgba(255,92,92,0.3)",
            borderRadius: 8,
            padding:      "10px 12px",
            fontSize:     13,
            color:        "#FF5C5C",
          }}>
            {error}
          </div>
        )}

        {/* Botón de pago */}
        <button
          onClick={handleSubmit}
          disabled={!isFormValid || step !== "idle"}
          style={{
            background:   isFormValid ? "linear-gradient(135deg, #FF7820, #FF9340)" : "rgba(255,255,255,0.08)",
            border:       "none",
            borderRadius: 12,
            padding:      "14px",
            color:        isFormValid ? "#0D0A07" : "#555",
            fontSize:     15,
            fontWeight:   700,
            cursor:       isFormValid ? "pointer" : "not-allowed",
            transition:   "all 0.2s ease",
            width:        "100%",
          }}
        >
          {step === "creating_preference" ? "⏳ Preparando pago..." : "🔥 Reservar ahora"}
        </button>

        <p style={{ margin: 0, fontSize: 11, color: "#444", textAlign: "center", lineHeight: 1.6 }}>
          No se te cobra nada ahora. Serás redirigido a MercadoPago para completar el pago de forma segura.
          <br />Cancelación gratuita hasta 24h antes.
        </p>
      </div>
    </div>
  );
}

// ─── SUBCOMPONENTS ───────────────────────────────────────────

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label style={{ fontSize: 12, color: "#888", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>
        {label.toUpperCase()}
      </label>
      {children}
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} style={{ ...inputBaseStyle, ...props.style }} />;
}

function PriceLine({ label, value, sub, bold }: { label: string; value: string; sub?: boolean; bold?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: sub || bold ? 4 : 0 }}>
      <span style={{ fontSize: sub ? 12 : 13, color: sub ? "#666" : "#888" }}>{label}</span>
      <span style={{ fontSize: sub ? 12 : 13, color: bold ? "#FF7820" : "#F5ECD7", fontWeight: bold ? 700 : 400 }}>{value}</span>
    </div>
  );
}

// ─── STYLES ──────────────────────────────────────────────────

const inputBaseStyle: React.CSSProperties = {
  width:        "100%",
  background:   "rgba(255,255,255,0.06)",
  border:       "1px solid rgba(255,255,255,0.12)",
  borderRadius: 8,
  padding:      "10px 12px",
  color:        "#F5ECD7",
  fontSize:     14,
  outline:      "none",
  fontFamily:   "inherit",
  boxSizing:    "border-box",
};

const counterBtnStyle: React.CSSProperties = {
  width:        32,
  height:       32,
  borderRadius: 8,
  background:   "rgba(255,255,255,0.08)",
  border:       "1px solid rgba(255,255,255,0.12)",
  color:        "#F5ECD7",
  fontSize:     18,
  cursor:       "pointer",
  display:      "flex",
  alignItems:   "center",
  justifyContent: "center",
  lineHeight:   1,
};

// ─── HELPERS ─────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  return date.toLocaleDateString("es-UY", {
    weekday: "long", day: "numeric", month: "long"
  });
}
