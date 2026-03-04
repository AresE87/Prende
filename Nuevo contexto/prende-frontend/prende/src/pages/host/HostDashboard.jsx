import { useNavigate } from "react-router-dom";
import { TrendingUp, Calendar, Star, DollarSign, ChevronRight, Clock } from "lucide-react";
import { Button, Card, Badge, StatusBadge, SectionTitle, PageContainer } from "../../components/shared";
import { formatUYU, formatDate } from "../../lib/utils";

const STATS = [
  { icon: DollarSign, label: "Ingresos este mes",     value: "$U 43.200",  sub: "+12% vs mes anterior",   color: "text-[#D4541B]" },
  { icon: Calendar,   label: "Reservas confirmadas",  value: "12",         sub: "3 esta semana",           color: "text-[#4A5E3A]" },
  { icon: TrendingUp, label: "Tasa de ocupación",     value: "68%",        sub: "Objetivo: 70%",           color: "text-[#C2956B]" },
  { icon: Star,       label: "Puntuación promedio",   value: "4.9 ⭐",     sub: "38 reseñas",              color: "text-[#1C1917]" },
];

const UPCOMING = [
  { id: "b1", guest: "Camila R.", date: "2025-03-15T14:00:00", endTime: "20:00", persons: 12, total: 7200, status: "confirmada" },
  { id: "b2", guest: "Rodrigo M.", date: "2025-03-18T12:00:00", endTime: "18:00", persons: 8, total: 4800, status: "pendiente" },
  { id: "b3", guest: "Laura P.", date: "2025-03-22T16:00:00", endTime: "22:00", persons: 15, total: 8400, status: "confirmada" },
];

const NAV_ITEMS = [
  { to: "/anfitrion/calendario", label: "Gestionar disponibilidad", icon: "📅", desc: "Bloqueá fechas y horarios" },
  { to: "/anfitrion/reservas",   label: "Reservas",                 icon: "📋", desc: "Aprobá o rechazá solicitudes" },
  { to: "/anfitrion/ganancias",  label: "Ganancias",                icon: "💰", desc: "Historial y liquidaciones" },
];

export default function HostDashboard() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <div className="flex items-start justify-between mb-8">
        <SectionTitle sub="Quincho con parrilla en Pocitos">Panel de anfitrión</SectionTitle>
        <Button variant="outline" size="sm" onClick={() => navigate("/espacio/1")}>
          Ver mi espacio
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {STATS.map(({ icon: Icon, label, value, sub, color }) => (
          <Card key={label} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} className={color} />
              <span className="text-xs text-[#1C1917]/50 font-['Inter']">{label}</span>
            </div>
            <p className={`text-2xl font-bold font-['JetBrains_Mono'] ${color}`}>{value}</p>
            <p className="text-xs text-[#1C1917]/40 mt-1 font-['Inter']">{sub}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Upcoming bookings */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Próximas reservas</h2>
            <button
              onClick={() => navigate("/anfitrion/reservas")}
              className="text-sm text-[#D4541B] font-semibold flex items-center gap-1 hover:gap-2 transition-all font-['Inter']"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-3">
            {UPCOMING.map((b) => (
              <Card key={b.id} className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold text-[#1C1917] text-sm font-['Inter']">{b.guest}</span>
                  <StatusBadge status={b.status} />
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#1C1917]/50 font-['Inter']">
                  <span>📅 {formatDate(b.date)}</span>
                  <span>🕐 {new Date(b.date).getHours()}:00 → {b.endTime}</span>
                  <span>👥 {b.persons} personas</span>
                  <span className="font-['JetBrains_Mono'] font-semibold text-[#D4541B]">{formatUYU(b.total)}</span>
                </div>
                {b.status === "pendiente" && (
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="success">Aceptar</Button>
                    <Button size="sm" variant="danger">Rechazar</Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Quick nav */}
        <div>
          <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">Acciones rápidas</h2>
          <div className="space-y-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="w-full bg-white rounded-2xl border border-[#1C1917]/8 p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
              >
                <span className="text-2xl">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#1C1917] font-['Inter']">{item.label}</p>
                  <p className="text-xs text-[#1C1917]/50 font-['Inter']">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-[#1C1917]/30" />
              </button>
            ))}
          </div>

          {/* Performance tip */}
          <div className="mt-5 bg-[#D4541B]/8 border border-[#D4541B]/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#D4541B] mb-1 font-['Inter']">💡 Consejo</p>
            <p className="text-xs text-[#1C1917]/60 font-['Inter'] leading-relaxed">
              Los espacios con 5+ fotos reciben 3x más reservas. Agregá más fotos para mejorar tu visibilidad.
            </p>
            <button className="text-xs text-[#D4541B] font-semibold mt-2 hover:underline font-['Inter']">
              Mejorar mi listing →
            </button>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
