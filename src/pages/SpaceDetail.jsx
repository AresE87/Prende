import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Users, Share2, Heart, ChevronLeft, ChevronRight, X, Shield } from "lucide-react";
import { Button, Stars, AmenityTag, Avatar, Card, Badge, Modal } from "../components/shared";
import { MOCK_SPACES, AMENITIES, formatUYU, formatDate } from "../lib/utils";

const MOCK_REVIEWS = [
  { id: 1, name: "Camila R.", avatar: "https://i.pravatar.cc/40?img=21", rating: 5, date: "Febrero 2025", text: "Excelente espacio! La parrilla es perfecta y el quincho está re bien equipado. Volvemos seguro." },
  { id: 2, name: "Rodrigo M.", avatar: "https://i.pravatar.cc/40?img=31", rating: 5, date: "Enero 2025", text: "Todo impecable. Marcelo es un anfitrión súper atento. El asado quedó 10 puntos." },
  { id: 3, name: "Laura P.", avatar: "https://i.pravatar.cc/40?img=52", rating: 4, date: "Enero 2025", text: "Muy lindo lugar, un poco difícil el estacionamiento pero el espacio vale la pena." },
];

// Available hours mock
const UNAVAILABLE = ["09:00", "10:00", "11:00", "18:00", "19:00"];

