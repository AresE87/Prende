// src/lib/maps.ts
// Utilidades de Google Maps: loader, geocoding, Places autocomplete
//
// APIs necesarias habilitadas en console.cloud.google.com:
//   - Maps JavaScript API
//   - Places API
//   - Geocoding API

// ─── LOADER ──────────────────────────────────────────────────

let mapsPromise: Promise<void> | null = null;

/**
 * Carga el SDK de Google Maps una sola vez (singleton).
 * Llamar antes de usar cualquier funcionalidad de Maps.
 */
export function loadGoogleMaps(): Promise<void> {
  if (mapsPromise) return mapsPromise;

  mapsPromise = new Promise((resolve, reject) => {
    // Si ya está cargado
    if (window.google?.maps) {
      resolve();
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error("VITE_GOOGLE_MAPS_API_KEY no configurado"));
      return;
    }

    // Callback global que Maps llama cuando termina de cargar
    const callbackName = "__googleMapsCallback";
    (window as Record<string, unknown>)[callbackName] = () => {
      delete (window as Record<string, unknown>)[callbackName];
      resolve();
    };

    const script   = document.createElement("script");
    script.src     = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=${callbackName}&language=es&region=UY`;
    script.async   = true;
    script.defer   = true;
    script.onerror = () => reject(new Error("Error cargando Google Maps"));
    document.head.appendChild(script);
  });

  return mapsPromise;
}

// ─── GEOCODING ───────────────────────────────────────────────

export interface GeocodingResult {
  lat:          number;
  lng:          number;
  formattedAddress: string;
  neighborhood: string | null;
  city:         string | null;
}

/**
 * Convierte una dirección de texto a coordenadas.
 * Restringido a Uruguay (region: UY).
 * Siempre guardar el resultado en DB — no geocodificar en runtime.
 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  await loadGoogleMaps();

  return new Promise((resolve) => {
    const geocoder = new google.maps.Geocoder();
    geocoder.geocode(
      {
        address:              `${address}, Uruguay`,
        componentRestrictions: { country: "UY" },
      },
      (results, status) => {
        if (status !== "OK" || !results?.[0]) {
          console.warn("Geocoding falló:", status, address);
          resolve(null);
          return;
        }

        const result    = results[0];
        const location  = result.geometry.location;
        const components = result.address_components;

        const getComponent = (type: string) =>
          components.find(c => c.types.includes(type))?.long_name ?? null;

        resolve({
          lat:              location.lat(),
          lng:              location.lng(),
          formattedAddress: result.formatted_address,
          neighborhood:     getComponent("sublocality") || getComponent("neighborhood"),
          city:             getComponent("locality"),
        });
      }
    );
  });
}

// ─── PLACES AUTOCOMPLETE ─────────────────────────────────────

export interface PlacePrediction {
  placeId:      string;
  description:  string;
  mainText:     string;
  secondaryText: string;
}

/**
 * Hook-friendly: retorna predicciones de Places para un input de dirección.
 * Restringido a Uruguay.
 */
export function createAddressAutocomplete(
  inputElement: HTMLInputElement,
  onSelect: (result: GeocodingResult) => void
): google.maps.places.Autocomplete {
  const autocomplete = new google.maps.places.Autocomplete(inputElement, {
    componentRestrictions: { country: "uy" },
    fields: ["address_components", "formatted_address", "geometry"],
    types:  ["address"],
  });

  autocomplete.addListener("place_changed", () => {
    const place = autocomplete.getPlace();

    if (!place.geometry?.location) {
      console.warn("Place sin geometry:", place);
      return;
    }

    const components = place.address_components ?? [];
    const getComponent = (type: string) =>
      components.find(c => c.types.includes(type))?.long_name ?? null;

    onSelect({
      lat:              place.geometry.location.lat(),
      lng:              place.geometry.location.lng(),
      formattedAddress: place.formatted_address ?? inputElement.value,
      neighborhood:     getComponent("sublocality") || getComponent("neighborhood"),
      city:             getComponent("locality"),
    });
  });

  return autocomplete;
}

// ─── MAPA DE BÚSQUEDA ────────────────────────────────────────

export interface SpaceMarkerData {
  id:            string;
  lat:           number;
  lng:           number;
  title:         string;
  pricePerHour:  number;
}

/**
 * Crea el mapa de búsqueda con pines de espacios.
 * Centrado en Montevideo por defecto.
 */
export function createSearchMap(
  container: HTMLElement,
  spaces:    SpaceMarkerData[],
  onMarkerClick: (spaceId: string) => void
): google.maps.Map {
  const MONTEVIDEO = { lat: -34.9011, lng: -56.1645 };

  const map = new google.maps.Map(container, {
    center:    MONTEVIDEO,
    zoom:      13,
    mapTypeId: "roadmap",
    styles:    DARK_MAP_STYLE,
    disableDefaultUI:  false,
    zoomControl:       true,
    mapTypeControl:    false,
    streetViewControl: false,
    fullscreenControl: false,
  });

  // Crear marcadores
  spaces.forEach(space => {
    createSpaceMarker(map, space, onMarkerClick);
  });

  return map;
}

export function createSpaceMarker(
  map:           google.maps.Map,
  space:         SpaceMarkerData,
  onMarkerClick: (spaceId: string) => void
): google.maps.Marker {
  // Marcador customizado con el precio en UYU
  const priceLabel = `$U ${space.pricePerHour.toLocaleString("es-UY")}`;

  const marker = new google.maps.Marker({
    position: { lat: space.lat, lng: space.lng },
    map,
    title: space.title,
    label: {
      text:      priceLabel,
      color:     "#0D0A07",
      fontWeight: "700",
      fontSize:  "11px",
    },
    icon: {
      path:        google.maps.SymbolPath.CIRCLE,
      scale:       0,  // oculto — usamos el label como marcador visual
      strokeColor: "transparent",
    },
  });

  // Pill personalizado como overlay
  const overlay = new PriceOverlay(
    { lat: space.lat, lng: space.lng },
    priceLabel,
    map,
    space.id,
    onMarkerClick
  );

  return marker;
}

// ─── PRICE PILL OVERLAY ──────────────────────────────────────

class PriceOverlay extends google.maps.OverlayView {
  private div: HTMLDivElement | null = null;

  constructor(
    private position: google.maps.LatLngLiteral,
    private label:    string,
    map:              google.maps.Map,
    private spaceId:  string,
    private onClick:  (id: string) => void
  ) {
    super();
    this.setMap(map);
  }

  onAdd() {
    this.div = document.createElement("div");
    this.div.style.cssText = `
      position: absolute;
      background: #FF7820;
      color: #0D0A07;
      font-size: 12px;
      font-weight: 700;
      padding: 6px 10px;
      border-radius: 20px;
      cursor: pointer;
      white-space: nowrap;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transform: translate(-50%, -50%);
      transition: transform 0.15s ease, background 0.15s ease;
      user-select: none;
    `;
    this.div.textContent = this.label;

    this.div.addEventListener("mouseenter", () => {
      if (this.div) {
        this.div.style.transform = "translate(-50%, -50%) scale(1.1)";
        this.div.style.background = "#FF9340";
        this.div.style.zIndex = "100";
      }
    });
    this.div.addEventListener("mouseleave", () => {
      if (this.div) {
        this.div.style.transform = "translate(-50%, -50%)";
        this.div.style.background = "#FF7820";
        this.div.style.zIndex = "";
      }
    });
    this.div.addEventListener("click", () => this.onClick(this.spaceId));

    this.getPanes()!.overlayMouseTarget.appendChild(this.div);
  }

  draw() {
    if (!this.div) return;
    const overlayProjection = this.getProjection();
    const point = overlayProjection.fromLatLngToDivPixel(
      new google.maps.LatLng(this.position)
    );
    if (point) {
      this.div.style.left = `${point.x}px`;
      this.div.style.top  = `${point.y}px`;
    }
  }

  onRemove() {
    if (this.div?.parentNode) {
      this.div.parentNode.removeChild(this.div);
      this.div = null;
    }
  }
}

// ─── ESTILO DE MAPA OSCURO ───────────────────────────────────
// Adaptado a la identidad visual de Prende (dark, tonos cálidos)

const DARK_MAP_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: "geometry",         stylers: [{ color: "#1a1410" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#8a7a6a" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0D0A07" }] },
  { featureType: "road",             elementType: "geometry",       stylers: [{ color: "#2a2018" }] },
  { featureType: "road",             elementType: "geometry.stroke",stylers: [{ color: "#1a1410" }] },
  { featureType: "water",            elementType: "geometry",       stylers: [{ color: "#0a1020" }] },
  { featureType: "poi",              stylers: [{ visibility: "off" }] },
  { featureType: "transit",          stylers: [{ visibility: "off" }] },
];

// ─── COSTO ESTIMADO POR ESCENARIO ────────────────────────────
// Referencia para el equipo (no código ejecutable)
//
// Maps JS API: USD 7/1000 cargas
// Places Autocomplete: USD 2.83/1000 requests
// Geocoding: USD 5/1000 requests
//
// Escenario 50 espacios (500 búsquedas/mes):
//   Maps loads: 500 × $7/1000 = $3.50
//   Autocomplete: 50 onboardings × 5 queries = 250 × $2.83/1000 = $0.71
//   Geocoding: 50 espacios × $5/1000 = $0.25
//   TOTAL: ~$4.46/mes
//
// Escenario 200 espacios (2000 búsquedas/mes):
//   Maps loads: 2000 × $7/1000 = $14
//   TOTAL: ~$18/mes
//
// Google Maps tiene $200 USD/mes de crédito gratuito. Cubierto hasta ~28k cargas.
