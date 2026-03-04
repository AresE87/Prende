/** Formatea precio en UYU con separadores locales */
export function formatUYU(n) {
  return `$U ${Math.round(n).toLocaleString("es-UY")}`;
}

/** Formatea fecha ISO a "Sab 12 Ene" */
export function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-UY", {
    weekday: "short", day: "numeric", month: "short",
  });
}

/** Formatea hora "14:00" */
export function formatTime(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleTimeString("es-UY", {
    hour: "2-digit", minute: "2-digit",
  });
}

/** Calcula horas entre dos fechas ISO */
export function calcHours(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 3_600_000);
}

/** Genera array de estrellas 1-5 */
export function starArray(rating) {
  return Array.from({ length: 5 }, (_, i) => i < Math.round(rating));
}

/** cn: merge de clases (Tailwind safe) */
export function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

/** Zonas de Montevideo disponibles */
export const ZONAS = [
  "Pocitos", "Punta Carretas", "Buceo", "Malvín", "Carrasco",
  "Cordón", "Parque Rodó", "Centro", "Tres Cruces", "Sayago",
  "Prado", "Aguada", "Ciudad Vieja",
];

/** Amenities disponibles con iconos */
export const AMENITIES = [
  { id: "parrilla_carbon", label: "Parrilla carbón", icon: "🔥" },
  { id: "parrilla_gas",    label: "Parrilla gas",    icon: "🟦" },
  { id: "techado",         label: "Techado",         icon: "🏠" },
  { id: "piscina",         label: "Piscina",         icon: "🏊" },
  { id: "estacionamiento", label: "Estacionamiento", icon: "🚗" },
  { id: "mesa_grande",     label: "Mesa grande",     icon: "🪑" },
  { id: "heladera",        label: "Heladera",        icon: "❄️" },
  { id: "vajilla",         label: "Vajilla incluida",icon: "🍽️" },
  { id: "musica",          label: "Equipo de música",icon: "🎵" },
  { id: "wifi",            label: "WiFi",            icon: "📶" },
  { id: "bano",            label: "Baño privado",    icon: "🚿" },
  { id: "jardin",          label: "Jardín",          icon: "🌿" },
  { id: "quincho",         label: "Quincho",         icon: "🏡" },
  { id: "horno_barro",     label: "Horno de barro",  icon: "🫙" },
];

/** Mock de espacios — reemplazar con API */
export const MOCK_SPACES = [
  {
    id: "1",
    title: "Quincho con parrilla en Pocitos",
    zona: "Pocitos",
    price: 1200,
    rating: 4.9,
    reviews: 38,
    capacity: 20,
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800",
      "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800",
      "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800",
    ],
    host: { name: "Marcelo", avatar: "https://i.pravatar.cc/80?img=12", superhost: true },
    amenities: ["parrilla_carbon", "techado", "estacionamiento", "mesa_grande", "vajilla", "bano"],
    description: "Quincho amplio con parrilla de leña y carbón, perfecta para asados familiares o con amigos. Tiene capacidad para hasta 20 personas cómodamente sentadas. A metros del Parque Rodó.",
    rules: ["No fumar en interiores", "Respetar a los vecinos después de las 22hs", "Dejar el espacio limpio"],
    address: "Pocitos, Montevideo",
  },
  {
    id: "2",
    title: "Patio con parrilla a gas - Malvín",
    zona: "Malvín",
    price: 900,
    rating: 4.7,
    reviews: 22,
    capacity: 12,
    images: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
      "https://images.unsplash.com/photo-1567899378494-47b22a2ae96a?w=800",
    ],
    host: { name: "Valentina", avatar: "https://i.pravatar.cc/80?img=47", superhost: false },
    amenities: ["parrilla_gas", "jardin", "wifi", "heladera", "bano"],
    description: "Patio soleado con parrilla de gas de última generación. Ideal para almuerzos de fin de semana. El jardín tiene árboles que dan sombra natural.",
    rules: ["Máximo 12 personas", "Sin mascotas"],
    address: "Malvín, Montevideo",
  },
  {
    id: "3",
    title: "Terraza con horno de barro - Carrasco",
    zona: "Carrasco",
    price: 2400,
    rating: 5.0,
    reviews: 14,
    capacity: 30,
    images: [
      "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800",
      "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800",
    ],
    host: { name: "Federico", avatar: "https://i.pravatar.cc/80?img=33", superhost: true },
    amenities: ["horno_barro", "parrilla_carbon", "piscina", "techado", "musica", "vajilla", "estacionamiento", "bano"],
    description: "Espacio premium en Carrasco con terraza, parrilla de leña, horno de barro y piscina. Perfecto para eventos y celebraciones especiales.",
    rules: ["Requiere depósito de garantía", "Catering externo permitido", "Decoración previa coordinar"],
    address: "Carrasco, Montevideo",
  },
  {
    id: "4",
    title: "Quincho barrio sur con vista",
    zona: "Cordón",
    price: 800,
    rating: 4.5,
    reviews: 9,
    capacity: 15,
    images: [
      "https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800",
    ],
    host: { name: "Natalia", avatar: "https://i.pravatar.cc/80?img=56", superhost: false },
    amenities: ["parrilla_carbon", "mesa_grande", "bano", "wifi"],
    description: "Quincho con onda barrial, ideal para cumpleaños y reuniones informales. A pasos del Parque Rodó.",
    rules: ["Música hasta medianoche", "Sin menores sin adultos"],
    address: "Cordón, Montevideo",
  },
];

/** Mock de reservas */
export const MOCK_BOOKINGS = [
  {
    id: "b1",
    spaceId: "1",
    spaceTitle: "Quincho con parrilla en Pocitos",
    spaceImage: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=400",
    zona: "Pocitos",
    startTime: "2025-03-15T14:00:00",
    endTime: "2025-03-15T20:00:00",
    persons: 12,
    total: 7200,
    status: "confirmada",
    hostName: "Marcelo",
  },
  {
    id: "b2",
    spaceId: "3",
    spaceTitle: "Terraza con horno de barro - Carrasco",
    spaceImage: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400",
    zona: "Carrasco",
    startTime: "2025-02-20T12:00:00",
    endTime: "2025-02-20T18:00:00",
    persons: 20,
    total: 14400,
    status: "completada",
    hostName: "Federico",
    reviewed: false,
  },
  {
    id: "b3",
    spaceId: "2",
    spaceTitle: "Patio con parrilla a gas - Malvín",
    spaceImage: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
    zona: "Malvín",
    startTime: "2025-01-10T16:00:00",
    endTime: "2025-01-10T22:00:00",
    persons: 8,
    total: 5400,
    status: "completada",
    hostName: "Valentina",
    reviewed: true,
  },
];
