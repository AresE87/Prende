// src/components/MapSearch.tsx
// Mapa de búsqueda con pines de precio y sidebar sincronizado
// Centrado en Montevideo, Uruguay

import { useEffect, useRef, useState, useCallback } from "react";
import { loadGoogleMaps, createSearchMap, createSpaceMarker, type SpaceMarkerData } from "../../lib/maps";
import { searchNearbySpaces, type NearbySpace } from "../../lib/supabase";
import { getTransformedImageUrl } from "../../lib/storage";

interface MapSearchProps {
  initialLat?:   number;
  initialLng?:   number;
  onSpaceSelect?: (spaceId: string) => void;
}

const MONTEVIDEO = { lat: -34.9011, lng: -56.1645 };

export default function MapSearch({
  initialLat   = MONTEVIDEO.lat,
  initialLng   = MONTEVIDEO.lng,
  onSpaceSelect,
}: MapSearchProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef          = useRef<google.maps.Map | null>(null);
  const markersRef      = useRef<google.maps.Marker[]>([]);
  const searchBoxRef    = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const [spaces,         setSpaces]         = useState<NearbySpace[]>([]);
  const [selectedSpace,  setSelectedSpace]  = useState<string | null>(null);
  const [loading,        setLoading]        = useState(true);
  const [mapsLoaded,     setMapsLoaded]     = useState(false);
  const [filters,        setFilters]        = useState({
    minCapacity: 1,
    maxPrice:    null as number | null,
    date:        "",
  });

  // ── Cargar Google Maps ─────────────────────────────────────
  useEffect(() => {
    loadGoogleMaps()
      .then(() => setMapsLoaded(true))
      .catch(err => console.error("Error cargando Maps:", err));
  }, []);

  // ── Inicializar mapa ───────────────────────────────────────
  useEffect(() => {
    if (!mapsLoaded || !mapContainerRef.current || mapRef.current) return;

    mapRef.current = createSearchMap(
      mapContainerRef.current,
      [],
      handleMarkerClick
    );

    // Escuchar cambios de bounds para búsqueda dinámica
    mapRef.current.addListener("idle", () => {
      const center = mapRef.current!.getCenter();
      if (center) {
        fetchSpaces(center.lat(), center.lng());
      }
    });

    // Autocomplete para la barra de búsqueda
    if (searchBoxRef.current) {
      autocompleteRef.current = new google.maps.places.Autocomplete(
        searchBoxRef.current,
        {
          componentRestrictions: { country: "uy" },
          fields: ["geometry", "name"],
        }
      );

      autocompleteRef.current.addListener("place_changed", () => {
        const place = autocompleteRef.current!.getPlace();
        if (place.geometry?.location) {
          mapRef.current!.setCenter(place.geometry.location);
          mapRef.current!.setZoom(14);
        }
      });
    }
  }, [mapsLoaded]);

  // ── Fetch de espacios ──────────────────────────────────────
  const fetchSpaces = useCallback(async (lat: number, lng: number) => {
    setLoading(true);
    try {
      const results = await searchNearbySpaces({
        lat,
        lng,
        radiusM:     5000,
        minCapacity: filters.minCapacity,
        maxPrice:    filters.maxPrice ?? undefined,
        checkDate:   filters.date || undefined,
      });
      setSpaces(results);

      // Limpiar marcadores anteriores
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];

      // Crear nuevos marcadores
      if (mapRef.current) {
        results.forEach(space => {
          const marker = createSpaceMarker(
            mapRef.current!,
            {
              id:           space.id,
              lat:          space.lat,
              lng:          space.lng,
              title:        space.title,
              pricePerHour: space.price_per_hour,
            },
            handleMarkerClick
          );
          markersRef.current.push(marker);
        });
      }
    } catch (err) {
      console.error("Error buscando espacios:", err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch inicial
  useEffect(() => {
    if (mapsLoaded) {
      fetchSpaces(initialLat, initialLng);
    }
  }, [mapsLoaded, initialLat, initialLng, filters]);

  const handleMarkerClick = useCallback((spaceId: string) => {
    setSelectedSpace(spaceId);
    // Scroll en sidebar al espacio seleccionado
    document.getElementById(`space-card-${spaceId}`)?.scrollIntoView({
      behavior: "smooth",
      block:    "nearest",
    });
  }, []);

  const handleSpaceCardClick = useCallback((space: NearbySpace) => {
    setSelectedSpace(space.id);
    mapRef.current?.panTo({ lat: space.lat, lng: space.lng });
    mapRef.current?.setZoom(15);
    onSpaceSelect?.(space.id);
  }, [onSpaceSelect]);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", background: "#0D0A07" }}>

      {/* ── SIDEBAR ──────────────────────────────────────── */}
      <div style={{
        width:     380,
        minWidth:  380,
        overflowY: "auto",
        borderRight: "1px solid rgba(255,255,255,0.07)",
        display:   "flex",
        flexDirection: "column",
      }}>
        {/* Search bar */}
        <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <input
            ref={searchBoxRef}
            type="text"
            placeholder="Buscar barrio o dirección..."
            style={{
              width:        "100%",
              background:   "rgba(255,255,255,0.06)",
              border:       "1px solid rgba(255,255,255,0.12)",
              borderRadius: 10,
              padding:      "10px 14px",
              color:        "#F5ECD7",
              fontSize:     14,
              outline:      "none",
              boxSizing:    "border-box",
            }}
          />
        </div>

        {/* Filtros rápidos */}
        <div style={{ padding: "12px 20px", display: "flex", gap: 8, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <input
            type="date"
            value={filters.date}
            onChange={e => setFilters(prev => ({ ...prev, date: e.target.value }))}
            style={{
              flex:       1,
              background: "rgba(255,255,255,0.06)",
              border:     "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding:    "8px 10px",
              color:      "#F5ECD7",
              fontSize:   13,
              outline:    "none",
            }}
          />
          <select
            value={filters.minCapacity}
            onChange={e => setFilters(prev => ({ ...prev, minCapacity: parseInt(e.target.value) }))}
            style={{
              background:   "rgba(255,255,255,0.06)",
              border:       "1px solid rgba(255,255,255,0.12)",
              borderRadius: 8,
              padding:      "8px 10px",
              color:        "#F5ECD7",
              fontSize:     13,
              outline:      "none",
            }}
          >
            {[1, 5, 10, 15, 20, 30].map(n => (
              <option key={n} value={n} style={{ background: "#1a1410" }}>
                {n === 1 ? "Cualquier tamaño" : `${n}+ personas`}
              </option>
            ))}
          </select>
        </div>

        {/* Contador de resultados */}
        <div style={{ padding: "10px 20px", fontSize: 12, color: "#666" }}>
          {loading ? "Buscando..." : `${spaces.length} espacios encontrados`}
        </div>

        {/* Lista de espacios */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {spaces.map(space => (
            <SpaceCard
              key={space.id}
              space={space}
              isSelected={selectedSpace === space.id}
              onClick={() => handleSpaceCardClick(space)}
            />
          ))}

          {!loading && spaces.length === 0 && (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#555" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>🔍</div>
              <p style={{ fontSize: 14, margin: 0 }}>No hay espacios disponibles en esta zona.</p>
              <p style={{ fontSize: 12, margin: "8px 0 0", color: "#444" }}>
                Probá moviendo el mapa o cambiando los filtros.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── MAPA ─────────────────────────────────────────── */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

        {!mapsLoaded && (
          <div style={{
            position:  "absolute", inset: 0,
            background: "#0D0A07",
            display:   "flex", alignItems: "center", justifyContent: "center",
            flexDirection: "column", gap: 16,
          }}>
            <div style={{ fontSize: 32 }}>🔥</div>
            <p style={{ color: "#666", fontSize: 14 }}>Cargando mapa...</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SPACE CARD ──────────────────────────────────────────────

interface SpaceCardProps {
  space:      NearbySpace;
  isSelected: boolean;
  onClick:    () => void;
}

function SpaceCard({ space, isSelected, onClick }: SpaceCardProps) {
  const firstPhoto = space.photos[0]
    ? getTransformedImageUrl(space.photos[0], "thumbnail")
    : null;

  return (
    <div
      id={`space-card-${space.id}`}
      onClick={onClick}
      style={{
        padding:    "14px 20px",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        cursor:     "pointer",
        background: isSelected ? "rgba(255,120,30,0.08)" : "transparent",
        borderLeft: `3px solid ${isSelected ? "#FF7820" : "transparent"}`,
        transition: "all 0.15s ease",
        display:    "flex",
        gap:        14,
      }}
      onMouseEnter={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.03)";
      }}
      onMouseLeave={e => {
        if (!isSelected) (e.currentTarget as HTMLDivElement).style.background = "transparent";
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width:        80,
        height:       60,
        borderRadius: 8,
        overflow:     "hidden",
        flexShrink:   0,
        background:   "rgba(255,255,255,0.05)",
      }}>
        {firstPhoto ? (
          <img
            src={firstPhoto}
            alt={space.title}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>
            🔥
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#F5ECD7", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {space.title}
        </div>
        <div style={{ fontSize: 11, color: "#666", marginBottom: 6 }}>
          {space.neighborhood ?? "Montevideo"} · {Math.round(space.distance_m)}m
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "#FF7820" }}>
            $U {space.price_per_hour.toLocaleString("es-UY")}/hr
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontSize: 11, color: "#FFB347" }}>★</span>
            <span style={{ fontSize: 11, color: "#888" }}>
              {space.rating_count > 0
                ? `${space.rating_avg.toFixed(1)} (${space.rating_count})`
                : "Nuevo"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
