import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button, Card, StatusBadge, EmptyState, PageContainer, SectionTitle, Skeleton } from "../components/shared";
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
    if (payment === "pending") return { type: "warning", text: `${base} Pago pendiente de confirmaciÃ³n.` };
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
    const confirmed = window.confirm("Â¿Seguro que querÃ©s cancelar esta reserva?");
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
      <SectionTitle sub="Historial completo de tus reservas en Prende">Mis reservas</SectionTitle>

      {paymentMessage && (
        <div className={`mb-6 rounded-xl border px-4 py-3 text-sm font-['Inter'] ${paymentMessage.type === "success" ? "bg-green-50 border-green-200 text-green-700" : paymentMessage.type === "warning" ? "bg-amber-50 border-amber-200 text-amber-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {paymentMessage.text}
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 font-['Inter']">
          {error}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-24 h-20 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          icon="??"
          title="No tenÃ©s reservas aÃºn"
          description="ExplorÃ¡ los mejores espacios con parrilla en Montevideo y hacÃ© tu primera reserva."
          action={<Button onClick={() => navigate("/buscar")}>Explorar espacios</Button>}
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">PrÃ³ximas</h2>
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    navigate={navigate}
                    onCancel={handleCancel}
                    cancelling={actionLoadingId === booking.id}
                  />
                ))}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">Historial</h2>
              <div className="space-y-3">
                {past.map((booking) => (
                  <BookingRow
                    key={booking.id}
                    booking={booking}
                    navigate={navigate}
                    past
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function BookingRow({ booking, navigate, past = false, onCancel, cancelling = false }) {
  const image = Array.isArray(booking?.space?.photos) && booking.space.photos.length > 0
    ? booking.space.photos[0]
    : PLACEHOLDER_IMAGE;

  const status = booking.payment_status === "pending" && booking.status === "pending"
    ? "pending"
    : booking.status;

  const showCancel = !past && ["paid", "confirmed"].includes(booking.status);
  const showReview = past && booking.status === "completed";

  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <img src={image} alt={booking?.space?.title ?? "Espacio"} className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-bold text-[#1C1917] text-sm font-['Plus_Jakarta_Sans'] line-clamp-1">{booking?.space?.title ?? "Espacio"}</p>
            <StatusBadge status={status} />
          </div>
          <p className="text-xs text-[#C2956B] font-['Inter'] mb-2">?? {booking?.space?.neighborhood ?? "Montevideo"}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#1C1917]/50 font-['Inter']">
            <span>?? {formatDate(`${booking.date}T12:00:00`)}</span>
            <span>?? {normalizeTime(booking.start_time)} - {normalizeTime(booking.end_time)}</span>
            <span>?? {booking.guest_count} personas</span>
            <span className="font-['JetBrains_Mono'] font-semibold text-[#1C1917]">{formatUYU(booking.total_charged)}</span>
          </div>
        </div>
      </div>

      {(showCancel || showReview) && (
        <div className="mt-3 pt-3 border-t border-[#1C1917]/8 flex justify-end gap-2">
          {showCancel && (
            <Button size="sm" variant="danger" loading={cancelling} onClick={() => onCancel?.(booking.id)}>
              Cancelar
            </Button>
          )}

          {showReview && (
            <Button size="sm" onClick={() => navigate(`/reseÃ±a/${booking.id}`)}>
              Dejar reseÃ±a
            </Button>
          )}

          <Button size="sm" variant="outline" onClick={() => navigate(`/espacio/${booking.space_id}`)}>
            Ver espacio
          </Button>
        </div>
      )}
    </Card>
  );
}

function normalizeTime(value) {
  if (!value) return "--:--";
  return String(value).slice(0, 5);
}
