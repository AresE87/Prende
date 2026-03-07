-- ============================================================
-- PRENDE · Migration 006 · Scheduled reminders
-- ============================================================
-- Tabla para programar notificaciones (24h, 2h, review, payout)
-- Un cron o Edge Function periódica consulta los pendientes.

CREATE TABLE scheduled_reminders (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id     UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  trigger_type   TEXT NOT NULL CHECK (trigger_type IN (
    'reminder_24h', 'reminder_2h', 'review_request', 'payment_release'
  )),
  scheduled_for  TIMESTAMPTZ NOT NULL,
  sent           BOOLEAN DEFAULT FALSE,
  sent_at        TIMESTAMPTZ,
  error          TEXT,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reminders_pending ON scheduled_reminders(scheduled_for)
  WHERE sent = FALSE;
CREATE INDEX idx_reminders_booking ON scheduled_reminders(booking_id);

-- Evitar duplicados: un booking no puede tener dos reminders del mismo tipo
CREATE UNIQUE INDEX idx_reminders_dedupe
  ON scheduled_reminders(booking_id, trigger_type);

-- RLS
ALTER TABLE scheduled_reminders ENABLE ROW LEVEL SECURITY;

-- Solo el sistema (service role) puede leer/escribir reminders
CREATE POLICY "Service role full access on reminders"
  ON scheduled_reminders FOR ALL
  USING (auth.role() = 'service_role');
