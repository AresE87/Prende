import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  MapPin, Calendar, Users, Search, ArrowRight,
  DollarSign, CalendarCheck, Percent, Star,
  LayoutDashboard, CalendarDays, Wallet,
  Clock, UserCheck, Check, X, Home,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import {
  PageContainer, Card, Button, Avatar, StatusBadge, SectionTitle,
} from "../components/shared";
import SpaceCard from "../components/booking/SpaceCard";
import { ZONAS, MOCK_SPACES, MOCK_BOOKINGS, formatUYU, formatDate } from "../lib/utils";

// ─── HOST STATS (mock) ─────────────────────────────────────────
const HOST_STATS = [
  { label: "Ingresos del mes", value: "$U 43.200", icon: DollarSign, color: "text-green-600 bg-green-50" },
  { label: "Reservas confirmadas", value: "12", icon: CalendarCheck, color: "text-[#D4541B] bg-[#D4541B]/10" },
  { label: "Tasa ocupación", value: "68%", icon: Percent, color: "text-blue-600 bg-blue-50" },
  { label: "Rating promedio", value: "4.9 ★", icon: Star, color: "text-amber-600 bg-amber-50" },
];

const HOST_BOOKINGS_PENDING = [
  { id: "hb1", guest: "Carolina M.", avatar: "https://i.pravatar.cc/80?img=32", date: "2026-03-08", time: "14:00 - 20:00", persons: 10, total: 7200, status: "pendiente" },
  { id: "hb2", guest: "Andrés F.", avatar: "https://i.pravatar.cc/80?img=14", date: "2026-03-10", time: "12:00 - 16:00", persons: 6, total: 4800, status: "pendiente" },
];

const QUICK_LINKS = [
  { label: "Calendario", icon: CalendarDays, to: "/anfitrion/calendario", color: "bg-blue-50 text-blue-600" },
  { label: "Reservas", icon: LayoutDashboard, to: "/anfitrion/reservas", color: "bg-[#D4541B]/10 text-[#D4541B]" },
  { label: "Ganancias", icon: Wallet, to: "/anfitrion/ganancias", color: "bg-green-50 text-green-600" },
];

