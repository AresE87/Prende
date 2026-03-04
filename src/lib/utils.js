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
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800",
    ],
    host: { name: "Marcelo", avatar: "https://i.pravatar.cc/80?img=12", superhost: true },
    amenities: ["parrilla_carbon", "techado", "estacionamiento", "mesa_grande", "vajilla", "bano"],
    description: "Quincho amplio con parrilla de leña y carbón, perfecta para asados familiares o con amigos. Tiene capacidad para hasta 20 personas cómodamente sentadas. Incluye zona de estar con sillones, TV para ver el partido y una barra equipada. A metros del Parque Rodó.",
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
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
    ],
    host: { name: "Valentina", avatar: "https://i.pravatar.cc/80?img=47", superhost: false },
    amenities: ["parrilla_gas", "jardin", "wifi", "heladera", "bano"],
    description: "Patio soleado con parrilla de gas de última generación. Ideal para almuerzos de fin de semana. El jardín tiene árboles que dan sombra natural y un espacio para niños.",
    rules: ["Máximo 12 personas", "Sin mascotas"],
    address: "Malvín, Montevideo",
  },
  {
    id: "3",
    title: "Terraza premium con horno de barro",
    zona: "Carrasco",
    price: 2400,
    rating: 5.0,
    reviews: 14,
    capacity: 30,
    images: [
      "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=800",
      "https://images.unsplash.com/photo-1529543544282-ea669407fca3?w=800",
      "https://images.unsplash.com/photo-1600607687644-aac4c3eac7f4?w=800",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    ],
    host: { name: "Federico", avatar: "https://i.pravatar.cc/80?img=33", superhost: true },
    amenities: ["horno_barro", "parrilla_carbon", "piscina", "techado", "musica", "vajilla", "estacionamiento", "bano"],
    description: "Espacio premium en Carrasco con terraza, parrilla de leña, horno de barro y piscina. Perfecto para eventos y celebraciones especiales. Vista panorámica con iluminación ambiental para eventos nocturnos.",
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
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
    ],
    host: { name: "Natalia", avatar: "https://i.pravatar.cc/80?img=56", superhost: false },
    amenities: ["parrilla_carbon", "mesa_grande", "bano", "wifi"],
    description: "Quincho con onda barrial, ideal para cumpleaños y reuniones informales. A pasos del Parque Rodó. Ambiente rústico con decoración vintage.",
    rules: ["Música hasta medianoche", "Sin menores sin adultos"],
    address: "Cordón, Montevideo",
  },
  {
    id: "5",
    title: "Parrilla al aire libre con piscina",
    zona: "Punta Carretas",
    price: 1800,
    rating: 4.8,
    reviews: 27,
    capacity: 25,
    images: [
      "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800",
      "https://images.unsplash.com/photo-1600210492493-0946911123ea?w=800",
      "https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=800",
    ],
    host: { name: "Santiago", avatar: "https://i.pravatar.cc/80?img=60", superhost: true },
    amenities: ["parrilla_carbon", "piscina", "techado", "musica", "estacionamiento", "jardin", "vajilla", "bano"],
    description: "Increíble espacio al aire libre con parrilla de carbón profesional y piscina climatizada. Jardín con césped natural, iluminación LED y sistema de sonido Bluetooth integrado. Ideal para eventos de verano.",
    rules: ["No pirotecnia", "Música hasta las 23hs", "Cuidar el jardín"],
    address: "Punta Carretas, Montevideo",
  },
  {
    id: "6",
    title: "Quincho rústico estilo campo",
    zona: "Prado",
    price: 700,
    rating: 4.6,
    reviews: 31,
    capacity: 18,
    images: [
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800",
      "https://images.unsplash.com/photo-1544025162-d76694265947?w=800",
      "https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?w=800",
    ],
    host: { name: "Roberto", avatar: "https://i.pravatar.cc/80?img=68", superhost: false },
    amenities: ["parrilla_carbon", "techado", "mesa_grande", "heladera", "estacionamiento", "quincho"],
    description: "Quincho con estilo campestre a minutos del centro. Parrilla de leña con espacio para leñero. Mesa rústica de madera para 18 comensales. Ambiente cálido y acogedor para asados tradicionales.",
    rules: ["Traer propia leña o carbón", "Dejar el espacio ordenado", "Estacionamiento limitado a 4 vehículos"],
    address: "Prado, Montevideo",
  },
  {
    id: "7",
    title: "Rooftop con parrilla panorámica",
    zona: "Buceo",
    price: 1500,
    rating: 4.9,
    reviews: 19,
    capacity: 16,
    images: [
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800",
      "https://images.unsplash.com/photo-1600585154363-67eb9e2e2099?w=800",
      "https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=800",
    ],
    host: { name: "Luciana", avatar: "https://i.pravatar.cc/80?img=45", superhost: true },
    amenities: ["parrilla_gas", "techado", "wifi", "vajilla", "heladera", "musica", "bano"],
    description: "Terraza en el último piso con vista al río y a la rambla del Buceo. Parrilla a gas premium, barra con banquetas altas y zona lounge con pufs. Atardeceres espectaculares. Ideal para after office o cenas de pareja.",
    rules: ["Máximo 16 personas", "No subir muebles pesados", "Respetar horarios del edificio"],
    address: "Buceo, Montevideo",
  },
  {
    id: "8",
    title: "Casa quinta con doble parrillero",
    zona: "Sayago",
    price: 1100,
    rating: 4.4,
    reviews: 15,
    capacity: 40,
    images: [
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800",
      "https://images.unsplash.com/photo-1600585153490-76fb20a32601?w=800",
    ],
    host: { name: "Carlos", avatar: "https://i.pravatar.cc/80?img=17", superhost: false },
    amenities: ["parrilla_carbon", "horno_barro", "jardin", "estacionamiento", "mesa_grande", "piscina", "bano", "quincho"],
    description: "Casa quinta con dos parrilleros (uno techado, uno al aire libre), horno de barro, pileta y amplio jardín. Perfecta para eventos grandes, cumpleaños de 15 y reuniones empresariales. Estacionamiento para 10 autos.",
    rules: ["Confirmar cantidad exacta de invitados", "Depósito de $U 3000 reembolsable", "Se permite DJ hasta las 2am"],
    address: "Sayago, Montevideo",
  },
  {
    id: "9",
    title: "Terraza íntima en Ciudad Vieja",
    zona: "Ciudad Vieja",
    price: 950,
    rating: 4.7,
    reviews: 11,
    capacity: 8,
    images: [
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800",
    ],
    host: { name: "Ana", avatar: "https://i.pravatar.cc/80?img=25", superhost: false },
    amenities: ["parrilla_gas", "techado", "wifi", "vajilla", "heladera", "bano"],
    description: "Terracita con encanto en plena Ciudad Vieja. Parrilla compacta a gas, perfecta para cenas íntimas. Vista a los techos coloniales. Decoración bohemia con plantas y luces cálidas.",
    rules: ["Espacio para máximo 8 personas", "No se permite fumar adentro", "Retirar basura al finalizar"],
    address: "Ciudad Vieja, Montevideo",
  },
  {
    id: "10",
    title: "Quincho all-inclusive Parque Rodó",
    zona: "Parque Rodó",
    price: 1400,
    rating: 4.8,
    reviews: 33,
    capacity: 22,
    images: [
      "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=800",
      "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=800",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800",
    ],
    host: { name: "Diego", avatar: "https://i.pravatar.cc/80?img=52", superhost: true },
    amenities: ["parrilla_carbon", "techado", "vajilla", "heladera", "musica", "wifi", "mesa_grande", "bano", "quincho"],
    description: "Quincho completamente equipado: vajilla para 22, heladera industrial, equipo de música con Bluetooth, TV 55\" para partidos. Parrilla profesional con campana extractora. Todo lo que necesitás, solo traé la carne.",
    rules: ["Limpieza incluida en el precio", "Check-in a la hora pactada", "No se permite fumar dentro del quincho"],
    address: "Parque Rodó, Montevideo",
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
    startTime: "2026-03-15T14:00:00",
    endTime: "2026-03-15T20:00:00",
    persons: 12,
    total: 7200,
    status: "confirmada",
    hostName: "Marcelo",
  },
  {
    id: "b4",
    spaceId: "5",
    spaceTitle: "Parrilla al aire libre con piscina",
    spaceImage: "https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=400",
    zona: "Punta Carretas",
    startTime: "2026-03-22T12:00:00",
    endTime: "2026-03-22T18:00:00",
    persons: 16,
    total: 10800,
    status: "pendiente",
    hostName: "Santiago",
  },
  {
    id: "b2",
    spaceId: "3",
    spaceTitle: "Terraza premium con horno de barro",
    spaceImage: "https://images.unsplash.com/photo-1559329007-40df8a9345d8?w=400",
    zona: "Carrasco",
    startTime: "2026-02-20T12:00:00",
    endTime: "2026-02-20T18:00:00",
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
    startTime: "2026-01-10T16:00:00",
    endTime: "2026-01-10T22:00:00",
    persons: 8,
    total: 5400,
    status: "completada",
    hostName: "Valentina",
    reviewed: true,
  },
  {
    id: "b5",
    spaceId: "7",
    spaceTitle: "Rooftop con parrilla panorámica",
    spaceImage: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=400",
    zona: "Buceo",
    startTime: "2025-12-31T20:00:00",
    endTime: "2026-01-01T02:00:00",
    persons: 14,
    total: 9000,
    status: "completada",
    hostName: "Luciana",
    reviewed: true,
  },
  {
    id: "b6",
    spaceId: "10",
    spaceTitle: "Quincho all-inclusive Parque Rodó",
    spaceImage: "https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=400",
    zona: "Parque Rodó",
    startTime: "2025-11-05T13:00:00",
    endTime: "2025-11-05T19:00:00",
    persons: 18,
    total: 8400,
    status: "cancelada",
    hostName: "Diego",
  },
];
