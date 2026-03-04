# Prende — Estrategia de Testing & Casos P0
*QA Playbook v1.0 · Marketplace de espacios con parrilla · Montevideo, UY*

---

## Índice

1. [P0 — Casos que nunca pueden romperse](#p0)
2. [Unit Tests — Lógica de negocio](#unit)
3. [Integration Tests — API y base de datos](#integration)
4. [E2E Tests — Flujos críticos completos](#e2e)
5. [Setup de CI/CD](#ci)
6. [Cobertura mínima aceptable](#coverage)

---

## <a name="p0"></a>01 — Casos P0: Bloquean el Deploy si Fallan

> Un P0 que falla = el deploy no va a producción. Sin excepciones.

---

### P0-001: Flujo de reserva completo (happy path)

**Por qué es P0:** Es la única transacción que genera revenue. Si esto se rompe, el negocio no existe.

**Precondiciones:**
- Host activo con espacio verificado (zona: Pocitos, capacidad: 15 personas)
- Calendario del espacio: slot libre el próximo sábado 18:00–21:00
- Usuario registrado con cuenta de MercadoPago válida
- Take rate configurado en 15%

```typescript
// tests/e2e/booking-happy-path.spec.ts
import { test, expect } from '@playwright/test'
import { seedTestSpace, seedTestUser, cleanupTestData } from '../helpers/db'

test.describe('P0-001: Flujo de reserva completo', () => {
  let spaceId: string
  let userId: string

  test.beforeAll(async () => {
    spaceId = await seedTestSpace({
      name: 'Parrilla Pocitos Test',
      zone: 'Pocitos',
      hourlyRate: 1200, // UYU/hora
      capacity: 15,
    })
    userId = await seedTestUser({ email: 'asador_test@prende.uy' })
  })

  test.afterAll(async () => {
    await cleanupTestData([spaceId, userId])
  })

  test('usuario puede completar una reserva de extremo a extremo', async ({ page }) => {
    // PASO 1: Búsqueda
    await page.goto('/buscar')
    await page.getByLabel('Zona').selectOption('Pocitos')
    await page.getByLabel('Fecha').fill('2025-07-12') // próximo sábado
    await page.getByLabel('Horario inicio').selectOption('18:00')
    await page.getByLabel('Horario fin').selectOption('21:00')
    await page.getByRole('button', { name: 'Buscar espacios' }).click()

    // PASO 2: Selección del espacio
    await expect(page.getByText('Parrilla Pocitos Test')).toBeVisible()
    await page.getByText('Parrilla Pocitos Test').click()

    // PASO 3: Vista de detalle — verificar precio correcto antes de confirmar
    // 3 horas × $U 1.200 = $U 3.600 base
    // Fee usuario (15% × 40%) = 6% sobre booking = $U 216
    // Total al usuario: $U 3.816
    await expect(page.getByTestId('precio-base')).toHaveText('$U 3.600')
    await expect(page.getByTestId('fee-servicio')).toHaveText('$U 216')
    await expect(page.getByTestId('total-usuario')).toHaveText('$U 3.816')

    // PASO 4: Checkout
    await page.getByRole('button', { name: 'Reservar ahora' }).click()
    
    // Verificar que el seguro aparece como opt-out por defecto (ver riesgos legales)
    await expect(page.getByTestId('seguro-checkbox')).toBeChecked()

    // PASO 5: Pago via MercadoPago (sandbox)
    await page.waitForURL('**/checkout/mercadopago/**')
    // En sandbox: MP redirige de vuelta con query param de éxito
    await page.goto('/reserva/confirmacion?payment_id=TEST_PAY_001&status=approved')

    // PASO 6: Verificar estado final
    await expect(page.getByTestId('reserva-status')).toHaveText('Confirmada')
    await expect(page.getByTestId('reserva-fecha')).toContainText('Sábado 12 de julio')
    await expect(page.getByTestId('reserva-horario')).toContainText('18:00 – 21:00')

    // PASO 7: Verificar que el slot ya no está disponible (idempotencia)
    await page.goto('/buscar')
    await page.getByLabel('Fecha').fill('2025-07-12')
    await page.getByLabel('Horario inicio').selectOption('18:00')
    await page.getByRole('button', { name: 'Buscar espacios' }).click()
    await expect(page.getByText('Parrilla Pocitos Test')).not.toBeVisible()
  })
})
```

---

### P0-002: Lógica de comisión y split de pago

**Por qué es P0:** Un cálculo incorrecto puede transferir más o menos al host, generando deuda o pérdida directa. Con MercadoPago, un error en el split es irreversible sin soporte manual.

```typescript
// tests/unit/pricing.test.ts
import { describe, it, expect } from 'vitest'
import {
  calcBookingTotal,
  calcCommissionSplit,
  calcRefundAmount,
} from '@/lib/pricing'

describe('P0-002: Cálculo de precios y comisiones', () => {

  describe('calcBookingTotal', () => {
    it('calcula el total correcto para una reserva de 3 horas', () => {
      const result = calcBookingTotal({
        hourlyRate: 1200,
        hours: 3,
        takeRate: 0.15,
        userFeeShare: 0.4, // 40% del take rate al usuario
      })

      expect(result.baseAmount).toBe(3600)       // 1200 × 3
      expect(result.userFee).toBe(216)            // 3600 × 0.15 × 0.40
      expect(result.hostDeduction).toBe(324)      // 3600 × 0.15 × 0.60
      expect(result.totalChargedToUser).toBe(3816) // 3600 + 216
      expect(result.transferredToHost).toBe(3276) // 3600 - 324
      expect(result.prendeRevenue).toBe(540)      // 3600 × 0.15
    })

    it('la suma de transferredToHost + prendeRevenue == baseAmount', () => {
      const rates = [0.10, 0.15, 0.20]
      const hours = [1, 2, 3, 5, 8]
      
      rates.forEach(takeRate => {
        hours.forEach(h => {
          const result = calcBookingTotal({ hourlyRate: 1200, hours: h, takeRate, userFeeShare: 0.4 })
          expect(result.transferredToHost + result.prendeRevenue).toBe(result.baseAmount)
        })
      })
    })

    it('no genera centavos fraccionados en UYU', () => {
      // UYU opera en pesos enteros — sin decimales
      const result = calcBookingTotal({
        hourlyRate: 950, // número que genera decimales con 15%
        hours: 3,
        takeRate: 0.15,
        userFeeShare: 0.4,
      })
      expect(result.userFee % 1).toBe(0)
      expect(result.transferredToHost % 1).toBe(0)
      expect(result.prendeRevenue % 1).toBe(0)
    })
  })

  describe('calcCommissionSplit', () => {
    it('el split nunca supera el total cobrado al usuario', () => {
      const total = calcBookingTotal({ hourlyRate: 1200, hours: 3, takeRate: 0.15, userFeeShare: 0.4 })
      const { platformShare, hostShare } = calcCommissionSplit(total)
      expect(platformShare + hostShare).toBeLessThanOrEqual(total.totalChargedToUser)
    })
  })

  describe('calcRefundAmount', () => {
    it('cancelación >24h antes devuelve el 100% del total cobrado al usuario', () => {
      const bookingTime = new Date('2025-07-12T18:00:00-03:00')
      const cancelTime = new Date('2025-07-11T10:00:00-03:00') // 32h antes
      const result = calcRefundAmount({ totalPaid: 3816, bookingTime, cancelTime })

      expect(result.refundAmount).toBe(3816)
      expect(result.refundPercentage).toBe(1)
      expect(result.penalty).toBe(0)
    })

    it('cancelación <24h antes aplica política de penalización', () => {
      const bookingTime = new Date('2025-07-12T18:00:00-03:00')
      const cancelTime = new Date('2025-07-12T08:00:00-03:00') // 10h antes
      const result = calcRefundAmount({ totalPaid: 3816, bookingTime, cancelTime })

      // Política: <24h = sin reembolso (o reembolso parcial según la regla que defina producto)
      expect(result.refundAmount).toBe(0)
      expect(result.penalty).toBe(3816)
    })

    it('cancelación exactamente en el límite de 24h devuelve reembolso completo', () => {
      const bookingTime = new Date('2025-07-12T18:00:00-03:00')
      const cancelTime = new Date('2025-07-11T18:00:00-03:00') // exactamente 24h antes
      const result = calcRefundAmount({ totalPaid: 3816, bookingTime, cancelTime })

      expect(result.refundAmount).toBe(3816)
    })

    it('no puede reembolsar más de lo que se pagó', () => {
      const result = calcRefundAmount({
        totalPaid: 3816,
        bookingTime: new Date('2025-07-12T18:00:00'),
        cancelTime: new Date('2025-07-10T18:00:00'),
      })
      expect(result.refundAmount).toBeLessThanOrEqual(3816)
    })
  })
})
```

---

### P0-003: Lógica de disponibilidad del calendario — Sin double-booking

**Por qué es P0:** Dos usuarios que reservan el mismo slot en el mismo espacio es el error más costoso en un marketplace transaccional. Implica al menos un reembolso manual, daño al NPS del host y pérdida de confianza.

```typescript
// tests/integration/availability.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { createTestDb, clearSlots } from '../helpers/db'
import { AvailabilityService } from '@/services/availability'

describe('P0-003: Disponibilidad y bloqueo de slots', () => {
  let db: TestDb
  let availabilityService: AvailabilityService
  const spaceId = 'space_test_001'

  beforeEach(async () => {
    db = await createTestDb()
    availabilityService = new AvailabilityService(db)
    await clearSlots(db, spaceId)
  })

  afterEach(async () => {
    await db.destroy()
  })

  it('bloquea un slot exitosamente cuando está disponible', async () => {
    const slot = { date: '2025-07-12', startHour: 18, endHour: 21 }
    const result = await availabilityService.lockSlot(spaceId, slot, 'user_001')
    expect(result.success).toBe(true)
    expect(result.lockToken).toBeDefined()
  })

  it('rechaza el segundo bloqueo del mismo slot (race condition)', async () => {
    const slot = { date: '2025-07-12', startHour: 18, endHour: 21 }

    // Simular dos requests concurrentes al mismo tiempo
    const [result1, result2] = await Promise.all([
      availabilityService.lockSlot(spaceId, slot, 'user_001'),
      availabilityService.lockSlot(spaceId, slot, 'user_002'),
    ])

    const successes = [result1, result2].filter(r => r.success)
    const failures = [result1, result2].filter(r => !r.success)

    expect(successes).toHaveLength(1)
    expect(failures).toHaveLength(1)
    expect(failures[0].error).toBe('SLOT_ALREADY_LOCKED')
  })

  it('bloquea slots adyacentes sin conflicto', async () => {
    const slot1 = { date: '2025-07-12', startHour: 15, endHour: 18 }
    const slot2 = { date: '2025-07-12', startHour: 18, endHour: 21 }

    const result1 = await availabilityService.lockSlot(spaceId, slot1, 'user_001')
    const result2 = await availabilityService.lockSlot(spaceId, slot2, 'user_002')

    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })

  it('detecta solapamiento parcial de slots', async () => {
    // user_001 reserva 18:00–21:00
    await availabilityService.lockSlot(spaceId,
      { date: '2025-07-12', startHour: 18, endHour: 21 }, 'user_001')

    // user_002 intenta reservar 20:00–23:00 (solapamiento parcial)
    const result = await availabilityService.lockSlot(spaceId,
      { date: '2025-07-12', startHour: 20, endHour: 23 }, 'user_002')

    expect(result.success).toBe(false)
    expect(result.error).toBe('SLOT_OVERLAP')
  })

  it('libera el slot si el pago falla después del lock', async () => {
    const slot = { date: '2025-07-12', startHour: 18, endHour: 21 }
    const { lockToken } = await availabilityService.lockSlot(spaceId, slot, 'user_001')

    // Simular fallo de pago → debe liberar el lock
    await availabilityService.releaseLock(spaceId, lockToken!)

    // Ahora otro usuario puede tomar el slot
    const result = await availabilityService.lockSlot(spaceId, slot, 'user_002')
    expect(result.success).toBe(true)
  })

  it('el lock expira automáticamente si no se confirma el pago en 10 minutos', async () => {
    const slot = { date: '2025-07-12', startHour: 18, endHour: 21 }
    await availabilityService.lockSlot(spaceId, slot, 'user_001', {
      expiresInMinutes: 10,
    })

    // Avanzar el reloj 11 minutos
    vi.useFakeTimers()
    vi.advanceTimersByTime(11 * 60 * 1000)

    const isStillLocked = await availabilityService.isSlotLocked(spaceId, slot)
    expect(isStillLocked).toBe(false)

    vi.useRealTimers()
  })
})
```

---

### P0-004: Webhook de MercadoPago — Confirmación de pago

**Por qué es P0:** Si el webhook falla silenciosamente, el pago existe en MP pero la reserva no se confirma en la DB → el usuario pagó pero no tiene reserva. Es el error que genera más chargebacks y soporte urgente.

```typescript
// tests/integration/mercadopago-webhook.test.ts
import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import { app } from '@/app'
import { getBookingById } from '@/repositories/bookings'
import { generateMPSignature } from '../helpers/mercadopago'

const MP_SECRET = process.env.MP_WEBHOOK_SECRET!

describe('P0-004: Webhook de MercadoPago', () => {

  it('confirma la reserva cuando el pago es aprobado', async () => {
    // Crear reserva en estado PENDING_PAYMENT primero
    const bookingId = 'booking_test_001'
    await createPendingBooking(bookingId)

    const payload = {
      action: 'payment.updated',
      data: { id: 'MP_PAY_123' },
    }

    // MP firma cada webhook con HMAC-SHA256
    const signature = generateMPSignature(payload, MP_SECRET)

    const response = await request(app)
      .post('/webhooks/mercadopago')
      .set('x-signature', signature)
      .send(payload)

    expect(response.status).toBe(200)

    const booking = await getBookingById(bookingId)
    expect(booking.status).toBe('CONFIRMED')
    expect(booking.paymentId).toBe('MP_PAY_123')
  })

  it('marca la reserva como FAILED si el pago es rechazado', async () => {
    const bookingId = 'booking_test_002'
    await createPendingBooking(bookingId)

    // Mockear MP API para devolver status=rejected
    vi.spyOn(mpClient, 'getPayment').mockResolvedValue({
      status: 'rejected',
      id: 'MP_PAY_456',
    })

    const payload = { action: 'payment.updated', data: { id: 'MP_PAY_456' } }
    const signature = generateMPSignature(payload, MP_SECRET)

    await request(app)
      .post('/webhooks/mercadopago')
      .set('x-signature', signature)
      .send(payload)

    const booking = await getBookingById(bookingId)
    expect(booking.status).toBe('FAILED')

    // El slot también debe haberse liberado
    const isLocked = await isSlotLocked(booking.spaceId, booking.slot)
    expect(isLocked).toBe(false)
  })

  it('rechaza webhooks con firma inválida (protección anti-spoofing)', async () => {
    const response = await request(app)
      .post('/webhooks/mercadopago')
      .set('x-signature', 'firma_falsa_atacante')
      .send({ action: 'payment.updated', data: { id: 'FAKE' } })

    expect(response.status).toBe(401)
  })

  it('es idempotente — dos webhooks del mismo pago no duplican la confirmación', async () => {
    const bookingId = 'booking_test_003'
    await createPendingBooking(bookingId)

    const payload = { action: 'payment.updated', data: { id: 'MP_PAY_789' } }
    const signature = generateMPSignature(payload, MP_SECRET)

    // Enviar el mismo webhook dos veces (MP puede reintentar)
    await request(app).post('/webhooks/mercadopago').set('x-signature', signature).send(payload)
    await request(app).post('/webhooks/mercadopago').set('x-signature', signature).send(payload)

    // Solo debe haber una entrada en el log de pagos
    const paymentLogs = await getPaymentLogsByBooking(bookingId)
    expect(paymentLogs).toHaveLength(1)
  })

  it('devuelve 200 aunque falle el envío de notificación (no bloquear MP)', async () => {
    vi.spyOn(notificationService, 'sendWhatsApp').mockRejectedValue(new Error('WhatsApp down'))

    const payload = { action: 'payment.updated', data: { id: 'MP_PAY_999' } }
    const signature = generateMPSignature(payload, MP_SECRET)

    const response = await request(app)
      .post('/webhooks/mercadopago')
      .set('x-signature', signature)
      .send(payload)

    // El webhook debe responder 200 aunque las notificaciones fallen
    // MP cancela el webhook si recibe un error — y eso sí es un problema
    expect(response.status).toBe(200)
  })
})
```

---

### P0-005: Cancelación con reembolso

```typescript
// tests/e2e/cancellation.spec.ts
import { test, expect } from '@playwright/test'

test.describe('P0-005: Cancelación y reembolso', () => {

  test('usuario cancela >24h antes y recibe reembolso completo', async ({ page }) => {
    // Partir de una reserva confirmada con fecha en 48h
    await page.goto('/mis-reservas/booking_future_001')
    await expect(page.getByTestId('reserva-status')).toHaveText('Confirmada')

    await page.getByRole('button', { name: 'Cancelar reserva' }).click()
    await expect(page.getByTestId('modal-cancelacion')).toBeVisible()
    
    // El modal debe mostrar claramente el monto a reembolsar
    await expect(page.getByTestId('monto-reembolso')).toHaveText('$U 3.816')
    await expect(page.getByTestId('politica-aplicada')).toContainText('Reembolso completo')

    await page.getByRole('button', { name: 'Confirmar cancelación' }).click()

    await expect(page.getByTestId('reserva-status')).toHaveText('Cancelada')
    await expect(page.getByTestId('reembolso-status')).toContainText('Reembolso iniciado')
  })

  test('usuario no puede cancelar una reserva que ya pasó', async ({ page }) => {
    await page.goto('/mis-reservas/booking_past_001')
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).not.toBeVisible()
  })

  test('host cancela y se notifica al usuario inmediatamente', async ({ page }) => {
    await page.goto('/host/reservas/booking_host_001')
    await page.getByRole('button', { name: 'Cancelar esta reserva' }).click()
    await page.getByLabel('Motivo').fill('Problema con la instalación de gas')
    await page.getByRole('button', { name: 'Confirmar' }).click()

    // El host no ve más la reserva como activa
    await expect(page.getByTestId('reserva-status')).toHaveText('Cancelada por host')

    // Verificar que se encoló una notificación al usuario
    const notifications = await getTestNotifications('asador_test@prende.uy')
    expect(notifications).toContainEqual(
      expect.objectContaining({ type: 'HOST_CANCELLED', bookingId: 'booking_host_001' })
    )
  })
})
```

---

## <a name="unit"></a>02 — Unit Tests: Lógica de Negocio

> Estos tests son rápidos, sin DB, sin red. Deben correr en < 2 segundos.

### Validaciones de formulario

```typescript
// tests/unit/validations.test.ts
import { describe, it, expect } from 'vitest'
import { validateBookingForm, validateSpaceListing } from '@/lib/validations'

describe('Validaciones de reserva', () => {

  it('rechaza una reserva con fecha en el pasado', () => {
    const result = validateBookingForm({
      date: '2020-01-01',
      startHour: 18,
      endHour: 21,
      spaceId: 'space_001',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('FECHA_EN_PASADO')
  })

  it('rechaza una reserva donde endHour <= startHour', () => {
    const result = validateBookingForm({
      date: '2025-12-31',
      startHour: 21,
      endHour: 18, // fin antes del inicio
      spaceId: 'space_001',
    })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('HORARIO_INVALIDO')
  })

  it('acepta una reserva válida', () => {
    const result = validateBookingForm({
      date: '2025-12-31',
      startHour: 18,
      endHour: 21,
      spaceId: 'space_001',
    })
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('Validaciones de listing del host', () => {

  it('rechaza un precio por hora de $U 0', () => {
    const result = validateSpaceListing({ hourlyRate: 0, capacity: 15, zone: 'Pocitos' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('PRECIO_INVALIDO')
  })

  it('rechaza una capacidad menor a 1 persona', () => {
    const result = validateSpaceListing({ hourlyRate: 1200, capacity: 0, zone: 'Pocitos' })
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('CAPACIDAD_INVALIDA')
  })
})
```

### Transformaciones de datos

```typescript
// tests/unit/transforms.test.ts
import { describe, it, expect } from 'vitest'
import { formatBookingForDisplay, parseCalendarSlots } from '@/lib/transforms'

describe('formatBookingForDisplay', () => {

  it('formatea correctamente una reserva en español rioplatense', () => {
    const booking = {
      date: '2025-07-12',
      startHour: 18,
      endHour: 21,
      spaceName: 'Parrilla Pocitos',
    }
    const display = formatBookingForDisplay(booking)

    expect(display.dateLabel).toBe('Sábado 12 de julio de 2025')
    expect(display.timeLabel).toBe('18:00 – 21:00 hs')
    expect(display.duration).toBe('3 horas')
  })

  it('parseCalendarSlots convierte slots de DB a estructura de calendario', () => {
    const rawSlots = [
      { start: '2025-07-12T18:00:00-03:00', end: '2025-07-12T21:00:00-03:00', status: 'BOOKED' },
    ]
    const parsed = parseCalendarSlots(rawSlots)

    expect(parsed['2025-07-12']).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ hour: 18, available: false }),
        expect.objectContaining({ hour: 19, available: false }),
        expect.objectContaining({ hour: 20, available: false }),
        expect.objectContaining({ hour: 21, available: true }), // el slot termina en 21, no lo bloquea
      ])
    )
  })
})
```

---

## <a name="integration"></a>03 — Integration Tests: API y Base de Datos

> Estos tests usan una DB de test real (no mocks). Corren en CI con Supabase local o PostgreSQL en Docker.

### Endpoints críticos de API

```typescript
// tests/integration/api/spaces.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '@/app'
import { seedSpace, clearTestSpaces } from '../helpers/db'

describe('GET /api/spaces — búsqueda de espacios', () => {

  beforeAll(async () => {
    await seedSpace({ id: 'sp_1', zone: 'Pocitos', capacity: 15, hourlyRate: 1200 })
    await seedSpace({ id: 'sp_2', zone: 'Carrasco', capacity: 30, hourlyRate: 2000 })
    await seedSpace({ id: 'sp_3', zone: 'Pocitos', capacity: 8, hourlyRate: 900 })
  })

  afterAll(clearTestSpaces)

  it('filtra por zona', async () => {
    const res = await request(app).get('/api/spaces?zone=Pocitos')
    expect(res.status).toBe(200)
    expect(res.body.spaces).toHaveLength(2)
    expect(res.body.spaces.every((s: any) => s.zone === 'Pocitos')).toBe(true)
  })

  it('filtra por capacidad mínima', async () => {
    const res = await request(app).get('/api/spaces?minCapacity=20')
    expect(res.status).toBe(200)
    expect(res.body.spaces).toHaveLength(1)
    expect(res.body.spaces[0].id).toBe('sp_2')
  })

  it('no devuelve espacios con slots bloqueados en la fecha solicitada', async () => {
    await lockSlotForSpace('sp_1', '2025-07-12', 18, 21)

    const res = await request(app)
      .get('/api/spaces?zone=Pocitos&date=2025-07-12&startHour=18&endHour=21')

    expect(res.status).toBe(200)
    const ids = res.body.spaces.map((s: any) => s.id)
    expect(ids).not.toContain('sp_1') // bloqueado
    expect(ids).toContain('sp_3')     // libre
  })

  it('devuelve 400 si la fecha tiene formato inválido', async () => {
    const res = await request(app).get('/api/spaces?date=31-07-2025') // formato incorrecto
    expect(res.status).toBe(400)
    expect(res.body.error).toBe('INVALID_DATE_FORMAT')
  })
})
```

### Flujo de autenticación

```typescript
// tests/integration/auth.test.ts
import { describe, it, expect } from 'vitest'
import request from 'supertest'
import { app } from '@/app'

describe('Autenticación', () => {

  it('registro de nuevo usuario devuelve token válido', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'nuevo_test@prende.uy',
      password: 'Asado2025!',
      name: 'Gonzalo Test',
      role: 'guest',
    })

    expect(res.status).toBe(201)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.email).toBe('nuevo_test@prende.uy')
    expect(res.body.user.password).toBeUndefined() // NUNCA devolver password
  })

  it('login con credenciales válidas devuelve token', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'existente@prende.uy',
      password: 'correctPassword',
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
  })

  it('endpoint protegido devuelve 401 sin token', async () => {
    const res = await request(app).post('/api/bookings').send({})
    expect(res.status).toBe(401)
  })

  it('usuario con rol guest no puede acceder a endpoints de host', async () => {
    const guestToken = await getGuestToken()
    const res = await request(app)
      .get('/api/host/spaces')
      .set('Authorization', `Bearer ${guestToken}`)
    expect(res.status).toBe(403)
  })
})
```

---

## <a name="e2e"></a>04 — E2E Tests Adicionales (Playwright)

```typescript
// tests/e2e/host-onboarding.spec.ts
test.describe('Onboarding del host', () => {

  test('host puede listar un espacio completo en < 5 minutos', async ({ page }) => {
    const start = Date.now()

    await page.goto('/host/nuevo-espacio')
    await page.getByLabel('Nombre del espacio').fill('Parrilla Test Onboarding')
    await page.getByLabel('Zona').selectOption('Malvín')
    await page.getByLabel('Precio por hora (UYU)').fill('1400')
    await page.getByLabel('Capacidad máxima').fill('20')
    await page.getByLabel('Descripción').fill('Parrilla amplia con jardín y techado.')

    // Subir foto
    await page.getByLabel('Fotos del espacio').setInputFiles('tests/fixtures/parrilla_test.jpg')
    await expect(page.getByTestId('foto-preview')).toBeVisible()

    // Checklist de verificación técnica (requerido por riesgos legales - M1)
    await page.getByLabel('Tipo de combustible').selectOption('carbon')
    await page.getByLabel('Extintor disponible').check()
    await page.getByLabel('Acceso a agua').check()
    await page.getByLabel('El reglamento de copropiedad permite uso por terceros').check()

    await page.getByRole('button', { name: 'Publicar espacio' }).click()
    await expect(page.getByTestId('espacio-publicado-confirmacion')).toBeVisible()

    const elapsed = (Date.now() - start) / 1000 / 60
    expect(elapsed).toBeLessThan(5) // SLA de onboarding
  })
})
```

```typescript
// tests/e2e/reviews.spec.ts
test.describe('Sistema de reseñas bilateral', () => {

  test('guest puede dejar reseña solo después de que la reserva ocurrió', async ({ page }) => {
    // Reserva futura — no debe poder reseñar
    await page.goto('/mis-reservas/booking_future_001')
    await expect(page.getByRole('button', { name: 'Dejar reseña' })).not.toBeVisible()

    // Reserva pasada — sí puede
    await page.goto('/mis-reservas/booking_past_001')
    await expect(page.getByRole('button', { name: 'Dejar reseña' })).toBeVisible()
  })

  test('no se puede dejar dos reseñas para la misma reserva', async ({ page }) => {
    await page.goto('/mis-reservas/booking_reviewed_001')
    await expect(page.getByRole('button', { name: 'Dejar reseña' })).not.toBeVisible()
    await expect(page.getByTestId('resena-ya-enviada')).toBeVisible()
  })
})
```

---

## <a name="ci"></a>05 — Setup de CI/CD (GitHub Actions)

```yaml
# .github/workflows/test.yml
name: Test Suite — Prende

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run test:unit
      - name: Falla si cobertura < 80% en lógica de negocio
        run: npm run test:unit -- --coverage --coverage-threshold 80

  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: prende_test
          POSTGRES_USER: prende
          POSTGRES_PASSWORD: test_secret
        ports: ['5432:5432']
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run db:migrate:test
      - run: npm run test:integration
        env:
          DATABASE_URL: postgresql://prende:test_secret@localhost:5432/prende_test
          MP_WEBHOOK_SECRET: ${{ secrets.MP_WEBHOOK_SECRET_TEST }}

  e2e-p0:
    name: E2E — Solo Tests P0 (bloquean deploy)
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx playwright install chromium
      - run: npm run build
      - run: npm run test:e2e -- --grep "@p0"
        env:
          BASE_URL: http://localhost:4173
          MP_SANDBOX_KEY: ${{ secrets.MP_SANDBOX_KEY }}
      - name: Upload test results on failure
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/

  # ✅ Solo si todos los anteriores pasan, se permite el deploy
  deploy-gate:
    name: Deploy Gate
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-p0]
    steps:
      - run: echo "✅ Todos los tests P0 pasaron. Deploy autorizado."
```

---

## <a name="coverage"></a>06 — Cobertura Mínima Aceptable

| Módulo                          | Cobertura mínima | Justificación                                                |
|---------------------------------|------------------|--------------------------------------------------------------|
| `lib/pricing.ts`                | **95%**          | Errores de cálculo = pérdida directa de dinero               |
| `lib/availability.ts`           | **95%**          | Double-booking es el fallo más grave del modelo              |
| `lib/validations.ts`            | **90%**          | Inputs incorrectos rompen el flujo completo                  |
| `services/mercadopago.ts`       | **85%**          | Los edge cases de pagos son costosos                         |
| `services/notifications.ts`    | **60%**          | Fallo no crítico — degradación aceptable                     |
| `components/` (UI puro)        | **40%**          | No testear implementación CSS/visual — bajo ROI              |
| **Global proyecto**             | **70%**          | Umbral de bloqueo de PR                                      |

---

## Reglas de oro para este equipo

1. **Un test flaky es peor que no tener test** — si falla 1 de cada 10 veces sin causa, elimínalo o arréglalo inmediatamente. Los tests que se ignoran destruyen la cultura de testing.

2. **Testear comportamiento, no implementación** — si cambiar el nombre de una función interna rompe 10 tests, esos tests están mal escritos.

3. **Los tests P0 tienen cero tolerancia** — si `P0-003` falla en tu PR, el PR no se mergea. No hay excepción por "urgencia".

4. **Cada bug que llega a producción debe tener un test de regresión** — antes de hacer el fix, escribir el test que reproduzca el bug. El fix debe hacer que ese test pase.

5. **Los seeds de test son datos sagrados** — mantener `tests/helpers/db.ts` actualizado es parte del ticket, no un extra opcional.

---

*Prende QA Playbook v1.0 — Marzo 2026 — Revisión trimestral recomendada*
