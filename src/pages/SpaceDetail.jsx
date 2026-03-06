import { createElement, useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { MapPin, Share2, Heart, ChevronLeft, ChevronRight, X, Shield, Users, Clock3, Sparkles } from "lucide-react";
import CheckoutButton from "../components/booking/CheckoutButton";
import { Button, Stars, AmenityTag, Avatar, Card, Badge, Skeleton, PageContainer } from "../components/shared";
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
        if (!id) throw new Error("ID de espacio invalido");

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

    const photos = Array.isArray(space.photos) && space.photos.length > 0 ? space.photos : [PLACEHOLDER_IMAGE];
    const rating = Number(space.rating_avg ?? 0);
    const ratingCount = Number(space.rating_count ?? 0);
    const hostName = space.host?.full_name ?? "Anfitrion";
    const amenities = Array.isArray(space.amenities) ? space.amenities : [];
    const amenityData = amenities
      .map((amenityId) => AMENITIES.find((amenity) => amenity.id === amenityId))
      .filter(Boolean);
    const rules = String(space.house_rules ?? "")
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
      <PageContainer>
        <div className="space-y-5">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-16 w-2/3" />
          <Skeleton className="h-[28rem] w-full rounded-[36px]" />
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-5">
              <Skeleton className="h-48 w-full rounded-[32px]" />
              <Skeleton className="h-60 w-full rounded-[32px]" />
              <Skeleton className="h-60 w-full rounded-[32px]" />
            </div>
            <Skeleton className="h-[36rem] w-full rounded-[32px]" />
          </div>
        </div>
      </PageContainer>
    );
  }

  if (error || !normalized) {
    return (
      <PageContainer className="flex min-h-[60vh] items-center justify-center">
        <div className="surface-card max-w-xl rounded-[34px] px-8 py-10 text-center">
          <p className="text-sm text-[#171616]/62">{error || "Espacio no encontrado."}</p>
          <Button onClick={() => navigate("/buscar")} className="mt-5">Volver a explorar</Button>
        </div>
      </PageContainer>
    );
  }

  const heroPhotos = normalized.photos.slice(0, 5);

  return (
    <PageContainer>
      <button type="button" onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm font-medium text-[#171616]/58 transition hover:text-[#171616]">
        <ChevronLeft size={16} /> Volver
      </button>

      <section className="mt-4 section-shell rounded-[40px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <div className="flex flex-wrap items-center gap-2">
              {normalized.superhost && <Badge variant="brasa">Superhost</Badge>}
              <Badge variant="default">Curado por Prende</Badge>
              <Badge variant="oliva">Pago seguro</Badge>
            </div>
            <h1 className="mt-5 font-display text-5xl leading-none text-[#171616] sm:text-6xl lg:text-7xl">
              {normalized.title}
            </h1>
            <div className="mt-5 flex flex-wrap items-center gap-4 text-sm text-[#171616]/62">
              <div className="flex items-center gap-2">
                <Stars rating={normalized.rating} size={14} showNumber />
                <span>{normalized.ratingCount} reseñas</span>
              </div>
              <span className="inline-flex items-center gap-2"><MapPin size={14} /> {normalized.zoneLabel}, {normalized.city ?? "Montevideo"}</span>
              <span className="inline-flex items-center gap-2"><Users size={14} /> Hasta {normalized.max_guests} invitados</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" className="glass-shell rounded-full p-3 text-[#171616] transition hover:-translate-y-0.5" aria-label="Compartir">
              <Share2 size={17} />
            </button>
            <button
              type="button"
              onClick={() => setLiked((value) => !value)}
              className="glass-shell rounded-full p-3 text-[#171616] transition hover:-translate-y-0.5"
              aria-label="Guardar"
            >
              <Heart size={17} className={liked ? "fill-[#d5632a] text-[#d5632a]" : ""} />
            </button>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-8">
          <div className="grid gap-3 sm:grid-cols-4 sm:grid-rows-2">
            <button
              type="button"
              onClick={() => { setGalleryIdx(0); setGalleryOpen(true); }}
              className="group relative overflow-hidden rounded-[34px] sm:col-span-2 sm:row-span-2"
            >
              <img src={heroPhotos[0]} alt={normalized.title} className="h-full min-h-[20rem] w-full object-cover transition duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#171616]/45 via-transparent to-transparent" />
            </button>

            {heroPhotos.slice(1, 5).map((photo, index) => {
              const photoIndex = index + 1;
              const isLastTile = photoIndex === 4 && normalized.photos.length > 5;

              return (
                <button
                  key={photo}
                  type="button"
                  onClick={() => { setGalleryIdx(photoIndex); setGalleryOpen(true); }}
                  className="group relative overflow-hidden rounded-[28px]"
                >
                  <img src={photo} alt={`${normalized.title} ${photoIndex + 1}`} className="h-40 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#171616]/45 via-transparent to-transparent" />
                  {isLastTile && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[#171616]/45 text-lg font-semibold text-white backdrop-blur-sm">
                      +{normalized.photos.length - 5} fotos
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          <Card className="rounded-[36px] p-6 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Anfitrion</p>
                <h2 className="mt-2 text-3xl font-semibold text-[#171616]">{normalized.hostName}</h2>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-[#171616]/62">
                  Espacio verificado con reglas claras, horarios definidos y respuesta centralizada desde Prende.
                </p>
              </div>
              <Avatar src={normalized.host?.avatar_url} name={normalized.hostName} size="lg" />
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <InfoCard icon={Users} title="Capacidad" value={`Hasta ${normalized.max_guests}`} />
              <InfoCard icon={Clock3} title="Minimo" value={`${normalized.min_hours} horas`} />
              <InfoCard icon={Sparkles} title="Operacion" value="Confirmacion automatica" />
            </div>
          </Card>

          <Card className="rounded-[36px] p-6 sm:p-8">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Sobre el espacio</p>
            <h2 className="mt-3 font-display text-4xl leading-none text-[#171616]">Una experiencia lista para recibir.</h2>
            <p className="mt-5 text-sm leading-7 text-[#171616]/68 sm:text-base">
              {normalized.description || "El anfitrion aun no agrego descripcion para este espacio."}
            </p>
          </Card>

          <Card className="rounded-[36px] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Amenities</p>
                <h2 className="mt-3 font-display text-4xl leading-none text-[#171616]">Todo lo importante, visible antes de pagar.</h2>
              </div>
              <Badge variant="terracota">{normalized.amenityData.length} incluidos</Badge>
            </div>
            {normalized.amenityData.length === 0 ? (
              <p className="mt-6 text-sm text-[#171616]/58">Este espacio todavia no tiene amenities cargados.</p>
            ) : (
              <div className="mt-6 flex flex-wrap gap-3">
                {normalized.amenityData.map((amenity) => (
                  <AmenityTag key={amenity.id} icon={amenity.icon} label={amenity.label} />
                ))}
              </div>
            )}
          </Card>

          {normalized.rules.length > 0 && (
            <Card className="rounded-[36px] p-6 sm:p-8">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Reglas</p>
              <h2 className="mt-3 font-display text-4xl leading-none text-[#171616]">Lo que se espera para una reserva sin friccion.</h2>
              <ul className="mt-6 grid gap-3">
                {normalized.rules.map((rule, index) => (
                  <li key={`${rule}-${index}`} className="flex items-start gap-3 rounded-[24px] border border-[#171616]/8 bg-white/70 px-4 py-4 text-sm leading-relaxed text-[#171616]/68">
                    <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-[#171616] text-xs font-semibold text-[#f7f1e8]">{index + 1}</span>
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card className="rounded-[36px] p-6 sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Reseñas</p>
                <h2 className="mt-3 font-display text-4xl leading-none text-[#171616]">Confianza antes de confirmar.</h2>
              </div>
              <div className="rounded-full border border-[#171616]/10 bg-white/80 px-4 py-3 text-sm text-[#171616]">
                <Stars rating={normalized.rating} size={13} showNumber />
              </div>
            </div>

            {reviews.length === 0 ? (
              <p className="mt-6 text-sm text-[#171616]/58">Aun no hay reseñas publicadas para este espacio.</p>
            ) : (
              <div className="mt-6 grid gap-4">
                {reviews.map((review) => (
                  <article key={review.id} className="rounded-[26px] border border-[#171616]/8 bg-white/75 px-5 py-5 shadow-[0_18px_36px_-34px_rgba(23,22,22,0.65)]">
                    <div className="flex items-start gap-4">
                      <Avatar src={review.reviewer?.avatar_url} name={review.reviewer?.full_name ?? "Usuario"} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-[#171616]">{review.reviewer?.full_name ?? "Usuario"}</p>
                            <p className="text-xs text-[#171616]/42">
                              {new Date(review.created_at).toLocaleDateString("es-UY", { month: "long", year: "numeric" })}
                            </p>
                          </div>
                          <Stars rating={review.rating} size={12} />
                        </div>
                        <p className="mt-4 text-sm leading-relaxed text-[#171616]/66">{review.comment || "Sin comentario."}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </Card>

          <div className="rounded-[34px] border border-[#5f6f52]/14 bg-[linear-gradient(180deg,#f8fbf4_0%,#eef4e8_100%)] px-5 py-5 shadow-[0_22px_42px_-34px_rgba(95,111,82,0.42)] sm:px-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#5f6f52] text-white shadow-[0_18px_30px_-22px_rgba(95,111,82,0.8)]">
                <Shield size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#171616]">Reserva segura y trazable</p>
                <p className="mt-2 text-sm leading-relaxed text-[#171616]/62">
                  Tarjetas, Mercado Pago y redes locales se procesan con validacion backend, auditoria y confirmacion automatica por webhook.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:pt-12">
          <Card className="sticky top-24 rounded-[36px] overflow-hidden p-0">
            <div className="border-b border-[#171616]/8 bg-[linear-gradient(135deg,#171616_0%,#2a2521_100%)] px-6 py-6 text-[#f7f1e8]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#f7f1e8]/45">Tarifa base</p>
                  <p className="mt-2 font-mono text-4xl font-semibold text-white">{formatUYU(normalized.price_per_hour)}</p>
                  <p className="mt-1 text-sm text-[#f7f1e8]/62">por hora</p>
                </div>
                <div className="rounded-full border border-white/12 bg-white/10 px-3 py-1.5 text-xs uppercase tracking-[0.16em] text-white/88">
                  Checkout premium
                </div>
              </div>
              <div className="mt-5 flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-white/10 text-white">Tarjeta</Badge>
                <Badge className="border-white/10 bg-white/10 text-white">Abitab</Badge>
                <Badge className="border-white/10 bg-white/10 text-white">Red Pagos</Badge>
              </div>
            </div>

            <div className="px-4 py-4 sm:px-5 sm:py-5">
              <CheckoutButton
                spaceId={normalized.id}
                pricePerHour={normalized.price_per_hour}
                minHours={normalized.min_hours}
                maxGuests={normalized.max_guests}
                spaceName={normalized.title}
              />
            </div>
          </Card>
        </div>
      </section>

      {galleryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#171616]/92 px-4 backdrop-blur-md">
          <button type="button" onClick={() => setGalleryOpen(false)} className="absolute right-4 top-4 rounded-full border border-white/12 bg-white/10 p-3 text-white transition hover:bg-white/20" aria-label="Cerrar galeria">
            <X size={22} />
          </button>
          <button
            type="button"
            onClick={() => setGalleryIdx((index) => Math.max(0, index - 1))}
            className="absolute left-4 rounded-full border border-white/12 bg-white/10 p-3 text-white transition hover:bg-white/20 disabled:opacity-35"
            disabled={galleryIdx === 0}
            aria-label="Foto anterior"
          >
            <ChevronLeft size={24} />
          </button>
          <img src={normalized.photos[galleryIdx]} alt={normalized.title} className="max-h-[84vh] max-w-[88vw] rounded-[28px] object-contain" />
          <button
            type="button"
            onClick={() => setGalleryIdx((index) => Math.min(normalized.photos.length - 1, index + 1))}
            className="absolute right-4 rounded-full border border-white/12 bg-white/10 p-3 text-white transition hover:bg-white/20 disabled:opacity-35"
            disabled={galleryIdx === normalized.photos.length - 1}
            aria-label="Foto siguiente"
          >
            <ChevronRight size={24} />
          </button>
          <div className="absolute bottom-6 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-sm text-white backdrop-blur-sm">
            {galleryIdx + 1} / {normalized.photos.length}
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function InfoCard({ icon, title, value }) {
  return (
    <div className="rounded-[26px] border border-[#171616]/8 bg-white/75 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_16px_26px_-20px_rgba(23,22,22,0.85)]">
          {createElement(icon, { size: 15 })}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">{title}</p>
          <p className="mt-1 text-sm font-semibold text-[#171616]">{value}</p>
        </div>
      </div>
    </div>
  );
}

