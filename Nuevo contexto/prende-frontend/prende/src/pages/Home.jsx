import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, Calendar, Users, Search, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { Button, Select } from "../components/shared";
import SpaceCard from "../components/booking/SpaceCard";
import { ZONAS, MOCK_SPACES } from "../lib/utils";

const HIGHLIGHTS = [
  { icon: "🔥", label: "Con parrilla de leña" },
  { icon: "🏊", label: "Con piscina" },
  { icon: "🏡", label: "Quincho techado" },
  { icon: "🫙", label: "Horno de barro" },
  { icon: "🌿", label: "Jardín privado" },
];

export default function Home() {
  const { dispatch } = useApp();
  const navigate = useNavigate();
  const [zona, setZona] = useState("");
  const [fecha, setFecha] = useState("");
  const [personas, setPersonas] = useState(4);

  function handleSearch(e) {
    e.preventDefault();
    dispatch({ type: "SET_SEARCH", payload: { zona, fecha, personas } });
    const params = new URLSearchParams();
    if (zona)   params.set("zona", zona);
    if (fecha)  params.set("fecha", fecha);
    if (personas) params.set("personas", personas);
    navigate(`/buscar?${params.toString()}`);
  }

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="bg-[#FAF7F2]">
      {/* HERO */}
      <section className="relative overflow-hidden bg-[#1C1917] text-[#F5F0E8] pt-16 pb-24 px-4">
        {/* Texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}
        />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#D4541B]/20 text-[#D4541B] text-xs font-semibold px-3 py-1.5 rounded-full mb-6 font-['Inter'] border border-[#D4541B]/30">
            🔥 Espacios con parrilla en Montevideo
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-['Cormorant_Garamond'] italic leading-tight mb-4">
            El lugar perfecto para
            <br />
            <span className="text-[#D4541B]">tu próximo asado</span>
          </h1>

          <p className="text-[#F5F0E8]/70 text-lg font-['Inter'] mb-12 max-w-xl mx-auto">
            Alquilá espacios con parrilla por hora. Desde un quincho íntimo hasta una terraza para 30 personas.
          </p>

          {/* Search box */}
          <form onSubmit={handleSearch} className="bg-white rounded-2xl p-2 shadow-2xl max-w-3xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
              {/* Zona */}
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

              {/* Fecha */}
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

              {/* Personas */}
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
        </div>
      </section>

      {/* HIGHLIGHTS */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {HIGHLIGHTS.map((h) => (
            <button
              key={h.label}
              onClick={() => navigate("/buscar")}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2.5 bg-white rounded-full border border-[#1C1917]/10 hover:border-[#D4541B] hover:text-[#D4541B] transition-all text-sm font-medium text-[#1C1917] font-['Inter'] shadow-sm"
            >
              <span>{h.icon}</span>
              {h.label}
            </button>
          ))}
        </div>
      </section>

      {/* FEATURED SPACES */}
      <section className="max-w-6xl mx-auto px-4 pb-16">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Espacios destacados</h2>
            <p className="text-[#1C1917]/50 text-sm font-['Inter'] mt-0.5">Los mejores asaderos de Montevideo</p>
          </div>
          <button
            onClick={() => navigate("/buscar")}
            className="flex items-center gap-1 text-sm text-[#D4541B] font-semibold hover:gap-2 transition-all font-['Inter']"
          >
            Ver todos <ArrowRight size={16} />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {MOCK_SPACES.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      </section>

      {/* HOST CTA */}
      <section className="bg-[#1C1917] text-[#F5F0E8] py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-4xl mb-4 block">🏡</span>
          <h2 className="text-3xl font-bold font-['Cormorant_Garamond'] italic mb-3">
            ¿Tenés espacio con parrilla?
          </h2>
          <p className="text-[#F5F0E8]/60 font-['Inter'] mb-8 max-w-md mx-auto">
            Publicá tu espacio gratis y empezá a generar ingresos este fin de semana.
          </p>
          <Button variant="primary" size="xl" onClick={() => navigate("/anfitrion/onboarding")}>
            Publicar mi espacio
          </Button>
        </div>
      </section>
    </div>
  );
}
