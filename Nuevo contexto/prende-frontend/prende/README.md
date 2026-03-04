# Prende 🔥 — Frontend Product

Marketplace de alquiler por hora de espacios con parrilla · Montevideo, Uruguay

---

## Stack

| Herramienta | Versión | Uso |
|---|---|---|
| React | 19 | UI framework |
| Vite | 5 | Bundler + dev server |
| Tailwind CSS | v4 | Estilos |
| React Router | 6 | Routing |
| React Hook Form | 7 | Formularios |
| Zod | 3 | Validación de schemas |
| TanStack Query | 5 | Data fetching + caching |
| Lucide React | 0.363 | Iconos |

---

## Instalación

```bash
# Clonar e instalar
npm install

# Dev server en localhost:3000
npm run dev

# Build de producción
npm run build
```

---

## Estructura del proyecto

```
src/
├── App.jsx                     # Routing principal (React Router)
├── main.jsx                    # Entry point
├── index.css                   # Tailwind + globals
│
├── context/
│   └── AppContext.jsx           # Estado global (user, searchParams, cart)
│
├── lib/
│   └── utils.js                # Formatters, constantes, mock data
│
├── hooks/
│   └── index.js                # Todos los React Query hooks (conectar a API real)
│
├── components/
│   ├── shared/
│   │   ├── index.jsx            # Button, Input, Card, Modal, Avatar, Badge...
│   │   ├── Navbar.jsx           # Navegación top
│   │   └── LoadingScreen.jsx    # Suspense fallback
│   └── booking/
│       └── SpaceCard.jsx        # Tarjeta de espacio (grid + horizontal)
│
└── pages/
    ├── Home.jsx                 # Buscador + espacios destacados
    ├── SearchResults.jsx        # Lista con filtros
    ├── SpaceDetail.jsx          # Detalle + galería + calendario + booking widget
    ├── Checkout.jsx             # Pago + resumen
    ├── BookingConfirmation.jsx  # Confirmación post-pago
    ├── MyBookings.jsx           # Historial de reservas (guest)
    ├── ReviewFlow.jsx           # Flujo de reseña
    │
    ├── host/
    │   ├── HostOnboarding.jsx   # Wizard 4 pasos para publicar espacio
    │   ├── HostDashboard.jsx    # Dashboard con stats y próximas reservas
    │   ├── CalendarManagement.jsx # Bloquear/desbloquear fechas
    │   ├── BookingManagement.jsx  # Aprobar/rechazar reservas
    │   └── Earnings.jsx          # Historial de ganancias y liquidaciones
    │
    └── auth/
        ├── Login.jsx            # Login + Register en una pantalla
        └── Profile.jsx          # Editar perfil + verificación identidad
```

---

## Sistema de diseño

### Colores
```css
--color-carbon:    #1C1917  /* Primario */
--color-fondo:     #FAF7F2  /* Fondo claro */
--color-brasa:     #D4541B  /* Acento principal */
--color-terracota: #C2956B  /* Acento secundario */
--color-oliva:     #4A5E3A  /* Verde */
--color-texto:     #F5F0E8  /* Texto sobre oscuro */
```

### Tipografías
- `Plus Jakarta Sans` → títulos, UI elements
- `Cormorant Garamond` → énfasis emocional, quotes
- `Inter` → cuerpo, labels, UI general
- `JetBrains Mono` → precios, datos, métricas

### Componentes shared disponibles
```jsx
import {
  Button, Input, Textarea, Select,
  Badge, Avatar, Stars,
  Modal, Card, Divider, Skeleton,
  StepIndicator, AmenityTag,
  EmptyState, PageContainer, SectionTitle,
  StatusBadge
} from "./components/shared";
```

---

## Integración con backend

### 1. Variable de entorno
```env
# .env.local
VITE_API_URL=https://tu-api.prende.uy/api
```

### 2. Reemplazar mocks
En `src/lib/utils.js`, las constantes `MOCK_SPACES` y `MOCK_BOOKINGS` son datos de desarrollo.
Reemplazarlas conectando los hooks de `src/hooks/index.js` en los componentes.

### 3. Ejemplo: conectar useSpaces en SearchResults
```jsx
// ANTES (mock)
import { MOCK_SPACES } from "../lib/utils";
let results = MOCK_SPACES.filter(...);

// DESPUÉS (API real)
import { useSpaces } from "../hooks";
const { data: results = [], isLoading, error } = useSpaces({ zona, personas });
```

### 4. Auth
El contexto `AppContext` maneja el estado del usuario. Para persistir la sesión,
integrar con JWT + localStorage o cookies httpOnly según la arquitectura del backend.

---

## Rutas

| Ruta | Componente | Descripción |
|---|---|---|
| `/` | Home | Buscador principal |
| `/buscar` | SearchResults | Resultados con filtros |
| `/espacio/:id` | SpaceDetail | Detalle del espacio |
| `/reservar/:id` | Checkout | Pago |
| `/confirmacion/:bookingId` | BookingConfirmation | Post-pago |
| `/mis-reservas` | MyBookings | Historial guest |
| `/reseña/:bookingId` | ReviewFlow | Flujo de reseña |
| `/anfitrion/onboarding` | HostOnboarding | Wizard publicar espacio |
| `/anfitrion/dashboard` | HostDashboard | Panel host |
| `/anfitrion/calendario` | CalendarManagement | Disponibilidad |
| `/anfitrion/reservas` | BookingManagement | Gestión reservas |
| `/anfitrion/ganancias` | Earnings | Historial pagos |
| `/login` | Login | Login + Register |
| `/perfil` | Profile | Editar perfil |

---

## Checklist de integración

- [ ] Conectar `useSpaces` en SearchResults y Home
- [ ] Conectar `useSpace` en SpaceDetail
- [ ] Conectar `useSpaceAvailability` en SpaceDetail (calendario)
- [ ] Conectar `useCreateBooking` en Checkout
- [ ] Conectar `useMyBookings` en MyBookings
- [ ] Conectar `useCreateReview` en ReviewFlow
- [ ] Conectar `useHostBookings` en BookingManagement
- [ ] Conectar `useRespondBooking` en BookingManagement
- [ ] Conectar `useHostStats` en HostDashboard
- [ ] Conectar `useHostEarnings` en Earnings
- [ ] Conectar `useUpdateAvailability` en CalendarManagement
- [ ] Conectar `useLogin` + `useRegister` en Login
- [ ] Implementar Google OAuth
- [ ] Conectar upload de fotos en HostOnboarding
- [ ] Integrar Mercado Pago / Stripe en Checkout
- [ ] Añadir mapa real (Mapbox/Google Maps) en SearchResults
- [ ] Push notifications para reservas pendientes

---

## Deploy

El proyecto está configurado para Vercel con CI/CD automático desde GitHub.
El `vercel.json` existente en el repo raíz maneja el rewrites para React Router.
Este frontend se integra **sobre** la landing existente en `prende-three.vercel.app`.
