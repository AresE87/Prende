-- ============================================================
-- PRENDE - Migration 004 - Uruguay payment methods metadata
-- ============================================================

ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method_type TEXT,
  ADD COLUMN IF NOT EXISTS payment_metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_method_id
  ON bookings(payment_method_id);

CREATE INDEX IF NOT EXISTS idx_bookings_checkout_expires_at
  ON bookings(checkout_expires_at);
