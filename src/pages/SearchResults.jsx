import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X } from "lucide-react";
import SpaceCard from "../components/booking/SpaceCard";
import { Button, EmptyState, Skeleton } from "../components/shared";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { ZONAS, AMENITIES } from "../lib/utils";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio: menor a mayor" },
  { value: "price_desc", label: "Precio: mayor a menor" },
  { value: "rating", label: "Mejor puntuaciÃ³n" },
];

const PLACEHOLDER_IMAGE = "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800";

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [zona, setZona] = useState(searchParams.get("zona") || "");
  const [fecha, setFecha] = useState(searchParams.get("fecha") || "");
  const [personas, setPersonas] = useState(Number(searchParams.get("personas")) || 2);
  const [sort, setSort] = useState("relevance");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [maxPrice, setMaxPrice] = useState(5000);

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams();
    if (zona) params.set("zona", zona);
    if (fecha) params.set("fecha", fecha);
    if (personas) params.set("personas", String(personas));
    setSearchParams(params, { replace: true });
  }, [zona, fecha, personas, setSearchParams]);

  useEffect(() => {
    let cancelled = false;

    async function loadSpaces() {
      setLoading(true);
      setError("");

      try {
        if (!supabaseConfigured) throw new Error("Supabase no configurado");

        let query = supabase
          .from("spaces")
          .select("id, title, neighborhood, city, price_per_hour, max_guests, rating_avg, rating_count, photos, amenities")
          .eq("status", "active")
          .gte("max_guests", personas)
          .lte("price_per_hour", maxPrice);

        if (zona) query = query.eq("neighborhood", zona);

        const { data: spaces, error: spacesError } = await query;
        if (spacesError) throw spacesError;

        let filtered = (spaces ?? []).filter((space) => {
          if (!selectedAmenities.length) return true;
          const spaceAmenities = Array.isArray(space.amenities) ? space.amenities : [];
          return selectedAmenities.every((amenityId) => spaceAmenities.includes(amenityId));
        });

        if (fecha && filtered.length > 0) {
          const spaceIds = filtered.map((space) => space.id);

          const [bookedResult, blockedResult] = await Promise.all([
            supabase
              .from("bookings")
              .select("space_id")
              .eq("date", fecha)
              .in("status", ["paid", "confirmed"])
              .in("space_id", spaceIds),
            supabase
              .from("space_blocked_dates")
              .select("space_id")
              .eq("blocked_date", fecha)
              .in("space_id", spaceIds),
          ]);

          if (bookedResult.error) throw bookedResult.error;
          if (blockedResult.error) throw blockedResult.error;

          const unavailable = new Set([
            ...(bookedResult.data ?? []).map((row) => row.space_id),
            ...(blockedResult.data ?? []).map((row) => row.space_id),
          ]);

          filtered = filtered.filter((space) => !unavailable.has(space.id));
        }

        const mapped = filtered.map((space) => ({
          id: space.id,
          title: space.title,
          zona: space.neighborhood ?? space.city ?? "Montevideo",
          price: space.price_per_hour,
          rating: Number(space.rating_avg ?? 0),
          reviews: Number(space.rating_count ?? 0),
          capacity: space.max_guests,
          images: Array.isArray(space.photos) && space.photos.length > 0 ? space.photos : [PLACEHOLDER_IMAGE],
          amenities: Array.isArray(space.amenities) ? space.amenities : [],
          host: {
            superhost: Number(space.rating_avg ?? 0) >= 4.8 && Number(space.rating_count ?? 0) >= 10,
          },
        }));

        if (!cancelled) setResults(mapped);
      } catch (err) {
        console.error("Error cargando resultados:", err);
        if (!cancelled) {
          setError("No pudimos cargar los espacios. IntentÃ¡ nuevamente.");
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadSpaces();

    return () => {
      cancelled = true;
    };
  }, [zona, fecha, personas, maxPrice, selectedAmenities]);

  const sortedResults = useMemo(() => {
    const clone = [...results];
    if (sort === "price_asc") clone.sort((a, b) => a.price - b.price);
    if (sort === "price_desc") clone.sort((a, b) => b.price - a.price);
    if (sort === "rating") clone.sort((a, b) => b.rating - a.rating);
    return clone;
  }, [results, sort]);

  function toggleAmenity(id) {
    setSelectedAmenities((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function clearFilters() {
    setZona("");
    setFecha("");
    setPersonas(2);
    setSelectedAmenities([]);
    setMaxPrice(5000);
  }

  const activeFilters = [
    zona && { label: zona, onRemove: () => setZona("") },
    ...selectedAmenities.map((id) => {
      const amenity = AMENITIES.find((x) => x.id === id);
      return { label: `${amenity?.icon ?? ""} ${amenity?.label ?? id}`.trim(), onRemove: () => toggleAmenity(id) };
    }),
  ].filter(Boolean);

  return (
    <div className="min-h-screen bg-[#FAF7F2]">
      <div className="sticky top-16 z-30 bg-[#FAF7F2]/95 backdrop-blur-sm border-b border-[#1C1917]/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <select
            value={zona}
            onChange={(e) => setZona(e.target.value)}
            className="text-sm border border-[#1C1917]/20 rounded-xl px-3 py-2 bg-white font-['Inter'] text-[#1C1917] outline-none focus:ring-2 focus:ring-[#D4541B]"
          >
            <option value="">Toda Montevideo</option>
            {ZONAS.map((z) => <option key={z} value={z}>{z}</option>)}
          </select>

          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="text-sm border border-[#1C1917]/20 rounded-xl px-3 py-2 bg-white font-['Inter'] text-[#1C1917] outline-none focus:ring-2 focus:ring-[#D4541B]"
          />

          <div className="flex items-center gap-2 border border-[#1C1917]/20 rounded-xl px-3 py-2 bg-white">
            <span className="text-xs text-[#1C1917]/50 font-['Inter']">Personas:</span>
            <input
              type="number"
              min={1}
              max={50}
              value={personas}
              onChange={(e) => setPersonas(Math.max(1, Number(e.target.value) || 1))}
              className="w-12 text-sm text-[#1C1917] font-medium outline-none font-['JetBrains_Mono']"
            />
          </div>

          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl border transition-colors font-['Inter'] ${filterOpen || selectedAmenities.length ? "bg-[#1C1917] text-white border-[#1C1917]" : "bg-white text-[#1C1917] border-[#1C1917]/20 hover:border-[#1C1917]"}`}
          >
            <SlidersHorizontal size={16} />
            Filtros
            {selectedAmenities.length > 0 && (
              <span className="bg-[#D4541B] text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {selectedAmenities.length}
              </span>
            )}
          </button>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-xs text-[#1C1917]/50 hidden sm:block font-['Inter']">Ordenar:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-sm border border-[#1C1917]/20 rounded-xl px-3 py-2 bg-white font-['Inter'] text-[#1C1917] outline-none"
            >
              {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>
        </div>

        {activeFilters.length > 0 && (
          <div className="max-w-6xl mx-auto px-4 pb-3 flex flex-wrap gap-2">
            {activeFilters.map((filter, idx) => (
              <span key={idx} className="flex items-center gap-1.5 bg-[#1C1917] text-[#F5F0E8] text-xs font-medium px-2.5 py-1 rounded-full font-['Inter']">
                {filter.label}
                <button onClick={filter.onRemove} className="hover:text-[#D4541B] transition-colors"><X size={12} /></button>
              </span>
            ))}
            <button onClick={clearFilters} className="text-xs text-[#D4541B] font-medium hover:underline font-['Inter']">
              Limpiar todo
            </button>
          </div>
        )}

        {filterOpen && (
          <div className="bg-white border-t border-[#1C1917]/10 px-4 py-5">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider mb-3 font-['Inter']">
                    Precio mÃ¡ximo/hora: <span className="text-[#D4541B]">${maxPrice.toLocaleString()}</span>
                  </p>
                  <input
                    type="range"
                    min={500}
                    max={5000}
                    step={100}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-[#D4541B]"
                  />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#1C1917]/40 uppercase tracking-wider mb-3 font-['Inter']">Amenities</p>
                  <div className="flex flex-wrap gap-2">
                    {AMENITIES.map((amenity) => (
                      <button
                        key={amenity.id}
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`text-xs px-3 py-1.5 rounded-full border transition-all font-['Inter'] ${selectedAmenities.includes(amenity.id) ? "bg-[#D4541B] text-white border-[#D4541B]" : "bg-white text-[#1C1917] border-[#1C1917]/20 hover:border-[#D4541B]"}`}
                      >
                        {amenity.icon} {amenity.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <p className="text-sm text-[#1C1917]/50 mb-5 font-['Inter']">
          <span className="font-bold text-[#1C1917]">{sortedResults.length}</span> espacios{zona && ` en ${zona}`}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-[#1C1917]/8 overflow-hidden">
                <Skeleton className="h-52 w-full rounded-none" />
                <div className="p-4 space-y-3">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : sortedResults.length === 0 ? (
          <EmptyState
            icon="??"
            title="No encontramos espacios"
            description="ProbÃ¡ con otros filtros o buscÃ¡ en toda Montevideo."
            action={<Button onClick={clearFilters} variant="outline">Limpiar filtros</Button>}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {sortedResults.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
