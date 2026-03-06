import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Share2, Heart, ChevronLeft, ChevronRight, X, Shield } from "lucide-react";
import CheckoutButton from "../components/booking/CheckoutButton";
import { Button, Stars, AmenityTag, Avatar, Card, Badge, Skeleton } from "../components/shared";
import { getSpaceReviews, getSpaceWithHost } from "../lib/supabase";
import { AMENITIES, formatUYU } from "../lib/utils";

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800";

export default function SpaceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [space, setSpace] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadSpace() {
      setLoading(true);
      setError("");

      try {
        if (!id) throw new Error("ID de espacio invÃ¡lido");

        const [spaceData, reviewsData] = await Promise.all([
          getSpaceWithHost(id),
          getSpaceReviews(id, 12),
        ]);

        if (!cancelled) {
          setSpace(spaceData);
          setReviews(reviewsData);
        }
      } catch (err) {
        console.error("Error cargando espacio:", err);
        if (!cancelled) setError("No pudimos cargar este espacio.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSpace();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const normalized = useMemo(() => {
    if (!space) return null;

    const photos = Array.isArray(space.photos) && space.photos.length > 0
      ? space.photos
      : [PLACEHOLDER_IMAGE];

    const rating = Number(space.rating_avg ?? 0);
    const ratingCount = Number(space.rating_count ?? 0);
    const hostName = space.host?.full_name ?? "AnfitriÃ³n";
    const amenities = Array.isArray(space.amenities) ? space.amenities : [];
    const amenityData = amenities
      .map((amenityId) => AMENITIES.find((amenity) => amenity.id === amenityId))
      .filter(Boolean);

    const rules = (space.house_rules ?? "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    return {
      ...space,
      photos,
      rating,
      ratingCount,
      hostName,
      amenityData,
      rules,
      superhost: rating >= 4.8 && ratingCount >= 10,
      zoneLabel: space.neighborhood ?? "Montevideo",
    };
  }, [space]);

  if (loading) {
    return (
      <div className="bg-[#FAF7F2] min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20 space-y-4">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-12 w-2/3" />
          <Skeleton className="h-96 w-full rounded-2xl" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
            <Skeleton className="h-[420px] w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !normalized) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <p className="text-[#1C1917]/60 font-['Inter']">{error || "Espacio no encontrado."}</p>
        <Button onClick={() => navigate("/buscar")} className="mt-4">Volver a buscar</Button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAF7F2] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-20">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-[#1C1917]/60 hover:text-[#1C1917] mb-4 font-['Inter'] transition-colors">
          <ChevronLeft size={16} /> Volver
        </button>

        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">{normalized.title}</h1>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <Stars rating={normalized.rating} size={14} showNumber />
              <span className="text-sm text-[#1C1917]/50 font-['Inter']">({normalized.ratingCount} reseÃ±as)</span>
              {normalized.superhost && <Badge variant="brasa">? Superhost</Badge>}
              <span className="text-sm text-[#C2956B] flex items-center gap-1 font-['Inter']">
                <MapPin size={13} /> {normalized.zoneLabel}, {normalized.city ?? "Montevideo"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="p-2.5 rounded-xl border border-[#1C1917]/15 hover:bg-white transition-colors" aria-label="Compartir">
              <Share2 size={18} className="text-[#1C1917]" />
            </button>
            <button
              onClick={() => setLiked(!liked)}
              className="p-2.5 rounded-xl border border-[#1C1917]/15 hover:bg-white transition-colors"
              aria-label="Guardar"
            >
              <Heart size={18} className={liked ? "text-[#D4541B] fill-[#D4541B]" : "text-[#1C1917]"} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-72 sm:h-96 mb-8 rounded-2xl overflow-hidden">
          {normalized.photos[0] && (
            <div className="col-span-2 row-span-2 relative cursor-pointer" onClick={() => { setGalleryIdx(0); setGalleryOpen(true); }}>
              <img src={normalized.photos[0]} alt={normalized.title} className="w-full h-full object-cover hover:brightness-90 transition-all" />
            </div>
          )}

          {normalized.photos.slice(1, 3).map((photo, idx) => (
            <div key={idx} className="col-span-2 relative cursor-pointer" onClick={() => { setGalleryIdx(idx + 1); setGalleryOpen(true); }}>
              <img src={photo} alt={normalized.title} className="w-full h-full object-cover hover:brightness-90 transition-all" />
              {idx === 1 && normalized.photos.length > 3 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">+{normalized.photos.length - 3} fotos</span>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-[#1C1917]/10">
              <div>
                <p className="font-bold text-[#1C1917] text-lg font-['Plus_Jakarta_Sans']">
                  AnfitriÃ³n: {normalized.hostName}
                </p>
                <p className="text-sm text-[#1C1917]/50 font-['Inter']">Capacidad: hasta {normalized.max_guests} personas</p>
              </div>
              <Avatar src={normalized.host?.avatar_url} name={normalized.hostName} size="lg" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">Sobre el espacio</h2>
              <p className="text-[#1C1917]/70 leading-relaxed font-['Inter']">{normalized.description || "Sin descripciÃ³n por ahora."}</p>
            </div>

            <div>
              <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-4">QuÃ© incluye</h2>
              {normalized.amenityData.length === 0 ? (
                <p className="text-sm text-[#1C1917]/50 font-['Inter']">El anfitriÃ³n aÃºn no cargÃ³ amenities.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {normalized.amenityData.map((amenity) => (
                    <AmenityTag key={amenity.id} icon={amenity.icon} label={amenity.label} />
                  ))}
                </div>
              )}
            </div>

            {normalized.rules.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-3">Reglas del espacio</h2>
                <ul className="space-y-2">
                  {normalized.rules.map((rule, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[#1C1917]/70 font-['Inter']">
                      <span className="text-[#D4541B] mt-0.5">?</span> {rule}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="flex items-center gap-3 mb-5">
                <h2 className="text-xl font-bold text-[#1C1917] font-['Plus_Jakarta_Sans']">ReseÃ±as</h2>
                <div className="flex items-center gap-2 bg-[#FAF7F2] border border-[#1C1917]/10 rounded-xl px-3 py-1">
                  <Stars rating={normalized.rating} size={13} />
                  <span className="text-sm font-bold text-[#1C1917] font-['JetBrains_Mono']">{normalized.rating.toFixed(1)}</span>
                  <span className="text-xs text-[#1C1917]/40 font-['Inter']">Â· {normalized.ratingCount} reseÃ±as</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <p className="text-sm text-[#1C1917]/50 font-['Inter']">AÃºn no hay reseÃ±as para este espacio.</p>
              ) : (
                <div className="space-y-5">
                  {reviews.map((review) => (
                    <div key={review.id} className="pb-5 border-b border-[#1C1917]/8 last:border-0">
                      <div className="flex items-center gap-3 mb-2">
                        <Avatar src={review.reviewer?.avatar_url} name={review.reviewer?.full_name ?? "Usuario"} size="sm" />
                        <div>
                          <p className="text-sm font-semibold text-[#1C1917] font-['Inter']">{review.reviewer?.full_name ?? "Usuario"}</p>
                          <p className="text-xs text-[#1C1917]/40 font-['Inter']">
                            {new Date(review.created_at).toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <Stars rating={review.rating} size={12} />
                        </div>
                      </div>
                      <p className="text-sm text-[#1C1917]/70 leading-relaxed font-['Inter']">{review.comment || "Sin comentario."}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-[#4A5E3A]/8 border border-[#4A5E3A]/20 rounded-2xl p-5">
              <div className="flex items-start gap-3">
                <Shield size={20} className="text-[#4A5E3A] flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#1C1917] text-sm font-['Inter'] mb-1">Reservas seguras con Prende</p>
                  <p className="text-xs text-[#1C1917]/60 leading-relaxed font-['Inter']">
                    Pagos protegidos, validaciÃ³n de reserva en backend y confirmaciÃ³n automÃ¡tica al acreditarse el pago.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <Card className="p-5 sticky top-24">
              <div className="flex items-baseline gap-1 mb-5">
                <span className="text-2xl font-bold text-[#D4541B] font-['JetBrains_Mono']">{formatUYU(normalized.price_per_hour)}</span>
                <span className="text-sm text-[#1C1917]/50 font-['Inter']">/ hora</span>
              </div>

              <CheckoutButton
                spaceId={normalized.id}
                pricePerHour={normalized.price_per_hour}
                minHours={normalized.min_hours}
                maxGuests={normalized.max_guests}
                spaceName={normalized.title}
                onConfirmed={() => navigate("/mis-reservas")}
              />
            </Card>
          </div>
        </div>
      </div>

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
            src={normalized.photos[galleryIdx]}
            alt={normalized.title}
            className="max-h-[85vh] max-w-[85vw] object-contain rounded-xl"
          />
          <button
            onClick={() => setGalleryIdx(Math.min(normalized.photos.length - 1, galleryIdx + 1))}
            className="absolute right-4 text-white p-3 hover:bg-white/10 rounded-xl disabled:opacity-30"
            disabled={galleryIdx === normalized.photos.length - 1}
          >
            <ChevronRight size={28} />
          </button>
          <p className="absolute bottom-6 text-white/60 text-sm font-['Inter']">
            {galleryIdx + 1} / {normalized.photos.length}
          </p>
        </div>
      )}
    </div>
  );
}
