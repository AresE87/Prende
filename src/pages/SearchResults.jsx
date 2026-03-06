import { createElement, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { SlidersHorizontal, X, Sparkles, MapPin, CalendarDays, Users } from "lucide-react";
import SpaceCard from "../components/booking/SpaceCard";
import { Button, EmptyState, Skeleton, Badge, PageContainer } from "../components/shared";
import { supabase, supabaseConfigured } from "../lib/supabase";
import { ZONAS, AMENITIES } from "../lib/utils";

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevancia" },
  { value: "price_asc", label: "Precio ascendente" },
  { value: "price_desc", label: "Precio descendente" },
  { value: "rating", label: "Mejor puntuacion" },
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
          setError("No pudimos cargar los espacios. Intenta nuevamente.");
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
    setSelectedAmenities((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
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
    fecha && { label: fecha, onRemove: () => setFecha("") },
    personas && { label: `${personas} personas`, onRemove: () => setPersonas(2) },
    ...selectedAmenities.map((id) => {
      const amenity = AMENITIES.find((item) => item.id === id);
      return { label: `${amenity?.icon ?? ""} ${amenity?.label ?? id}`.trim(), onRemove: () => toggleAmenity(id) };
    }),
  ].filter(Boolean);

  return (
    <PageContainer className="pt-6 sm:pt-8">
      <section className="section-shell rounded-[38px] px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Badge variant="brasa">
              <Sparkles size={12} /> Curaduria premium
            </Badge>
            <h1 className="mt-4 max-w-3xl font-display text-5xl leading-none text-[#171616] sm:text-6xl lg:text-7xl">
              Espacios listos para una reserva impecable.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#171616]/62 sm:text-base">
              Filtra por zona, fecha y capacidad. Te mostramos solo lugares que mantienen una presentacion fuerte, disponibilidad clara y una experiencia de reserva seria.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
            <Metric icon={MapPin} label="Zona" value={zona || "Montevideo"} />
            <Metric icon={CalendarDays} label="Fecha" value={fecha || "Flexible"} />
            <Metric icon={Users} label="Invitados" value={`${personas}`} />
          </div>
        </div>
      </section>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="outline" size="sm" className="lg:hidden" onClick={() => setFilterOpen((open) => !open)}>
          <SlidersHorizontal size={15} />
          {filterOpen ? "Ocultar filtros" : "Mostrar filtros"}
        </Button>

        {activeFilters.map((filter, index) => (
          <button
            key={`${filter.label}-${index}`}
            type="button"
            onClick={filter.onRemove}
            className="inline-flex items-center gap-2 rounded-full border border-[#171616]/10 bg-white/80 px-3 py-2 text-xs font-medium text-[#171616] shadow-[0_12px_24px_-22px_rgba(23,22,22,0.58)] transition hover:border-[#171616]/24"
          >
            {filter.label}
            <X size={12} className="text-[#171616]/45" />
          </button>
        ))}

        {activeFilters.length > 0 && (
          <button type="button" onClick={clearFilters} className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d5632a]">
            Limpiar todo
          </button>
        )}
      </div>

      <div className="app-grid mt-6">
        <aside className={`${filterOpen ? "block" : "hidden"} lg:block`}>
          <div className="surface-card sticky top-24 rounded-[34px] p-5 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Refina la busqueda</p>
                <h2 className="mt-2 text-2xl font-semibold text-[#171616]">Filtros</h2>
              </div>
              <Badge variant="default">{sortedResults.length} resultados</Badge>
            </div>

            <div className="mt-6 space-y-5">
              <div>
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/42">Zona</label>
                <select
                  value={zona}
                  onChange={(event) => setZona(event.target.value)}
                  className="mt-2 w-full rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 text-sm text-[#171616] outline-none transition focus:border-[#d5632a]/40 focus:ring-4 focus:ring-[#d5632a]/10"
                >
                  <option value="">Toda Montevideo</option>
                  {ZONAS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/42">Fecha</label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(event) => setFecha(event.target.value)}
                  className="mt-2 w-full rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 text-sm text-[#171616] outline-none transition focus:border-[#d5632a]/40 focus:ring-4 focus:ring-[#d5632a]/10"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/42">Invitados</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={personas}
                  onChange={(event) => setPersonas(Math.max(1, Number(event.target.value) || 1))}
                  className="mt-2 w-full rounded-[22px] border border-[#171616]/10 bg-white/80 px-4 py-3.5 text-sm text-[#171616] outline-none transition focus:border-[#d5632a]/40 focus:ring-4 focus:ring-[#d5632a]/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <label className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/42">Precio maximo</label>
                  <span className="font-mono text-sm font-semibold text-[#d5632a]">$U {maxPrice.toLocaleString("es-UY")}</span>
                </div>
                <input
                  type="range"
                  min={500}
                  max={5000}
                  step={100}
                  value={maxPrice}
                  onChange={(event) => setMaxPrice(Number(event.target.value))}
                  className="mt-3 w-full accent-[#d5632a]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/42">Amenities</label>
                <div className="mt-3 flex flex-wrap gap-2">
                  {AMENITIES.map((amenity) => {
                    const active = selectedAmenities.includes(amenity.id);
                    return (
                      <button
                        key={amenity.id}
                        type="button"
                        onClick={() => toggleAmenity(amenity.id)}
                        className={`rounded-full border px-3 py-2 text-xs font-medium transition ${active ? "border-[#d5632a] bg-[#fff1e8] text-[#c24f20]" : "border-[#171616]/10 bg-white/75 text-[#171616]/65 hover:border-[#171616]/24"}`}
                      >
                        {amenity.icon} {amenity.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button fullWidth variant="ghost" onClick={clearFilters}>Reiniciar filtros</Button>
            </div>
          </div>
        </aside>

        <section>
          <div className="mb-4 flex flex-col gap-4 rounded-[30px] border border-[#171616]/8 bg-white/55 px-5 py-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">Resultados</p>
              <p className="mt-1 text-sm text-[#171616]/62">
                <span className="font-semibold text-[#171616]">{sortedResults.length}</span> espacios encontrados{zona && ` en ${zona}`}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs uppercase tracking-[0.16em] text-[#171616]/35">Orden</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
                className="rounded-full border border-[#171616]/10 bg-white/80 px-4 py-2.5 text-sm text-[#171616] outline-none transition focus:border-[#d5632a]/40"
              >
                {SORT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="surface-card overflow-hidden rounded-[32px] p-3">
                  <Skeleton className="h-56 w-full rounded-[24px]" />
                  <div className="space-y-3 p-4">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : sortedResults.length === 0 ? (
            <EmptyState
              icon="-"
              title="No encontramos espacios"
              description="Prueba otra combinacion de filtros o abre la busqueda a toda Montevideo."
              action={<Button onClick={clearFilters}>Limpiar filtros</Button>}
            />
          ) : (
            <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
              {sortedResults.map((space) => (
                <SpaceCard key={space.id} space={space} horizontal />
              ))}
            </div>
          )}
        </section>
      </div>
    </PageContainer>
  );
}

function Metric({ icon, label, value }) {
  return (
    <div className="glass-shell rounded-[28px] px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#171616] text-[#f7f1e8] shadow-[0_18px_30px_-22px_rgba(23,22,22,0.9)]">
          {createElement(icon, { size: 16 })}
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-[#171616]/35">{label}</p>
          <p className="mt-1 text-sm font-semibold text-[#171616]">{value}</p>
        </div>
      </div>
    </div>
  );
}

