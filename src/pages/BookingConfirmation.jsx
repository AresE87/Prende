import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { Button, Card, Skeleton } from "../components/shared";
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
        if (!bookingId) throw new Error("ID invÃ¡lido");

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
      <div className="bg-[#FAF7F2] min-h-screen">
        <div className="max-w-2xl mx-auto px-4 py-12 space-y-4">
          <Skeleton className="h-12 w-48 mx-auto" />
          <Skeleton className="h-6 w-2/3 mx-auto" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <p className="text-[#1C1917]/60 font-['Inter']">Reserva no encontrada.</p>
        <Button onClick={() => navigate("/mis-reservas")} className="mt-4">Mis reservas</Button>
      </div>
    );
  }

  const photo = Array.isArray(booking.space?.photos) && booking.space.photos.length > 0
    ? booking.space.photos[0]
    : PLACEHOLDER_IMAGE;

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-[#4A5E3A]/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-[#4A5E3A]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">Â¡Reserva confirmada!</h1>
        <p className="text-[#1C1917]/60 font-['Inter'] mb-8">
          Te enviamos todos los detalles por email y WhatsApp.
        </p>

        <Card className="p-6 text-left mb-6">
          <div className="flex gap-4 mb-5">
            <img src={photo} alt={booking.space?.title ?? "Espacio"} className="w-20 h-16 object-cover rounded-xl flex-shrink-0" />
            <div>
              <p className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{booking.space?.title ?? "Espacio"}</p>
              <p className="text-sm text-[#C2956B] font-['Inter']">?? {booking.space?.neighborhood ?? "Montevideo"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <InfoBox label="Fecha" value={formatDate(`${booking.date}T12:00:00`)} />
            <InfoBox label="Horario" value={`${String(booking.start_time).slice(0, 5)} - ${String(booking.end_time).slice(0, 5)}`} />
            <InfoBox label="Personas" value={`${booking.guest_count} personas`} />
            <InfoBox label="Total pagado" value={formatUYU(booking.total_charged)} mono />
          </div>
        </Card>

        <div className="bg-[#1C1917]/5 rounded-2xl p-5 mb-8 text-left">
          <p className="font-semibold text-[#1C1917] text-sm font-['Inter'] mb-2">?? Instrucciones de acceso</p>
          <p className="text-sm text-[#1C1917]/60 font-['Inter'] leading-relaxed">
            El anfitriÃ³n {booking.host?.full_name ?? "del espacio"} te contactarÃ¡ por WhatsApp con los detalles de ingreso antes de la reserva.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" fullWidth onClick={() => navigate("/mis-reservas")}>
            Ver mis reservas
          </Button>
          <Button fullWidth onClick={() => navigate("/buscar")}>
            Explorar mÃ¡s espacios
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, mono = false }) {
  return (
    <div className="bg-[#FAF7F2] rounded-xl p-3">
      <p className="text-xs text-[#1C1917]/40 font-['Inter'] mb-0.5">{label}</p>
      <p className={`text-sm font-bold text-[#1C1917] ${mono ? "font-['JetBrains_Mono']" : "font-['Inter']"}`}>{value}</p>
    </div>
  );
}

export default BookingConfirmation;
