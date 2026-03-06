# Bitacora de rediseno UI - 2026-03-06

## Objetivo

Elevar Prende a un lenguaje visual y de producto mas cercano a un marketplace internacional serio, sin romper la arquitectura funcional ya montada para reservas, checkout y pagos Uruguay.

## Logica del diseno

### 1. Direccion visual

La interfaz anterior tenia buenas bases, pero seguia viendose fragmentada entre landing, app autenticada y checkout. El rediseño unifica esas capas bajo una misma direccion:

- atmosfera editorial con fondos calidos, oscuros y texturas suaves
- superficies con profundidad real, blur controlado y sombras largas
- tipografia mas expresiva para titulares y una sans mas geometrica para UI
- jerarquia mas clara en precios, estados, llamados a la accion y bloques de confianza
- componentes con bordes grandes, mejor respiracion y ritmo visual mas premium

### 2. Sistema visual nuevo

Se rehizo la base en `src/index.css` con:

- nuevas tipografias: `Space Grotesk`, `Instrument Serif`, `IBM Plex Mono`
- nueva paleta principal:
  - `ink`: profundidad y contraste
  - `sand`: base calida
  - `ember`: acento de conversion
  - `moss`: seguridad / operacion estable
- nuevas capas reutilizables:
  - `page-ambient`
  - `surface-card`
  - `glass-shell`
  - `section-shell`

Esto permite que las pantallas ya no dependan solo de utilidades aisladas, sino de una identidad visual consistente.

### 3. Principios de composicion aplicados

- La informacion comercial fuerte va primero: titulo, promesa, precio, disponibilidad.
- Las pruebas de confianza van cerca del CTA: reseñas, seguridad, confirmacion, metodo de pago.
- Los formularios ahora viven dentro de superficies premium en lugar de bloques planos.
- El checkout y la reserva se muestran como producto, no como un formulario tecnico.
- Se priorizo lectura mobile-first sin perder presencia en desktop.

## Funcionalidades preservadas y validadas a nivel de codigo

El rediseño no cambia la logica de negocio principal. Se mantuvo:

- busqueda de espacios con filtros reales desde Supabase
- detalle del espacio con checkout integrado
- checkout con Mercado Pago y soporte local ya implementado en codigo
- reservas del usuario
- confirmacion de reserva
- login / registro / OAuth
- landing comercial

## Pantallas y componentes redisenados

### Base compartida

- `src/index.css`
- `src/components/shared/index.jsx`
- `src/components/shared/Navbar.jsx`
- `src/components/shared/LoadingScreen.jsx`
- `src/App.jsx`

### Landing

- `src/components/Navbar.jsx`
- `src/components/Hero.jsx`
- `src/components/FinalCTA.jsx`

### App guest / conversion

- `src/components/booking/SpaceCard.jsx`
- `src/pages/SearchResults.jsx`
- `src/pages/SpaceDetail.jsx`
- `src/pages/Checkout.jsx`
- `src/pages/BookingConfirmation.jsx`
- `src/pages/MyBookings.jsx`
- `src/pages/auth/Login.jsx`

## Que mejoro concretamente

### Busqueda

Antes:

- listado correcto, pero con apariencia mas utilitaria
- filtros con poca jerarquia
- poca sensacion de curaduria o producto premium

Ahora:

- hero editorial para resultados
- sidebar de filtros con mas claridad
- mejor lectura de estado de busqueda y chips activos
- cards horizontales mas fuertes, con foco en precio, zona y experiencia

### Ficha del espacio

Antes:

- resolvia la informacion, pero todavia con layout mas convencional

Ahora:

- portada editorial con galeria mas rica
- bloques separados para anfitrion, descripcion, amenities, reglas y reseñas
- mejor lectura de confianza y seguridad antes del pago
- sidebar sticky de checkout mas robusta

### Checkout

Antes:

- correcto funcionalmente, pero todavia muy cercano a panel/formulario

Ahora:

- contexto comercial mas claro
- resumen del espacio mejor presentado
- politicas y seguridad mejor explicadas
- checkout visualmente mas alineado con una experiencia premium

### Mis reservas y confirmacion

Antes:

- funcionales, pero planas

Ahora:

- mejor lectura del estado de cada reserva
- vouchers y tickets pendientes mas visibles
- confirmacion con mas sensacion de cierre y control

### Login / registro

Antes:

- resolvia autenticacion, pero sin peso de marca

Ahora:

- pantalla de acceso con narrativa de producto
- mejor separacion entre guest y host
- mejor onboarding visual para nuevo usuario

## Estado de validacion

### Lint

Validado con `npm run lint`.

Resultado actual:

- sin errores
- quedan 2 warnings preexistentes que no fueron introducidos por este rediseño:
  - `src/components/Features.jsx`: dependencia faltante en `useEffect`
  - `src/pages/host/HostOnboarding.jsx`: warning del compiler por `watch()` de `react-hook-form`

### Build local

El `build` local en esta maquina no pudo validarse por un problema del entorno Windows, no por el codigo del proyecto.

Bloqueo exacto:

- el binario nativo de Rollup fue puesto en cuarentena por la politica local de seguridad
- el archivo generado fue `rollup.win32-x64-msvc.node_policy_violated.txt`
- por eso `vite build` falla en esta maquina aunque el codigo siga estando consistente

Implicacion:

- la validacion final de compilacion para este cambio debe tomarse desde Vercel o desde otra maquina sin esa cuarentena local

## Criterio de continuidad

Si retomas desde otra PC, el orden recomendado es:

1. `git pull origin master`
2. `npm install`
3. `npm run lint`
4. `npm run build`
5. revisar deploy de Vercel
6. continuar sobre el sistema visual ya creado, no volver al estilo anterior

## Como seguiria yo este rediseño

### 1. Host flows

Todavia queda margen para llevar dashboard, onboarding, calendario y ganancias al mismo nivel de polish visual.

### 2. Motion de producto

La base ya esta, pero agregaria:

- entradas por seccion mas finas
- transiciones de layout entre listado y detalle
- mejor feedback visual en pasos de reserva

### 3. Sistema de componentes mas estricto

Hoy la identidad ya esta mas fuerte. El siguiente paso seria consolidar:

- tokens mas finos por estado
- escalas de espaciado
- componentes premium reutilizables para paneles host/admin

### 4. Fotos y media

El producto subiria otro nivel si se curan mejor:

- relaciones de aspecto
- placeholders premium
- fallback de imagen mas consistente
- criterio editorial para galerias

## Nota importante

El rediseño se hizo cuidando no tocar la logica central de pagos y reservas. La idea fue mejorar percepcion, conversion y consistencia sin desarmar la base transaccional ya construida.
