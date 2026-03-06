import { Link } from "react-router-dom";
import { Users, MapPin } from "lucide-react";
import { Stars } from "../shared";
import { formatUYU, AMENITIES } from "../../lib/utils";

export default function SpaceCard({ space, horizontal = false }) {
  const amenities = Array.isArray(space.amenities) ? space.amenities : [];
  const images = Array.isArray(space.images) && space.images.length > 0
    ? space.images
    : Array.isArray(space.photos) && space.photos.length > 0
      ? space.photos
      : ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800"];
  const rating = Number(space.rating ?? space.rating_avg ?? 0);
  const reviews = Number(space.reviews ?? space.rating_count ?? 0);
  const capacity = Number(space.capacity ?? space.max_guests ?? 0);
  const price = Number(space.price ?? space.price_per_hour ?? 0);
  const zone = space.zona ?? space.neighborhood ?? "Montevideo";
  const isSuperhost = Boolean(space?.host?.superhost);

  const topAmenities = amenities.slice(0, 3).map(
    (id) => AMENITIES.find((a) => a.id === id)
  ).filter(Boolean);

  if (horizontal) {
    return (
      <Link to={`/espacio/${space.id}`} className="block group">
        <div className="flex gap-4 bg-white rounded-2xl border border-[#1C1917]/8 p-3 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
          <div className="relative flex-shrink-0 w-32 h-28 sm:w-40 sm:h-32 rounded-xl overflow-hidden">
            <img
              src={images[0]}
              alt={space.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            {isSuperhost && (
              <span className="absolute top-2 left-2 bg-[#D4541B] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                SUPERHOST
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0 py-1">
            <p className="text-xs text-[#C2956B] font-semibold mb-0.5 flex items-center gap-1 font-['Inter']">
              <MapPin size={11} /> {zone}
            </p>
            <h3 className="font-bold text-[#1C1917] text-sm font-['Plus_Jakarta_Sans'] line-clamp-2 mb-1">
              {space.title}
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <Stars rating={rating} size={12} />
              <span className="text-xs text-[#1C1917]/50 font-['Inter']">({reviews})</span>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[#D4541B] font-bold font-['JetBrains_Mono'] text-sm">
                {formatUYU(price)}<span className="text-[#1C1917]/40 text-xs font-normal">/hr</span>
              </p>
              <span className="text-xs text-[#1C1917]/50 flex items-center gap-1 font-['Inter']">
                <Users size={11} /> hasta {capacity}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/espacio/${space.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-[#1C1917]/8 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
        <div className="relative h-52 overflow-hidden">
          <img
            src={images[0]}
            alt={space.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          {isSuperhost && (
            <span className="absolute top-3 left-3 bg-[#D4541B] text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              SUPERHOST
            </span>
          )}
          <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm rounded-xl px-2.5 py-1 flex items-center gap-1.5">
            <Stars rating={rating} size={12} />
            <span className="text-xs font-bold text-[#1C1917] font-['JetBrains_Mono']">{rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="p-4">
          <p className="text-xs text-[#C2956B] font-semibold mb-1 flex items-center gap-1 font-['Inter']">
            <MapPin size={11} /> {zone}
          </p>
          <h3 className="font-bold text-[#1C1917] font-['Plus_Jakarta_Sans'] mb-2 line-clamp-2">
            {space.title}
          </h3>

          <div className="flex flex-wrap gap-1.5 mb-3">
            {topAmenities.map((a) => (
              <span key={a.id} className="text-xs bg-[#FAF7F2] border border-[#1C1917]/10 text-[#1C1917]/70 px-2 py-0.5 rounded-full font-['Inter']">
                {a.icon} {a.label}
              </span>
            ))}
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-[#1C1917]/8">
            <div>
              <span className="text-[#D4541B] font-bold text-lg font-['JetBrains_Mono']">{formatUYU(price)}</span>
              <span className="text-[#1C1917]/40 text-xs ml-1 font-['Inter']">/ hora</span>
            </div>
            <span className="text-xs text-[#1C1917]/50 flex items-center gap-1 font-['Inter']">
              <Users size={12} /> hasta {capacity} personas
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
