// ─── BOOKING CONFIRMATION ────────────────────────────────────────────────────
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { CheckCircle2, Calendar, Users, Clock, MessageCircle, X } from "lucide-react";
import { Button, Card } from "../components/shared";
import { formatUYU, formatDate } from "../lib/utils";

export function BookingConfirmation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { space, selectedDate, startTime, endTime, persons, total } = location.state ?? {};

  if (!space) return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      <p className="text-[#1C1917]/60 font-['Inter']">Reserva no encontrada.</p>
      <Button onClick={() => navigate("/mis-reservas")} className="mt-4">Mis reservas</Button>
    </div>
  );

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-20 h-20 bg-[#4A5E3A]/15 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 size={40} className="text-[#4A5E3A]" />
        </div>
        <h1 className="text-3xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2">¡Reserva confirmada!</h1>
        <p className="text-[#1C1917]/60 font-['Inter'] mb-8">
          Te enviamos todos los detalles por email. ¡Que disfrutes el asado!
        </p>

        <Card className="p-6 text-left mb-6">
          <div className="flex gap-4 mb-5">
            <img src={space.images[0]} alt="" className="w-20 h-16 object-cover rounded-xl flex-shrink-0" />
            <div>
              <p className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{space.title}</p>
              <p className="text-sm text-[#C2956B] font-['Inter']">📍 {space.zona}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Calendar, label: "Fecha", value: formatDate(selectedDate + "T00:00:00") },
              { icon: Clock, label: "Horario", value: `${startTime}:00 - ${endTime}:00` },
              { icon: Users, label: "Personas", value: `${persons} personas` },
              { icon: "💰", label: "Total pagado", value: formatUYU(total), mono: true },
            ].map(({ icon: Icon, label, value, mono }) => (
              <div key={label} className="bg-[#FAF7F2] rounded-xl p-3">
                <p className="text-xs text-[#1C1917]/40 font-['Inter'] mb-0.5">{label}</p>
                <p className={`text-sm font-bold text-[#1C1917] ${mono ? "font-['JetBrains_Mono']" : "font-['Inter']"}`}>{value}</p>
              </div>
            ))}
          </div>
        </Card>

        <div className="bg-[#1C1917]/5 rounded-2xl p-5 mb-8 text-left">
          <p className="font-semibold text-[#1C1917] text-sm font-['Inter'] mb-2">🔑 Instrucciones de acceso</p>
          <p className="text-sm text-[#1C1917]/60 font-['Inter'] leading-relaxed">
            El anfitrión {space.host.name} te contactará por WhatsApp 24hs antes de la reserva con los detalles de acceso. Cualquier consulta, podés contactarlo directamente desde la app.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" fullWidth onClick={() => navigate("/mis-reservas")}>
            Ver mis reservas
          </Button>
          <Button fullWidth onClick={() => navigate("/")}>
            Explorar más espacios
          </Button>
        </div>
      </div>
    </div>
  );
}

export default BookingConfirmation;
