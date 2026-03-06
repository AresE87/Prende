import { createElement, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, CalendarDays, Clock3, Users, ArrowRight, ShieldCheck } from "lucide-react";
import { Button, Card, Skeleton, Badge, PageContainer } from "../components/shared";
import { supabase } from "../lib/supabase";
import { formatUYU, formatDate } from "../lib/utils";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400";

export function BookingConfirmation() {
  const navigate = useNavigate();
  const { bookingId } = useParams();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadBooking() {
      setLoading(true);
      try {
        if (!bookingId) throw new Error("ID invalido");

        const { data, error } = await supabase
          .from("bookings")
          .select("*, space:spaces(title, neighborhood, photos), host:profiles!host_id(full_name)")
          .eq("id", bookingId)
          .single();

        if (error) throw error;
        if (!cancelled) setBooking(data);
      } catch {
        if (!cancelled) setBooking(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadBooking();

    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  if (loading) {
    return (
      <PageContainer>
        <div className="mx-auto max-w-3xl space-y-5">
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto h-14 w-72" />
          <Skeleton className="mx-auto h-6 w-2/3" />
          <Skeleton className="h-[32rem] w-full rounded-[36px]" />
        </div>
      </PageContainer>
    );
  }

  if (!booking) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <div className="surface-card max-w-xl rounded-[34px] px-8 py-10 text-center">
          <p className="text-sm text-[#171616]/62">Reserva no encontrada.</p>
          <Button onClick={() => navigate("/mis-reservas")} className="mt-5">Mis reservas</Button>
        </div>
      </PageContainer>
    );
  }

  const photo = Array.isArray(booking.space?.photos) && booking.space.photos.length > 0
    ? booking.space.photos[0]
    : PLACEHOLDER_IMAGE;

  return (
    <PageContainer>
      <section className="mx-auto max-w-4xl section-shell rounded-[40px] px-6 py-8 text-center sm:px-10 sm:py-10">
        <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-[linear-gradient(135deg,#5f6f52_0%,#718361_100%)] text-white shadow-[0_24px_46px_-28px_rgba(95,111,82,0.85)]">
          <CheckCircle2 size={44} />
        </div>
        <Badge variant="success" className="mt-6">Reserva confirmada</Badge>
        <h1 className="mt-5 font-display text-5xl leading-none text-[#171616] sm:text-6xl">Todo listo para tu proxima reunion.</h1>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-[#171616]/62 sm:text-base">
          Confirmamos la reserva y dejamos el detalle centralizado para que el usuario sienta control total despues del pago.
        </p>
      </section>

      <div className="mx-auto mt-6 grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="rounded-[36px] overflow-hidden p-0">
          <div className="grid gap-0 md:grid-cols-[240px_minmax(0,1fr)]">
            <img src={photo} alt={booking.space?.title ?? "Espacio"} className="h-64 w-full object-cover md:h-full" />
            <div className="px-6 py-6 sm:px-8 sm:py-8">
              <div className="flex flex-wrap gap-2">
                <Badge variant="default">{booking.space?.neighborhood ?? "Montevideo"}</Badge>
                <Badge variant="oliva">Pago validado</Badge>
              </div>
              <h2 className="mt-4 text-3xl font-semibold text-[#171616]">{booking.space?.title ?? "Espacio"}</h2>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <InfoCard icon={CalendarDays} label="Fecha" value={formatDate(`${booking.date}T12:00:00`)} />
                <InfoCard icon={Clock3} label="Horario" value={`${String(booking.start_time).slice(0, 5)} - ${String(booking.end_time).slice(0, 5)}`} />
                <InfoCard icon={Users} label="Invitados" value={`${booking.guest_count} personas`} />
                <InfoCard icon={ShieldCheck} label="Total" value={formatUYU(booking.total_charged)} mono />
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[34px] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Siguiente paso</p>
            <h2 className="mt-3 text-2xl font-semibold text-[#171616]">Coordinacion con el anfitrion</h2>
            <p className="mt-3 text-sm leading-relaxed text-[#171616]/62">
              {booking.host?.full_name ?? "El anfitrion"} recibira la reserva y te contactara con los detalles finales de acceso antes de la fecha.
            </p>
          </Card>

          <Card className="rounded-[34px] p-6">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Cobertura</p>
            <p className="mt-3 text-sm leading-relaxed text-[#171616]/62">
              Conservamos el rastro de pago, estado de reserva y comprobantes para soporte operativo si lo necesitas.
            </p>
          </Card>
        </div>
      </div>

      <div className="mx-auto mt-8 flex max-w-4xl flex-col gap-3 sm:flex-row">
        <Button variant="outline" fullWidth onClick={() => navigate("/mis-reservas")}>
          Ver mis reservas
        </Button>
        <Button fullWidth onClick={() => navigate("/buscar")}>
          Explorar mas espacios <ArrowRight size={16} />
        </Button>
      </div>
    </PageContainer>
  );
}

function InfoCard({ icon, label, value, mono = false }) {
  return (
    <div className="rounded-[24px] border border-[#171616]/8 bg-white/75 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_16px_26px_-20px_rgba(23,22,22,0.82)]">
          {createElement(icon, { size: 15 })}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">{label}</p>
          <p className={`mt-1 text-sm font-semibold text-[#171616] ${mono ? "font-mono" : ""}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;

