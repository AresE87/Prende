import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarDays, Clock3, Ticket, ArrowUpRight, WalletCards } from "lucide-react";
import { Button, Card, StatusBadge, EmptyState, PageContainer, SectionTitle, Skeleton, Badge } from "../components/shared";
import { getTicketInstructions } from "../lib/payments";
import { formatUYU, formatDate } from "../lib/utils";
import { getMyBookings } from "../lib/supabase";
import { useReservation } from "../hooks/useReservation";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400";

export default function MyBookings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { cancelBooking } = useReservation();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const data = await getMyBookings("guest");
        if (!cancelled) setBookings(data);
      } catch (err) {
        console.error("Error cargando reservas:", err);
        if (!cancelled) setError("No pudimos cargar tus reservas.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  const paymentMessage = useMemo(() => {
    const payment = searchParams.get("payment");
    const bookingId = searchParams.get("bookingId");
    if (!payment) return null;

    const base = bookingId ? `Reserva ${bookingId.slice(0, 8)}.` : "Tu reserva.";

    if (payment === "success") return { type: "success", text: `${base} Pago acreditado correctamente.` };
    if (payment === "pending") return { type: "warning", text: `${base} Pago pendiente de confirmacion.` };
    if (payment === "failure") return { type: "danger", text: `${base} El pago no pudo completarse.` };
    return null;
  }, [searchParams]);

  const now = new Date();

  const upcoming = bookings.filter((booking) => {
    const status = booking.status;
    if (["cancelled", "refunded", "completed"].includes(status)) return false;
    const bookingDate = new Date(`${booking.date}T${normalizeTime(booking.start_time)}:00`);
    return bookingDate >= now;
  });

  const past = bookings.filter((booking) => {
    const bookingDate = new Date(`${booking.date}T${normalizeTime(booking.start_time)}:00`);
    return bookingDate < now || ["cancelled", "refunded", "completed"].includes(booking.status);
  });

  async function handleCancel(bookingId) {
    const confirmed = window.confirm("Seguro que quieres cancelar esta reserva?");
    if (!confirmed) return;

    setActionLoadingId(bookingId);
    try {
      const result = await cancelBooking(bookingId);
      setBookings((prev) => prev.map((booking) => {
        if (booking.id !== bookingId) return booking;
        return {
          ...booking,
          status: "cancelled",
          payment_status: result?.refunded ? "refunded" : booking.payment_status,
        };
      }));
    } catch (err) {
      alert(err instanceof Error ? err.message : "No se pudo cancelar la reserva");
    } finally {
      setActionLoadingId(null);
    }
  }

  return (
    <PageContainer>
      <section className="section-shell rounded-[40px] px-5 py-6 sm:px-8 sm:py-8">
        <SectionTitle sub="Estado, comprobantes y proximos pasos dentro de una vista mas ejecutiva del viaje de reserva." className="mb-0">
          Mis reservas
        </SectionTitle>
      </section>

      {paymentMessage && (
        <div className={`mt-6 rounded-[26px] border px-4 py-4 text-sm ${paymentMessage.type === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : paymentMessage.type === "warning" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}>
          {paymentMessage.text}
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-[26px] border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="rounded-[34px] p-4">
              <div className="flex gap-4">
                <Skeleton className="h-24 w-28 rounded-[22px]" />
                <div className="flex-1 space-y-3 py-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="-"
            title="Todavia no tienes reservas"
            description="Explora espacios, compara zonas y prepara tu primera reserva con una experiencia de pago mas robusta."
            action={<Button onClick={() => navigate("/buscar")}>Explorar espacios</Button>}
          />
        </div>
      ) : (
        <div className="mt-8 space-y-10">
          {upcoming.length > 0 && (
            <SectionBlock title="Proximas" subtitle="Reservas activas o pendientes de acreditacion.">
              {upcoming.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  navigate={navigate}
                  onCancel={handleCancel}
                  cancelling={actionLoadingId === booking.id}
                />
              ))}
            </SectionBlock>
          )}

          {past.length > 0 && (
            <SectionBlock title="Historial" subtitle="Reservas cerradas, canceladas o ya disfrutadas.">
              {past.map((booking) => (
                <BookingRow
                  key={booking.id}
                  booking={booking}
                  navigate={navigate}
                  past
                />
              ))}
            </SectionBlock>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function SectionBlock({ title, subtitle, children }) {
  return (
    <section>
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Panel</p>
          <h2 className="mt-2 text-3xl font-semibold text-[#171616]">{title}</h2>
        </div>
        <p className="max-w-xl text-sm leading-relaxed text-[#171616]/58">{subtitle}</p>
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function BookingRow({ booking, navigate, past = false, onCancel, cancelling = false }) {
  const image = Array.isArray(booking?.space?.photos) && booking.space.photos.length > 0
    ? booking.space.photos[0]
    : PLACEHOLDER_IMAGE;

  const ticketInstructions = getTicketInstructions(booking);
  const isTicketPending = booking.payment_method_type === "ticket" && booking.payment_status === "pending";

  const status = booking.payment_status === "rejected"
    ? "rejected"
    : booking.payment_status === "pending" && booking.status === "pending"
      ? "pending"
      : booking.status;

  const showCancel = !past && ["pending", "paid", "confirmed"].includes(booking.status);
  const showReview = past && booking.status === "completed";
  const showVoucher = Boolean(ticketInstructions.ticketUrl) && isTicketPending;

  return (
    <Card className="rounded-[34px] overflow-hidden p-0">
      <div className="grid gap-0 lg:grid-cols-[240px_minmax(0,1fr)]">
        <img src={image} alt={booking?.space?.title ?? "Espacio"} className="h-60 w-full object-cover lg:h-full" />
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{booking?.space?.neighborhood ?? "Montevideo"}</Badge>
                {isTicketPending && <Badge variant="warning">Ticket pendiente</Badge>}
              </div>
              <h3 className="mt-4 text-2xl font-semibold text-[#171616]">{booking?.space?.title ?? "Espacio"}</h3>
              <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#171616]/58">
                <span className="inline-flex items-center gap-2"><CalendarDays size={14} /> {formatDate(`${booking.date}T12:00:00`)}</span>
                <span className="inline-flex items-center gap-2"><Clock3 size={14} /> {normalizeTime(booking.start_time)} - {normalizeTime(booking.end_time)}</span>
                <span className="inline-flex items-center gap-2"><WalletCards size={14} /> {formatUYU(booking.total_charged)}</span>
              </div>
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <InfoCell label="Invitados" value={`${booking.guest_count} personas`} />
            <InfoCell label="Pago" value={booking.payment_method_type === "ticket" ? "Red local" : booking.payment_method_type === "account_money" ? "Wallet" : "Tarjeta"} />
            <InfoCell label="Reserva" value={booking.id.slice(0, 8)} mono />
          </div>

          {isTicketPending && (
            <div className="mt-5 rounded-[26px] border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-800">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
                  <Ticket size={16} />
                </div>
                <div>
                  <p className="font-semibold">Completa el pago en {ticketInstructions.methodLabel}</p>
                  <p className="mt-1 text-sm leading-relaxed text-amber-700">
                    Vence: {formatPendingDate(ticketInstructions.expiresAt)}
                    {ticketInstructions.reference ? ` · Ref. ${ticketInstructions.reference}` : ""}
                  </p>
                </div>
              </div>
            </div>
          )}

          {(showCancel || showReview || showVoucher) && (
            <div className="mt-5 flex flex-col gap-3 border-t border-[#171616]/8 pt-5 sm:flex-row sm:justify-end">
              {showVoucher && (
                <Button size="sm" variant="outline" onClick={() => window.open(ticketInstructions.ticketUrl ?? "", "_blank", "noopener,noreferrer")}>
                  Ver comprobante
                </Button>
              )}
              {showCancel && (
                <Button size="sm" variant="danger" loading={cancelling} onClick={() => onCancel?.(booking.id)}>
                  Cancelar
                </Button>
              )}
              {showReview && (
                <Button size="sm" onClick={() => navigate(`/reseña/${booking.id}`)}>
                  Dejar reseña
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => navigate(`/espacio/${booking.space_id}`)}>
                Ver espacio <ArrowUpRight size={14} />
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function InfoCell({ label, value, mono = false }) {
  return (
    <div className="rounded-[22px] border border-[#171616]/8 bg-white/75 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">{label}</p>
      <p className={`mt-1 text-sm font-semibold text-[#171616] ${mono ? "font-mono" : ""}`}>{value}</p>
    </div>
  );
}

function normalizeTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}

function formatPendingDate(value) {
  if (!value) return "sin vencimiento informado";
  return new Date(value).toLocaleString("es-UY", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
