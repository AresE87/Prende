-- ============================================================
-- PRENDE - Migration 003 - Booking safety hardening
-- ============================================================

-- Data integrity for booking times and pricing snapshots
ALTER TABLE bookings
  ADD CONSTRAINT ck_bookings_time_order
  CHECK (start_time < end_time)
  NOT VALID;

ALTER TABLE bookings
  ADD CONSTRAINT ck_bookings_amounts_non_negative
  CHECK (
    total_hours > 0
    AND price_per_hour >= 0
    AND subtotal >= 0
    AND platform_fee >= 0
    AND total_charged >= 0
    AND host_payout >= 0
  )
  NOT VALID;

ALTER TABLE bookings
  ADD CONSTRAINT ck_bookings_amount_math
  CHECK (
    subtotal + platform_fee = total_charged
    AND subtotal - platform_fee = host_payout
  )
  NOT VALID;

ALTER TABLE bookings VALIDATE CONSTRAINT ck_bookings_time_order;
ALTER TABLE bookings VALIDATE CONSTRAINT ck_bookings_amounts_non_negative;
ALTER TABLE bookings VALIDATE CONSTRAINT ck_bookings_amount_math;

CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_deadline
  ON bookings(cancellation_deadline);

-- Tighten client write access: booking status/payment transitions happen in Edge Functions
DROP POLICY IF EXISTS "bookings_update_own" ON bookings;

DROP POLICY IF EXISTS "bookings_insert_guest" ON bookings;
CREATE POLICY "bookings_insert_guest" ON bookings
  FOR INSERT
  WITH CHECK (
    guest_id = auth.uid()
    AND status = 'pending'
    AND payment_status = 'pending'
  );
