import { Link } from "react-router-dom";
import { Users, MapPin, ArrowUpRight } from "lucide-react";
import { Badge, Stars } from "../shared";
import { formatUYU, AMENITIES } from "../../lib/utils";

const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800";

export default function SpaceCard({ space, horizontal = false }) {
  const amenities = Array.isArray(space.amenities) ? space.amenities : [];
  const images = Array.isArray(space.images) && space.images.length > 0
    ? space.images
    : Array.isArray(space.photos) && space.photos.length > 0
      ? space.photos
      : [FALLBACK_IMAGE];
  const rating = Number(space.rating ?? space.rating_avg ?? 0);
  const reviews = Number(space.reviews ?? space.rating_count ?? 0);
  const capacity = Number(space.capacity ?? space.max_guests ?? 0);
  const price = Number(space.price ?? space.price_per_hour ?? 0);
  const zone = space.zona ?? space.neighborhood ?? "Montevideo";
  const isSuperhost = Boolean(space?.host?.superhost);
  const topAmenities = amenities.slice(0, horizontal ? 2 : 3)
    .map((id) => AMENITIES.find((amenity) => amenity.id === id))
    .filter(Boolean);

  if (horizontal) {
    return (
      <Link to={`/espacio/${space.id}`} className="group block">
        <article className="surface-card surface-card-hover grid overflow-hidden rounded-[32px] border border-[#171616]/8 p-3 sm:grid-cols-[220px_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-[24px]">
            <img
              src={images[0]}
              alt={space.title}
              className="h-52 w-full object-cover transition duration-500 group-hover:scale-[1.04] group-hover:brightness-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#231d19]/46 via-transparent to-transparent transition duration-300 group-hover:from-[#231d19]/38" />
            <div className="absolute left-4 top-4 flex flex-wrap gap-2">
              {isSuperhost && <Badge variant="brasa">Superhost</Badge>}
              <Badge variant="default">{capacity} pax</Badge>
            </div>
          </div>

          <div className="flex min-w-0 flex-col justify-between px-2 py-2 sm:px-5">
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#171616]/40">
                  <MapPin size={12} />
                  {zone}
                </p>
                <span className="subtle-hover rounded-full border border-[#171616]/10 bg-white/75 p-2 text-[#171616]/55 transition group-hover:border-[#d5632a]/18 group-hover:bg-[#fff4ed] group-hover:text-[#d5632a]">
                  <ArrowUpRight size={15} />
                </span>
              </div>
              <h3 className="mt-3 text-2xl font-semibold leading-tight text-[#171616]">{space.title}</h3>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#171616]/55">
                <Stars rating={rating} size={13} showNumber />
                <span>{reviews} reseñas</span>
                <span className="inline-flex items-center gap-1"><Users size={13} /> Hasta {capacity}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {topAmenities.map((amenity) => (
                  <span key={amenity.id} className="subtle-hover rounded-full border border-[#171616]/10 bg-white/75 px-3 py-1.5 text-xs text-[#171616]/62 group-hover:border-[#171616]/14 group-hover:bg-white/92">
                    {amenity.icon} {amenity.label}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-end justify-between gap-4 border-t border-[#171616]/8 pt-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Desde</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-[#d5632a]">{formatUYU(price)}</p>
                <p className="text-xs text-[#171616]/45">por hora</p>
              </div>
              <span className="text-sm font-medium text-[#171616]/72">Ver disponibilidad</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link to={`/espacio/${space.id}`} className="group block h-full">
      <article className="surface-card surface-card-hover flex h-full flex-col overflow-hidden rounded-[32px] border border-[#171616]/8">
        <div className="relative overflow-hidden">
          <img
            src={images[0]}
            alt={space.title}
            className="h-64 w-full object-cover transition duration-500 group-hover:scale-[1.04] group-hover:brightness-[1.03]"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#231d19]/56 via-[#231d19]/8 to-transparent transition duration-300 group-hover:from-[#231d19]/46" />
          <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {isSuperhost && <Badge variant="brasa">Superhost</Badge>}
              <Badge variant="default">{zone}</Badge>
            </div>
            <div className="subtle-hover rounded-full border border-white/14 bg-[#231d19]/42 px-3 py-1.5 text-white backdrop-blur-md group-hover:bg-[#231d19]/34">
              <Stars rating={rating} size={12} showNumber />
            </div>
          </div>
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3 text-white">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-white/68">Capacidad</p>
              <p className="mt-1 text-sm font-medium">Hasta {capacity} personas</p>
            </div>
            <span className="subtle-hover rounded-full border border-white/14 bg-white/10 p-2 backdrop-blur-md transition group-hover:bg-[#d5632a]/88 group-hover:text-white">
              <ArrowUpRight size={16} />
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col px-5 pb-5 pt-5">
          <h3 className="text-2xl font-semibold leading-tight text-[#171616]">{space.title}</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {topAmenities.map((amenity) => (
              <span key={amenity.id} className="subtle-hover rounded-full border border-[#171616]/10 bg-white/75 px-3 py-1.5 text-xs text-[#171616]/62 group-hover:border-[#171616]/14 group-hover:bg-white/92">
                {amenity.icon} {amenity.label}
              </span>
            ))}
          </div>

          <div className="mt-auto pt-6">
            <div className="flex items-end justify-between gap-3 border-t border-[#171616]/8 pt-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Desde</p>
                <p className="mt-1 font-mono text-2xl font-semibold text-[#d5632a]">{formatUYU(price)}</p>
                <p className="text-xs text-[#171616]/45">por hora</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-[#171616]">Agenda premium</p>
                <p className="mt-1 text-xs text-[#171616]/48">Confirmacion inmediata</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
}
