import {
  Camera,
  DollarSign,
  LayoutGrid,
  MapPin,
  ShieldCheck,
  Sparkles,
  Tags,
} from "lucide-react";

export const STEP_ITEMS = [
  {
    id: "identity",
    title: "Producto",
    subtitle: "Propuesta, tipo y posicionamiento",
    description: "Define con claridad que vendes, para quien y por que deberian elegirte.",
    icon: LayoutGrid,
    fields: ["title", "spaceType", "hook", "description", "businessGoal"],
  },
  {
    id: "location",
    title: "Ubicacion",
    subtitle: "Acceso, zona y capacidad",
    description: "Ayuda al cliente a entender rapido donde esta el espacio y para cuantos funciona bien.",
    icon: MapPin,
    fields: ["zona", "address", "referencePoint", "accessType", "seatedCapacity", "maxPersons", "arrivalNotes"],
  },
  {
    id: "segmentation",
    title: "Segmentacion",
    subtitle: "Publico, ocasiones y momentos",
    description: "Etiqueta tu espacio para captar mejor la demanda correcta.",
    icon: Tags,
    fields: [],
  },
  {
    id: "experience",
    title: "Experiencia",
    subtitle: "Amenities, extras y reglas",
    description: "Construye una ficha mas util para la venta y mas clara para la operacion.",
    icon: Sparkles,
    fields: [],
  },
  {
    id: "media",
    title: "Contenido",
    subtitle: "Fotos y diferenciales",
    description: "Muestra lo mejor del espacio y resume la propuesta comercial en segundos.",
    icon: Camera,
    fields: ["coverNote"],
  },
  {
    id: "pricing",
    title: "Precio",
    subtitle: "Ticket, politicas y operacion",
    description: "Ajusta valor, condiciones y expectativas para vender con menos friccion.",
    icon: DollarSign,
    fields: ["price", "weekendPrice", "cleaningFee", "deposit", "minHours", "advanceNotice", "cancellationPolicy", "targetSegment"],
  },
  {
    id: "review",
    title: "Revision final",
    subtitle: "Checklist antes de publicar",
    description: "Revisa tu producto como si fueras un cliente listo para reservar.",
    icon: ShieldCheck,
    fields: [],
  },
];

export const SPACE_TYPES = [
  { value: "quincho_urbano", label: "Quincho urbano" },
  { value: "barbacoa_techada", label: "Barbacoa techada" },
  { value: "terraza_con_parrilla", label: "Terraza con parrilla" },
  { value: "patio_privado", label: "Patio privado" },
  { value: "casa_quinta", label: "Casa quinta" },
  { value: "rooftop", label: "Rooftop" },
  { value: "salon_con_parrilla", label: "Salon con parrilla" },
  { value: "espacio_campestre", label: "Espacio campestre" },
];

export const BUSINESS_GOALS = [
  { value: "llenar_fechas_libres", label: "Llenar fechas libres" },
  { value: "captar_eventos_sociales", label: "Captar eventos sociales" },
  { value: "captar_empresas", label: "Captar empresas" },
  { value: "subir_ticket_promedio", label: "Subir ticket promedio" },
];

export const ACCESS_TYPES = [
  { value: "entrada_independiente", label: "Entrada independiente" },
  { value: "dentro_de_vivienda", label: "Dentro de vivienda" },
  { value: "edificio_con_recepcion", label: "Edificio con recepcion" },
  { value: "casa_quinta", label: "Casa quinta o predio" },
  { value: "azotea_rooftop", label: "Azotea o rooftop" },
];

export const EVENT_TYPES = [
  "Cumpleanos",
  "Reuniones familiares",
  "After office",
  "Team building",
  "Despedidas",
  "Cenas privadas",
  "Juntadas con amigos",
  "Eventos corporativos",
  "Producciones",
  "Celebraciones especiales",
];

export const AUDIENCE_TYPES = [
  "Familias",
  "Grupos de amigos",
  "Empresas",
  "Parejas",
  "Turistas",
  "Comunidades",
  "Equipos de trabajo",
  "Eventos chicos premium",
];

export const AMBIENCE_OPTIONS = [
  "Familiar",
  "Premium",
  "Relajado",
  "Urbano",
  "Natural",
  "Nocturno",
  "Kids friendly",
  "Corporativo",
  "Rustico",
  "Moderno",
];

export const DAYPART_OPTIONS = [
  "Almuerzo",
  "Tarde",
  "Sunset",
  "Cena",
  "Noche",
  "Dias de semana",
  "Fines de semana",
  "Ferias y fechas especiales",
];

export const EXTRA_SERVICES = [
  "Carbon o lena a demanda",
  "Limpieza incluida",
  "Decoracion previa",
  "Catering aliado",
  "Bartender",
  "DJ o sonido",
  "Mesa dulce",
  "Check-in asistido",
  "Kit parrillero",
  "Helado o freezer extra",
];

