import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, Calendar, Star, DollarSign, ChevronRight } from "lucide-react";
import { Button, Card, SectionTitle, PageContainer, Skeleton, StatusBadge } from "../../components/shared";
import { formatUYU, formatDate } from "../../lib/utils";
import { getMyBookings } from "../../lib/supabase";

const NAV_ITEMS = [
  { to: "/anfitrion/calendario", label: "Gestionar disponibilidad", icon: "CAL", desc: "Bloquea fechas y horarios" },
  { to: "/anfitrion/reservas", label: "Reservas", icon: "RES", desc: "Revisa y sigue tus reservas" },
  { to: "/anfitrion/ganancias", label: "Ganancias", icon: "GNS", desc: "Historial y liquidaciones" },
];

const STATS = [
  {
    id: "income",
    label: "Ingresos este mes",
    sub: "Neto (host_payout)",
    color: "text-[#D4541B]",
    Icon: DollarSign,
  },
  {
    id: "confirmed",
    label: "Reservas confirmadas",
    sub: "Mes actual",
    color: "text-[#4A5E3A]",
    Icon: Calendar,
  },
  {
    id: "occupancy",
    label: "Ocupacion aprox.",
    sub: "Proxy por reservas del mes",
    color: "text-[#C2956B]",
    Icon: TrendingUp,
  },
  {
    id: "upcoming",
    label: "Proximas reservas",
    sub: "Siguientes 5 eventos",
    color: "text-[#1C1917]",
    Icon: Star,
  },
];

export default function HostDashboard() {
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadHostBookings() {
      setLoading(true);
      try {
        const data = await getMyBookings("host");
        if (!cancelled) setBookings(data);
      } catch {
        if (!cancelled) setBookings([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadHostBookings();

    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const monthly = bookings.filter((booking) => {
      const date = new Date(`${booking.date}T12:00:00`);
      return date.getMonth() === month && date.getFullYear() === year;
    });

    const ingresosMes = monthly.reduce((sum, booking) => sum + Number(booking.host_payout ?? 0), 0);
    const reservasConfirmadas = monthly.filter((booking) => ["paid", "confirmed"].includes(booking.status)).length;
    const ocupacionProxy = Math.min(100, Math.round((reservasConfirmadas / Math.max(1, monthly.length || 1)) * 100));

    return {
      ingresosMes,
      reservasConfirmadas,
      ocupacionProxy,
    };
  }, [bookings]);

  const upcoming = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((booking) => {
        const date = new Date(`${booking.date}T${String(booking.start_time).slice(0, 5)}:00`);
        return date >= now;
      })
      .sort((a, b) => {
        const da = new Date(`${a.date}T${String(a.start_time).slice(0, 5)}:00`).getTime();
        const db = new Date(`${b.date}T${String(b.start_time).slice(0, 5)}:00`).getTime();
        return da - db;
      })
      .slice(0, 5);
  }, [bookings]);

  const statValues = {
    income: formatUYU(stats.ingresosMes),
    confirmed: String(stats.reservasConfirmadas),
    occupancy: `${stats.ocupacionProxy}%`,
    upcoming: String(upcoming.length),
  };

  return (
    <PageContainer>
      <div className="flex items-start justify-between mb-8">
        <SectionTitle sub="Metricas y actividad de tu espacio">Panel de anfitrion</SectionTitle>
        <Button variant="outline" size="sm" onClick={() => navigate("/anfitrion/reservas")}>Ver reservas</Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, idx) => <Skeleton key={idx} className="h-28 w-full" />)
        ) : (
          STATS.map((stat) => (
            <Card key={stat.id} className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <stat.Icon size={16} className={stat.color} />
                <span className="text-xs text-[#1C1917]/50 font-['Inter']">{stat.label}</span>
              </div>
              <p className={`text-2xl font-bold font-['JetBrains_Mono'] ${stat.color}`}>{statValues[stat.id]}</p>
              <p className="text-xs text-[#1C1917]/40 mt-1 font-['Inter']">{stat.sub}</p>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Proximas reservas</h2>
            <button
              onClick={() => navigate("/anfitrion/reservas")}
              className="text-sm text-[#D4541B] font-semibold flex items-center gap-1 hover:gap-2 transition-all font-['Inter']"
            >
              Ver todas <ChevronRight size={14} />
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, idx) => <Skeleton key={idx} className="h-24 w-full" />)}
            </div>
          ) : upcoming.length === 0 ? (
            <Card className="p-5">
              <p className="text-sm text-[#1C1917]/60 font-['Inter']">No tienes reservas proximas.</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((booking) => (
                <Card key={booking.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-[#1C1917] text-sm font-['Inter'] line-clamp-1">{booking?.space?.title ?? "Espacio"}</span>
                    <StatusBadge status={booking.status} />
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#1C1917]/50 font-['Inter']">
                    <span>{formatDate(`${booking.date}T12:00:00`)}</span>
                    <span>{String(booking.start_time).slice(0, 5)} a {String(booking.end_time).slice(0, 5)}</span>
                    <span>{booking.guest_count} personas</span>
                    <span className="font-['JetBrains_Mono'] font-semibold text-[#D4541B]">{formatUYU(booking.total_charged)}</span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">Acciones rapidas</h2>
          <div className="space-y-3">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.to}
                onClick={() => navigate(item.to)}
                className="w-full bg-white rounded-2xl border border-[#1C1917]/8 p-4 flex items-center gap-3 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
              >
                <span className="text-[11px] font-bold text-[#1C1917]/40 font-['JetBrains_Mono']">{item.icon}</span>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-[#1C1917] font-['Inter']">{item.label}</p>
                  <p className="text-xs text-[#1C1917]/50 font-['Inter']">{item.desc}</p>
                </div>
                <ChevronRight size={16} className="text-[#1C1917]/30" />
              </button>
            ))}
          </div>

          <div className="mt-5 bg-[#D4541B]/8 border border-[#D4541B]/20 rounded-2xl p-4">
            <p className="text-xs font-bold text-[#D4541B] mb-1 font-['Inter']">Consejo</p>
            <p className="text-xs text-[#1C1917]/60 font-['Inter'] leading-relaxed">
              Mantene actualizado tu calendario y fotos del espacio para mejorar conversion de reservas.
            </p>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