export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const space = MOCK_SPACES.find((s) => s.id === id) ?? MOCK_SPACES[0];

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx]   = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [startTime, setStartTime]     = useState("");
  const [endTime, setEndTime]         = useState("");
  const [persons, setPersons]         = useState(2);
  const [liked, setLiked]             = useState(false);

  const amenityData = space.amenities.map((id) => AMENITIES.find((a) => a.id === id)).filter(Boolean);

  const today = new Date().toISOString().split("T")[0];

  const hours = Array.from({ length: 14 }, (_, i) => `${(i + 8).toString().padStart(2, "0")}:00`);

  function calcTotal() {
    if (!startTime || !endTime) return 0;
    const h = parseInt(endTime) - parseInt(startTime);
    return h > 0 ? h * space.price : 0;
  }

  const total = calcTotal();
  const serviceFee = Math.round(total * 0.06);

  function handleBook() {
    if (!selectedDate || !startTime || !endTime || persons < 1) return;
    navigate(`/reservar/${space.id}`, {
      state: { selectedDate, startTime, endTime, persons, space, total, serviceFee },
    });
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">

        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#1C1917]/60 hover:text-[#1C1917] mb-4 font-['Inter'] transition-colors">
          <ChevronLeft size={16} /> Volver
        </button>

        {/* Title row */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{space.title}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <Stars rating={space.rating} size={14} showNumber />
              <span className="text-sm text-[#1C1917]/50 font-['Inter']">({space.reviews} reseñas)</span>
              {space.host.superhost && <Badge variant="brasa">⭐ Superhost</Badge>}
              <span className="text-sm text-[#C2956B] flex items-center gap-1 font-['Inter']">
                <MapPin size={13} /> {space.zona}, Montevideo
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="p-2.5 rounded-xl border border-[#1C1917]/15 hover:bg-white transition-colors">
              <Share2 size={18} className="text-[#1C1917]" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="p-2.5 rounded-xl border border-[#1C1917]/15 hover:bg-white transition-colors"
            >
              <Heart size={18} className={liked ? "text-[#D4541B] fill-[#D4541B]" : "text-[#1C1917]"} />
            </button>
          </div>
        </div>

        {/* GALLERY */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96 mb-8 rounded-2xl overflow-hidden">
          {space.images[0] && (
            <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => { setGalleryIdx(0); setGalleryOpen(true); }}>
              <img src={space.images[0]} alt="" className="w-full h-full object-cover hover:brightness-90 transition-all" />
            </div>
          )}
          {space.images.slice(1, 3).map((img, i) => (
            <div key={i} className="col-span-2 relative cursor-pointer" onClick={() => { setGalleryIdx(i + 1); setGalleryOpen(true); }}>
              <img src={img} alt="" className="w-full h-full object-cover hover:brightness-90 transition-all" />
              {i === 1 && space.images.length > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{space.images.length - 3} fotos</span>
                </div>
              )}
            </div>
          ))}
          {space.images.length === 1 && (
            <>
              <div className="col-span-2 bg-[#1C1917]/10 rounded" />
              <div className="col-span-2 bg-[#1C1917]/10 rounded" />
            </>
          )}
        </div>

        {/* Main layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* LEFT: Details */}
          <div className="lg:col-span-2 space-y-8">

            {/* Host */}
            <div className="flex items-center justify-between pb-6 border-b border-[#1C1917]/10">
              <div>
                <p className="font-bold text-[#1C1917] text-lg font-['Plus_Jakarta_Sans']">
                  Anfitrión: {space.host.name}
                </p>
                <p className="text-sm text-[#1C1917]/50 font-['Inter']">Capacidad: hasta {space.capacity} personas</p>
              </div>
              <Avatar src={space.host.avatar} name={space.host.name} size="lg" />
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">Sobre el espacio</h2>
              <p className="text-[#1C1917]/70 leading-relaxed font-['Inter']">{space.description}</p>
            </div>

            {/* Amenities */}
            <div>
              <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">Qué incluye</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {amenityData.map((a) => (
                  <AmenityTag key={a.id} icon={a.icon} label={a.label} />
                ))}
              </div>
            </div>

            {/* Rules */}
            <div>
              <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">Reglas del espacio</h2>
              <ul className="space-y-2">
                {space.rules.map((rule, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#1C1917]/70 font-['Inter']">
                    <span className="text-[#D4541B] mt-0.5">→</span> {rule}
                  </li>
                ))}
              </ul>
            </div>

            {/* Reviews */}
            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">Reseñas</h2>
                <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#1C1917]/10 rounded-xl px-3 py-1">
                  <Stars rating={space.rating} size={13} />
                  <span className="text-sm font-bold text-[#1C1917] font-['JetBrains_Mono']">{space.rating}</span>
                  <span className="text-xs text-[#1C1917]/40 font-['Inter']">· {space.reviews} reseñas</span>
                </div>
              </div>

              <div className="space-y-5">
                {MOCK_REVIEWS.map((rev) => (
                  <div key={rev.id} className="pb-5 border-b border-[#1C1917]/8 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar src={rev.avatar} name={rev.name} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-[#1C1917] font-['Inter']">{rev.name}</p>
                        <p className="text-xs text-[#1C1917]/40 font-['Inter']">{rev.date}</p>
                      </div>
                      <div className="ml-auto">
                        <Stars rating={rev.rating} size={12} />
                      </div>
                    </div>
                    <p className="text-sm text-[#1C1917]/70 leading-relaxed font-['Inter']">{rev.text}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Safety */}
            <div className="bg-[#4A5E3A]/8 border border-[#4A5E3A]/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-[#4A5E3A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1C1917] text-sm font-['Inter'] mb-1">Reservas seguras con Prende</p>
                  <p className="text-xs text-[#1C1917]/60 leading-relaxed font-['Inter']">
                    Pagos protegidos, seguro de daños opcional incluido, y soporte 24/7 durante tu reserva.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Booking widget */}
          <div className="lg:col-span-1">
            <Card className="p-5 sticky top-24">
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-2xl font-bold text-[#D4541B] font-['JetBrains_Mono']">{formatUYU(space.price)}</span>
                <span className="text-sm text-[#1C1917]/50 font-['Inter']">/ hora</span>
              </div>

              <div className="space-y-3 mb-4">
                {/* Date */}
                <div>
                  <label className="text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter'] block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={selectedDate}
                    min={today}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full rounded-xl border border-[#1C1917]/20 px-3 py-2.5 text-sm text-[#1C1917] font-['Inter'] outline-none focus:ring-2 focus:ring-[#D4541B]"
                  />
                </div>

                {/* Time range */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter'] block mb-1">Desde</label>
                    <select
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      className="w-full rounded-xl border border-[#1C1917]/20 px-3 py-2.5 text-sm text-[#1C1917] font-['Inter'] outline-none focus:ring-2 focus:ring-[#D4541B]"
                    >
                      <option value="">--</option>
                      {hours.map((h) => (
                        <option key={h} value={h.split(":")[0]} disabled={UNAVAILABLE.includes(h)}>
                          {h}{UNAVAILABLE.includes(h) ? " ✗" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter'] block mb-1">Hasta</label>
                    <select
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      className="w-full rounded-xl border border-[#1C1917]/20 px-3 py-2.5 text-sm text-[#1C1917] font-['Inter'] outline-none focus:ring-2 focus:ring-[#D4541B]"
                    >
                      <option value="">--</option>
                      {hours.filter((h) => startTime && parseInt(h) > parseInt(startTime)).map((h) => (
                        <option key={h} value={h.split(":")[0]} disabled={UNAVAILABLE.includes(h)}>
                          {h}{UNAVAILABLE.includes(h) ? " ✗" : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Persons */}
                <div>
                  <label className="text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider font-['Inter'] block mb-1">Personas</label>
                  <div className="flex items-center gap-3 border border-[#1C1917]/20 rounded-xl px-3 py-2.5">
                    <button
                      onClick={() => setPersons(Math.max(1, persons - 1))}
                      className="w-7 h-7 rounded-full bg-[#1C1917]/8 flex items-center justify-center text-[#1C1917] font-bold hover:bg-[#1C1917]/15"
                    >–</button>
                    <span className="flex-1 text-center text-sm font-bold text-[#1C1917] font-['JetBrains_Mono']">{persons}</span>
                    <button
                      onClick={() => setPersons(Math.min(space.capacity, persons + 1))}
                      className="w-7 h-7 rounded-full bg-[#1C1917]/8 flex items-center justify-center text-[#1C1917] font-bold hover:bg-[#1C1917]/15"
                    >+</button>
                  </div>
                </div>
              </div>

              {/* Price breakdown */}
              {total > 0 && (
                <div className="bg-[#FAF7F2] rounded-xl p-3 mb-4 space-y-2">
                  {startTime && endTime && (
                    <div className="flex justify-between text-sm font-['Inter']">
                      <span className="text-[#1C1917]/60">{formatUYU(space.price)} × {parseInt(endTime) - parseInt(startTime)}hs</span>
                      <span className="text-[#1C1917] font-medium font-['JetBrains_Mono']">{formatUYU(total)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-['Inter']">
                    <span className="text-[#1C1917]/60">Cargo de servicio (6%)</span>
                    <span className="text-[#1C1917] font-medium font-['JetBrains_Mono']">{formatUYU(serviceFee)}</span>
                  </div>
                  <div className="pt-2 border-t border-[#1C1917]/10 flex justify-between font-bold">
                    <span className="text-[#1C1917] font-['Inter']">Total</span>
                    <span className="text-[#D4541B] font-['JetBrains_Mono']">{formatUYU(total + serviceFee)}</span>
                  </div>
                </div>
              )}

              <Button
                fullWidth
                size="lg"
                disabled={!selectedDate || !startTime || !endTime || total === 0}
                onClick={handleBook}
              >
                Reservar ahora
              </Button>

              <p className="text-center text-xs text-[#1C1917]/40 mt-2 font-['Inter']">No se hace ningún cargo aún</p>
            </Card>
          </div>
        </div>
      </div>

      {/* Gallery modal */}
      {galleryOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center">
          <button onClick={() => setGalleryOpen(false)} className="absolute top-4 right-4 text-white p-2 hover:bg-white/10 rounded-xl">
            <X size={24} />
          </button>
          <button
            onClick={() => setGalleryIdx(Math.max(0, galleryIdx - 1))}
            className="absolute left-4 text-white p-3 hover:bg-white/10 rounded-xl disabled:opacity-30"
            disabled={galleryIdx === 0}
          >
            <ChevronLeft size={28} />
          </button>
          <img
            src={space.images[galleryIdx]}
            alt=""
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl"
          />
          <button
            onClick={() => setGalleryIdx(Math.min(space.images.length - 1, galleryIdx + 1))}
            className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-xl disabled:opacity-30"
            disabled={galleryIdx === space.images.length - 1}
          >
            <ChevronRight size={28} />
          </button>
          <p className="absolute bottom-6 text-white/60 text-sm font-['Inter']">
            {galleryIdx + 1} / {space.images.length}
          </p>
        </div>
      )}
    </div>
  );
}