export const LOGISTICS_OPTIONS = [
  "Estacionamiento propio",
  "Ingreso autonomo",
  "Acceso sin escaleras",
  "Acepta catering externo",
  "Permite decoracion",
  "Musica permitida",
  "Pet friendly",
  "Acceso para ninos",
  "Check-in flexible",
  "Baile o evento nocturno",
];

export const ADVANCE_NOTICE_OPTIONS = [
  { value: "sin_aviso", label: "Reserva inmediata" },
  { value: "12h", label: "12 horas antes" },
  { value: "24h", label: "24 horas antes" },
  { value: "48h", label: "48 horas antes" },
  { value: "72h", label: "72 horas antes" },
];

export const CANCELLATION_OPTIONS = [
  { value: "flexible", label: "Flexible" },
  { value: "moderada", label: "Moderada" },
  { value: "estricta", label: "Estricta" },
  { value: "segun_evento", label: "Segun evento" },
];

export const TARGET_SEGMENTS = [
  { value: "economico", label: "Economico" },
  { value: "equilibrado", label: "Equilibrado" },
  { value: "premium", label: "Premium" },
  { value: "corporativo", label: "Corporativo" },
  { value: "grupos_grandes", label: "Grupos grandes" },
];

export const DEFAULT_RULES = [
  "No fumar en interiores",
  "Cuidar parrilla y mobiliario",
];

export const DEFAULT_HIGHLIGHTS = ["", "", ""];

export function getOptionLabel(options, value, fallback = "") {
  const match = options.find((option) => (option.value ?? option) === value);
  return match ? match.label ?? match.value ?? match : fallback;
}

export function validateCurrentStep(stepId, state) {
  const values = state.values ?? {};

  if (stepId === "location" && Number(values.maxPersons) < Number(values.seatedCapacity)) {
    return { ok: false, message: "La capacidad maxima no puede ser menor que la cantidad sentados." };
  }

  if (stepId === "segmentation") {
    if (!state.eventTypes.length || !state.audiences.length || !state.ambiences.length || !state.dayparts.length) {
      return { ok: false, message: "Completa al menos una opcion en ocasiones, publico ideal, ambiente y momentos de uso." };
    }
  }

  if (stepId === "experience") {
    if (state.amenities.length < 3) {
      return { ok: false, message: "Marca al menos 3 amenities para que la ficha sea competitiva." };
    }
    if (state.rules.filter(Boolean).length < 2) {
      return { ok: false, message: "Agrega por lo menos 2 reglas para dejar claras las condiciones del espacio." };
    }
  }

  if (stepId === "media") {
    if (state.photos.length < 3) {
      return { ok: false, message: "Sube al menos 3 fotos para mostrar bien el espacio." };
    }
    if (state.highlights.filter(Boolean).length < 2) {
      return { ok: false, message: "Completa al menos 2 diferenciales para fortalecer la propuesta." };
    }
  }

  if (stepId === "pricing" && Number(values.weekendPrice) < Number(values.price)) {
    return { ok: false, message: "El precio de fin de semana no deberia ser menor que el precio base." };
  }

  if (stepId === "review") {
    const checklist = [
      Boolean(values.title && values.spaceType && values.hook && values.description),
      Boolean(values.zona && values.address && values.referencePoint && values.accessType),
      state.eventTypes.length > 0 && state.audiences.length > 0 && state.ambiences.length > 0 && state.dayparts.length > 0,
      state.amenities.length >= 3 && state.rules.filter(Boolean).length >= 2,
      state.photos.length >= 3 && state.highlights.filter(Boolean).length >= 2,
      Boolean(Number(values.price) > 0 && Number(values.weekendPrice) >= Number(values.price) && Number(values.minHours) > 0),
    ];

    if (!checklist.every(Boolean)) {
      return { ok: false, message: "Todavia hay secciones incompletas. Revisa el menu lateral antes de publicar." };
    }
  }

  return { ok: true };
}

export function buildCommercialRead(values, state) {
  if (!values.title) {
    return "Completa la propuesta base para generar una lectura comercial mas precisa.";
  }

  const audience = state.audiences[0] ?? "clientes";
  const eventType = state.eventTypes[0] ?? "encuentros";
  const ambience = state.ambiences[0] ?? "versatil";
  const photoText = state.photos.length >= 3 ? "con respaldo visual suficiente" : "todavia con pocas fotos";
  const highlightText = state.highlights.filter(Boolean).length >= 2 ? "y una promesa facil de entender" : "pero aun puede resumir mejor sus diferenciales";

  return `${values.title} se presenta como una opcion ${ambience.toLowerCase()} para ${eventType.toLowerCase()} orientados a ${audience.toLowerCase()}, ${photoText} ${highlightText}.`;
}
