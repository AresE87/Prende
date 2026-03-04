# Prende — Guía para Claude Code

Marketplace de espacios con parrilla por hora · Montevideo, Uruguay  
Repo: github.com/AresE87/Prende

---

## Stack definitivo

| Capa | Tecnología |
|------|-----------|
| Frontend | React 19 + Vite + Tailwind CSS |
| Backend / DB | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Pagos | MercadoPago Uruguay (Checkout API + Transfers) |
| Notificaciones | WhatsApp Business API via 360dialog |
| Mapas | Google Maps JS API + Places API + Geocoding API |
| Imágenes | Supabase Storage con transformaciones |
| Email | Resend |
| Deploy | Vercel (frontend) + Supabase Cloud (backend) |

---

## Estructura del repo

```
prende/
├── CLAUDE.md                          ← este archivo
├── .env.example                       ← todas las variables necesarias
├── supabase/
│   ├── migrations/
│   │   └── 001_initial.sql            ← schema completo de la DB
│   └── functions/
│       ├── mp-create-preference/      ← crea preferencia de pago en MP
│       │   └── index.ts
│       ├── mp-webhook/                ← recibe eventos de MP
│       │   └── index.ts
│       ├── mp-release-payment/        ← libera pago al host post-evento
│       │   └── index.ts
│       └── send-notifications/        ← orquesta WhatsApp + Email
│           └── index.ts
└── src/
    ├── lib/
    │   ├── supabase.ts                ← cliente Supabase tipado
    │   ├── maps.ts                    ← Google Maps utilities
    │   └── storage.ts                 ← upload de imágenes
    ├── hooks/
    │   └── useReservation.ts          ← hook completo del flujo de reserva
    └── components/
        ├── MapSearch.tsx              ← mapa con pines y sidebar
        ├── ImageUpload.tsx            ← drag & drop multi-foto
        └── CheckoutButton.tsx         ← botón de pago con MP
```

---

## Variables de entorno

Copiar `.env.example` a `.env.local` (frontend) y configurar en Supabase Dashboard → Settings → Edge Functions para las functions.

**Nunca hardcodear API keys. Todo lo sensible va en servidor.**

---

## Modelo de negocio que impacta el código

- Take rate: **15%** → Prende retiene $U X, transfiere 85% al host
- El pago se retiene hasta que la reserva se completa (post-evento)
- Si cancelación >24h antes: reembolso automático 100%
- Si cancelación <24h: sin reembolso (política configurable)

---

## Flujo de una reserva (happy path)

```
1. Guest busca espacio en MapSearch
2. Guest selecciona fecha/hora → CheckoutButton
3. mp-create-preference crea preferencia en MP con monto total
4. MP cobra al guest → genera payment_id
5. mp-webhook recibe payment.approved → crea reserva en DB con estado "paid"
6. send-notifications → WhatsApp al guest (confirmación) + al host (nueva reserva)
7. send-notifications → recordatorio 24h antes
8. send-notifications → recordatorio 2h antes con dirección
9. Evento ocurre
10. mp-release-payment (cron o trigger manual) → transfiere 85% al host
11. send-notifications → solicitud de reseña al guest + pago acreditado al host
```

---

## Alertas críticas de implementación

1. **MP webhook**: verificar firma HMAC-SHA256 en CADA request antes de procesar
2. **WhatsApp templates**: deben estar aprobados por Meta ANTES del lanzamiento. El proceso tarda 24-72h. Crear cuenta de 360dialog el día 1.
3. **Geocoding**: siempre guardar lat/lng en DB al crear el espacio, nunca geocodificar en runtime
4. **Imágenes**: máximo 12 por espacio, 10MB por foto, formatos JPG/PNG/WEBP
5. **RLS**: todas las tablas tienen Row Level Security activo. Ver policies en 001_initial.sql
6. **Moneda**: todo en UYU (pesos uruguayos). MP Uruguay soporta UYU nativamente.

---

## Comandos útiles

```bash
# Instalar Supabase CLI
npm install -g supabase

# Linkear al proyecto
supabase link --project-ref TU_PROJECT_REF

# Aplicar migrations
supabase db push

# Deploy de todas las Edge Functions
supabase functions deploy mp-create-preference
supabase functions deploy mp-webhook
supabase functions deploy mp-release-payment
supabase functions deploy send-notifications

# Testear webhook localmente
supabase functions serve mp-webhook --env-file .env.local
```

---

## Decisiones de arquitectura tomadas

### MercadoPago: por qué Checkout API y no Checkout Pro
Checkout Pro redirecciona al usuario a MP. Checkout API mantiene al usuario en Prende. Para el modelo de Prende donde la UX es diferenciadora, Checkout API es la elección correcta aunque requiere certificación PCI DSS (gestionada por el SDK de MP del lado cliente).

### Split de pagos: colectar + transferir manualmente
MP Marketplace API (que hace split automático) tiene disponibilidad limitada y proceso de aprobación largo en Uruguay. La solución elegida: Prende cobra el 100% en su cuenta MP, y transfiere el 85% al host usando la Payments API → Disbursements. Esto agrega latencia (T+1 hábil) pero es el path más confiable para Uruguay hoy.

### WhatsApp: 360dialog sobre Twilio
Twilio cobra $0.005/mensaje + fees de Meta. 360dialog tiene pricing flat de ~$50 USD/mes para 1000 conversaciones, con mejor soporte para LatAm y onboarding más rápido. Para el volumen esperado en Año 1, 360dialog es 3-4x más barato.

### Imágenes: Supabase Storage sobre Cloudinary
Elimina un vendor externo. Supabase Storage soporta transformaciones básicas (resize, format) via parámetros de URL. Para Año 1 es suficiente. Si en Año 2 se necesitan transformaciones avanzadas (detección de calidad, moderación automática), migrar a Cloudinary.
