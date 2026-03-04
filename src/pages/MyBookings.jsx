import { useNavigate } from "react-router-dom";
import { Button, Card, StatusBadge, EmptyState, PageContainer, SectionTitle } from "../components/shared";
import { MOCK_BOOKINGS, formatUYU, formatDate } from "../lib/utils";

export default function MyBookings() {
  const navigate = useNavigate();

  const upcoming  = MOCK_BOOKINGS.filter((b) => b.status === "confirmada" || b.status === "pendiente");
  const past      = MOCK_BOOKINGS.filter((b) => b.status === "completada" || b.status === "cancelada");

  return (
    <PageContainer>
      <SectionTitle sub="Historial completo de tus reservas en Prende">Mis reservas</SectionTitle>

      {MOCK_BOOKINGS.length === 0 ? (
        <EmptyState
          icon="📅"
          title="No tenés reservas aún"
          description="Explorá los mejores espacios con parrilla en Montevideo y hacé tu primera reserva."
          action={<Button onClick={() => navigate("/buscar")}>Explorar espacios</Button>}
        />
      ) : (
        <div className="space-y-8">
          {upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">Próximas</h2>
              <div className="space-y-3">
                {upcoming.map((b) => <BookingRow key={b.id} booking={b} navigate={navigate} />)}
              </div>
            </div>
          )}

          {past.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">Historial</h2>
              <div className="space-y-3">
                {past.map((b) => <BookingRow key={b.id} booking={b} navigate={navigate} past />)}
              </div>
            </div>
          )}
        </div>
      )}
    </PageContainer>
  );
}

function BookingRow({ booking: b, navigate, past = false }) {
  return (
    <Card className="p-4">
      <div className="flex gap-4">
        <img src={b.spaceImage} alt="" className="w-20 h-16 sm:w-24 sm:h-20 object-cover rounded-xl flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <p className="font-bold text-[#1C1917] text-sm font-['Plus_Jakarta_Sans'] line-clamp-1">{b.spaceTitle}</p>
            <StatusBadge status={b.status} />
          </div>
          <p className="text-xs text-[#C2956B] font-['Inter'] mb-2">📍 {b.zona}</p>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#1C1917]/50 font-['Inter']">
            <span>📅 {formatDate(b.startTime)}</span>
            <span>👥 {b.persons} personas</span>
            <span className="font-['JetBrains_Mono'] font-semibold text-[#1C1917]">{formatUYU(b.total)}</span>
          </div>
        </div>
      </div>

      {past && b.status === "completada" && (
        <div className="mt-3 pt-3 border-t border-[#1C1917]/8 flex justify-end gap-2">
          {!b.reviewed ? (
            <Button size="sm" onClick={() => navigate(`/reseña/${b.id}`)}>
              Dejar reseña
            </Button>
          ) : (
            <span className="text-xs text-[#4A5E3A] font-semibold flex items-center gap-1 font-['Inter']">
              ✓ Reseña enviada
            </span>
          )}
          <Button size="sm" variant="outline" onClick={() => navigate(`/espacio/${b.spaceId}`)}>
            Ver espacio
          </Button>
        </div>
      )}
    </Card>
  );
}