// ─── MAIN DASHBOARD ─────────────────────────────────────────────
export default function Dashboard() {
  const { state, dispatch } = useApp();
  const navigate = useNavigate();
  const user = state.user;

  const [zona, setZona] = useState("");
  const [fecha, setFecha] = useState("");
  const [personas, setPersonas] = useState(4);

  const today = new Date().toISOString().split("T")[0];
  const upcomingBookings = MOCK_BOOKINGS.filter(
    (b) => b.status === "confirmada" || b.status === "pendiente"
  ).slice(0, 3);

  function handleSearch(e) {
    e.preventDefault();
    dispatch({ type: "SET_SEARCH", payload: { zona, fecha, personas } });
    const params = new URLSearchParams();
    if (zona) params.set("zona", zona);
    if (fecha) params.set("fecha", fecha);
    if (personas) params.set("personas", personas);
    navigate(`/buscar?${params.toString()}`);
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      {/* HEADER */}
      <section className="bg-[#1C1917] text-[#F5F0E8] pt-10 pb-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar src={user.avatar} name={user.name} size="lg" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold font-['Plus_Jakarta_Sans']">
                Hola, {user.name.split(" ")[0]}
              </h1>
              <p className="text-[#F5F0E8]/60 text-sm font-['Inter'] mt-0.5">
                {user.isHost ? "Anfitrión · " : ""}{user.email}
              </p>
            </div>
          </div>
          <Link
            to="/inicio"
            className="flex items-center gap-2 text-[#F5F0E8]/60 hover:text-[#F5F0E8] text-sm font-medium font-['Inter'] transition-colors"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Ver página principal</span>
          </Link>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* ═══ HOST SECTION ═══ */}
        {user.isHost && (
          <>
            {/* Stats */}
            <section>
              <SectionTitle>Tu espacio</SectionTitle>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                {HOST_STATS.map((s) => (
                  <Card key={s.label} className="flex items-center gap-3 p-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.color}`}>
                      <s.icon size={20} />
                    </div>
                    <div>
                      <p className="text-xs text-[#1C1917]/50 font-['Inter']">{s.label}</p>
                      <p className="text-lg font-bold text-[#1C1917] font-['JetBrains_Mono']">{s.value}</p>
                    </div>
                  </Card>
                ))}
              </div>
            </section>

            {/* Pending host bookings */}
            {HOST_BOOKINGS_PENDING.length > 0 && (
              <section>
                <div className="flex items-center justify-between mb-4">
                  <SectionTitle subtitle="Reservas que esperan tu confirmación">Pendientes de confirmar</SectionTitle>
                </div>
                <div className="space-y-3">
                  {HOST_BOOKINGS_PENDING.map((b) => (
                    <Card key={b.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <Avatar src={b.avatar} name={b.guest} size="md" />
                        <div>
                          <p className="font-semibold text-[#1C1917] font-['Plus_Jakarta_Sans'] text-sm">{b.guest}</p>
                          <div className="flex items-center gap-3 text-xs text-[#1C1917]/50 font-['Inter'] mt-0.5">
                            <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(b.date)}</span>
                            <span className="flex items-center gap-1"><Clock size={12} /> {b.time}</span>
                            <span className="flex items-center gap-1"><UserCheck size={12} /> {b.persons} pers.</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold text-[#1C1917] font-['JetBrains_Mono']">{formatUYU(b.total)}</span>
                        <Button size="sm" variant="success" className="gap-1"><Check size={14} /> Aceptar</Button>
                        <Button size="sm" variant="outline" className="gap-1"><X size={14} /> Rechazar</Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Quick links */}
            <section>
              <div className="grid grid-cols-3 gap-4">
                {QUICK_LINKS.map((link) => (
                  <Link key={link.to} to={link.to}>
                    <Card hover className="flex flex-col items-center gap-2 p-5 text-center">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${link.color}`}>
                        <link.icon size={22} />
                      </div>
                      <span className="text-sm font-semibold text-[#1C1917] font-['Inter']">{link.label}</span>
                    </Card>
                  </Link>
                ))}
              </div>
            </section>

            {/* Divider */}
            <div className="border-t border-[#1C1917]/10" />
          </>
        )}

        {/* ═══ GUEST SECTION ═══ */}

        {/* Search */}
        <section>
          <SectionTitle subtitle="Encontrá el lugar perfecto para tu próximo asado">Buscar espacios</SectionTitle>
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 shadow-lg border border-[#1C1917]/5 mt-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <MapPin size={18} className="text-[#D4541B] flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter']">Zona</p>
                  <select
                    value={zona}
                    onChange={(e) => setZona(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#1C1917] font-medium outline-none cursor-pointer font-['Inter']"
                  >
                    <option value="">Toda Montevideo</option>
                    {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
                  </select>
                </div>
              </div>

              <div className="hidden sm:block w-px bg-[#1C1917]/10 self-stretch my-2" />

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <Calendar size={18} className="text-[#D4541B] flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter']">Cuándo</p>
                  <input
                    type="date"
                    value={fecha}
                    min={today}
                    onChange={(e) => setFecha(e.target.value)}
                    className="w-full bg-transparent text-sm text-[#1C1917] font-medium outline-none cursor-pointer font-['Inter']"
                  />
                </div>
              </div>

              <div className="hidden sm:block w-px bg-[#1C1917]/10 self-stretch my-2" />

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#FAF7F2] transition-colors">
                <Users size={18} className="text-[#D4541B] flex-shrink-0" />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[10px] font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter']">Personas</p>
                  <input
                    type="number"
                    value={personas}
                    min={1}
                    max={50}
                    onChange={(e) => setPersonas(Number(e.target.value))}
                    className="w-full bg-transparent text-sm text-[#1C1917] font-medium outline-none font-['Inter']"
                  />
                </div>
              </div>
            </div>

            <div className="mt-2 px-2 pb-2">
              <Button type="submit" fullWidth size="lg" className="rounded-xl">
                <Search size={18} />
                Buscar espacios
              </Button>
            </div>
          </form>
        </section>

        {/* Upcoming bookings */}
        {upcomingBookings.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <SectionTitle>Tus próximas reservas</SectionTitle>
              <Link to="/mis-reservas" className="flex items-center gap-1 text-sm text-[#D4541B] font-semibold hover:gap-2 transition-all font-['Inter']">
                Ver todas <ArrowRight size={16} />
              </Link>
            </div>
            <div className="space-y-3">
              {upcomingBookings.map((b) => (
                <Link key={b.id} to={`/espacio/${b.spaceId}`}>
                  <Card hover className="flex items-center gap-4 p-4">
                    <img
                      src={b.spaceImage}
                      alt={b.spaceTitle}
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover flex-shrink-0"
                      loading="lazy"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-semibold text-[#1C1917] font-['Plus_Jakarta_Sans'] truncate">{b.spaceTitle}</p>
                        <StatusBadge status={b.status} />
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#1C1917]/50 font-['Inter']">
                        <span className="flex items-center gap-1"><MapPin size={12} /> {b.zona}</span>
                        <span className="flex items-center gap-1"><Calendar size={12} /> {formatDate(b.startTime)}</span>
                        <span className="flex items-center gap-1"><Users size={12} /> {b.persons}</span>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-[#1C1917] font-['JetBrains_Mono'] flex-shrink-0">
                      {formatUYU(b.total)}
                    </span>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Recommended spaces */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <SectionTitle subtitle="Los mejores asaderos de Montevideo">Espacios recomendados</SectionTitle>
            <Link to="/buscar" className="flex items-center gap-1 text-sm text-[#D4541B] font-semibold hover:gap-2 transition-all font-['Inter']">
              Ver todos <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {MOCK_SPACES.slice(0, 4).map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        </section>

        {/* CTA Host */}
        {!user.isHost && (
          <section className="bg-[#1C1917] text-[#F5F0E8] rounded-2xl py-12 px-6 text-center">
            <span className="text-4xl mb-4 block">🏡</span>
            <h2 className="text-2xl font-bold font-['Cormorant_Garamond'] italic mb-2">
              ¿Tenés espacio con parrilla?
            </h2>
            <p className="text-[#F5F0E8]/60 font-['Inter'] mb-6 max-w-md mx-auto text-sm">
              Publicá tu espacio gratis y empezá a generar ingresos este fin de semana.
            </p>
            <Button variant="primary" size="lg" onClick={() => navigate("/anfitrion/onboarding")}>
              Publicar mi espacio
            </Button>
          </section>
        )}
      </div>
    </div>
  );
}
