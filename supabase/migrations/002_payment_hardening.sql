-- ============================================================
-- PRENDE - Migration 002 - Payment hardening
-- ============================================================

-- Booking/payment metadata for safer checkout and reconciliation
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_provider TEXT NOT NULL DEFAULT 'mercadopago',
  ADD COLUMN IF NOT EXISTS checkout_token UUID DEFAULT uuid_generate_v4(),
  ADD COLUMN IF NOT EXISTS checkout_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS mp_merchant_order_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_error TEXT;

-- Idempotency + fast lookup for checkout and webhook handlers
CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_checkout_token
  ON bookings(checkout_token)
  WHERE checkout_token IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_bookings_mp_preference_id
  ON bookings(mp_preference_id)
  WHERE mp_preference_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_bookings_slot_lock
  ON bookings(space_id, date, start_time, end_time)
  WHERE status IN ('pending', 'paid', 'confirmed');

CREATE INDEX IF NOT EXISTS idx_bookings_payment_status
  ON bookings(payment_status, status);

-- Full audit log of inbound payment provider events
CREATE TABLE IF NOT EXISTS payment_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'mercadopago',
  dedupe_key TEXT,
  mp_event_type TEXT,
  mp_payment_id TEXT,
  mp_preference_id TEXT,
  mp_merchant_order_id TEXT,
  status TEXT,
  status_detail TEXT,
  currency_id TEXT,
  transaction_amount INT,
  net_received_amount INT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN NOT NULL DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payment_events_dedupe_key
  ON payment_events(dedupe_key)
  WHERE dedupe_key IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_payment_events_booking
  ON payment_events(booking_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_mp_payment
  ON payment_events(mp_payment_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_created_at
  ON payment_events(created_at DESC);

-- Keep timestamps fresh for audit readability
CREATE OR REPLACE FUNCTION set_payment_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_payment_events_updated_at ON payment_events;
CREATE TRIGGER tr_payment_events_updated_at
  BEFORE UPDATE ON payment_events
  FOR EACH ROW EXECUTE FUNCTION set_payment_events_updated_at();

ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;

