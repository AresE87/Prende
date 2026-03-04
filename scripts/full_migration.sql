-- ============================================================
-- PRENDE · Migración completa (limpiar + crear)
-- Pegar TODO este contenido en el SQL Editor de Supabase y ejecutar
-- ============================================================

-- PASO 1: Limpiar tablas existentes
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;

-- PASO 2: Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- PASO 3: Enum types
CREATE TYPE space_status    AS ENUM ('draft', 'active', 'paused', 'deleted');
CREATE TYPE booking_status  AS ENUM ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_status  AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'in_mediation', 'released');
CREATE TYPE fuel_type       AS ENUM ('carbon', 'lena', 'gas', 'electrica');

-- PASO 4: Tabla profiles
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  avatar_url      TEXT,
  cedula          TEXT UNIQUE,
  cedula_verified BOOLEAN DEFAULT FALSE,
  mp_account_id   TEXT,
  is_host         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 5: Tabla spaces
CREATE TABLE spaces (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  status            space_status DEFAULT 'draft',
  address           TEXT NOT NULL,
  neighborhood      TEXT,
  city              TEXT DEFAULT 'Montevideo',
  lat               DECIMAL(10, 8) NOT NULL,
  lng               DECIMAL(11, 8) NOT NULL,
  location          GEOGRAPHY(POINT, 4326),
  max_guests        INT NOT NULL DEFAULT 15,
  min_hours         INT NOT NULL DEFAULT 2,
  price_per_hour    INT NOT NULL,
  has_grill         BOOLEAN DEFAULT TRUE,
  fuel_type         fuel_type DEFAULT 'carbon',
  has_fire_extinguisher BOOLEAN DEFAULT FALSE,
  flue_condition    TEXT,
  grill_verified    BOOLEAN DEFAULT FALSE,
  amenities         JSONB DEFAULT '[]',
  photos            TEXT[] DEFAULT '{}',
  house_rules       TEXT,
  allows_alcohol    BOOLEAN DEFAULT TRUE,
  allows_music      BOOLEAN DEFAULT TRUE,
  instant_booking   BOOLEAN DEFAULT TRUE,
  rating_avg        DECIMAL(3,2) DEFAULT 0,
  rating_count      INT DEFAULT 0,
  is_condo          BOOLEAN DEFAULT FALSE,
  condo_allows_commercial BOOLEAN,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_spaces_location ON spaces USING GIST(location);
CREATE INDEX idx_spaces_status   ON spaces(status);
CREATE INDEX idx_spaces_host     ON spaces(host_id);

CREATE OR REPLACE FUNCTION update_space_location()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.lng, NEW.lat), 4326);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_space_location
  BEFORE INSERT OR UPDATE OF lat, lng ON spaces
  FOR EACH ROW EXECUTE FUNCTION update_space_location();

-- PASO 6: Disponibilidad
CREATE TABLE space_availability (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id   UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time  TIME NOT NULL,
  close_time TIME NOT NULL,
  UNIQUE (space_id, day_of_week)
);

CREATE TABLE space_blocked_dates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id   UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason     TEXT,
  UNIQUE (space_id, blocked_date)
);

-- PASO 7: Reservas
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id        UUID NOT NULL REFERENCES spaces(id),
  guest_id        UUID NOT NULL REFERENCES profiles(id),
  host_id         UUID NOT NULL REFERENCES profiles(id),
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  total_hours     DECIMAL(4,1) NOT NULL,
  price_per_hour  INT NOT NULL,
  subtotal        INT NOT NULL,
  platform_fee    INT NOT NULL,
  total_charged   INT NOT NULL,
  host_payout     INT NOT NULL,
  status          booking_status DEFAULT 'pending',
  guest_count     INT NOT NULL DEFAULT 1,
  special_requests TEXT,
  mp_preference_id TEXT,
  mp_payment_id    TEXT UNIQUE,
  mp_disbursement_id TEXT,
  payment_status   payment_status DEFAULT 'pending',
  payment_released_at TIMESTAMPTZ,
  cancellation_deadline TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para calcular cancellation_deadline automáticamente
CREATE OR REPLACE FUNCTION set_cancellation_deadline()
RETURNS TRIGGER AS $$
BEGIN
  NEW.cancellation_deadline = (NEW.date + NEW.start_time) - INTERVAL '24 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_booking_cancellation_deadline
  BEFORE INSERT OR UPDATE OF date, start_time ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_cancellation_deadline();

CREATE INDEX idx_bookings_space   ON bookings(space_id);
CREATE INDEX idx_bookings_guest   ON bookings(guest_id);
CREATE INDEX idx_bookings_host    ON bookings(host_id);
CREATE INDEX idx_bookings_date    ON bookings(date);
CREATE INDEX idx_bookings_status  ON bookings(status);
CREATE INDEX idx_bookings_mp_payment ON bookings(mp_payment_id);

-- PASO 8: Reviews
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL UNIQUE REFERENCES bookings(id),
  reviewer_id  UUID NOT NULL REFERENCES profiles(id),
  reviewed_id  UUID NOT NULL REFERENCES profiles(id),
  space_id     UUID REFERENCES spaces(id),
  rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  is_host_reviewing BOOLEAN NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE OR REPLACE FUNCTION update_space_rating()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT NEW.is_host_reviewing THEN
    UPDATE spaces
    SET rating_avg   = (SELECT AVG(rating)   FROM reviews WHERE space_id = NEW.space_id AND NOT is_host_reviewing),
        rating_count = (SELECT COUNT(*)       FROM reviews WHERE space_id = NEW.space_id AND NOT is_host_reviewing)
    WHERE id = NEW.space_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_space_rating
  AFTER INSERT ON reviews
  FOR EACH ROW EXECUTE FUNCTION update_space_rating();

-- PASO 9: Notification log
CREATE TABLE notification_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID REFERENCES bookings(id),
  recipient_id UUID REFERENCES profiles(id),
  channel      TEXT NOT NULL,
  template     TEXT NOT NULL,
  status       TEXT DEFAULT 'sent',
  external_id  TEXT,
  error        TEXT,
  sent_at      TIMESTAMPTZ DEFAULT NOW()
);

-- PASO 10: Row Level Security
ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces                ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_availability    ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_blocked_dates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log      ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own"  ON profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE  USING (auth.uid() = id);
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "profiles_insert_own"  ON profiles FOR INSERT  WITH CHECK (auth.uid() = id);

CREATE POLICY "spaces_select_active"  ON spaces FOR SELECT  USING (status = 'active' OR host_id = auth.uid());
CREATE POLICY "spaces_insert_own"     ON spaces FOR INSERT  WITH CHECK (host_id = auth.uid());
CREATE POLICY "spaces_update_own"     ON spaces FOR UPDATE  USING (host_id = auth.uid());
CREATE POLICY "spaces_delete_own"     ON spaces FOR DELETE  USING (host_id = auth.uid());

CREATE POLICY "availability_select"  ON space_availability FOR SELECT  USING (TRUE);
CREATE POLICY "availability_modify"  ON space_availability FOR ALL     USING (
  space_id IN (SELECT id FROM spaces WHERE host_id = auth.uid())
);

CREATE POLICY "blocked_dates_select" ON space_blocked_dates FOR SELECT USING (TRUE);
CREATE POLICY "blocked_dates_modify" ON space_blocked_dates FOR ALL    USING (
  space_id IN (SELECT id FROM spaces WHERE host_id = auth.uid())
);

CREATE POLICY "bookings_select_own"  ON bookings FOR SELECT  USING (guest_id = auth.uid() OR host_id = auth.uid());
CREATE POLICY "bookings_insert_guest" ON bookings FOR INSERT  WITH CHECK (guest_id = auth.uid());
CREATE POLICY "bookings_update_own"  ON bookings FOR UPDATE  USING (guest_id = auth.uid() OR host_id = auth.uid());

CREATE POLICY "reviews_select"       ON reviews FOR SELECT  USING (TRUE);
CREATE POLICY "reviews_insert_own"   ON reviews FOR INSERT  WITH CHECK (reviewer_id = auth.uid());

-- PASO 11: Función de búsqueda geoespacial
CREATE OR REPLACE FUNCTION search_spaces_nearby(
  search_lat   DECIMAL,
  search_lng   DECIMAL,
  radius_m     INT DEFAULT 5000,
  min_capacity INT DEFAULT 1,
  max_price    INT DEFAULT NULL,
  check_date   DATE DEFAULT NULL
)
RETURNS TABLE (
  id              UUID,
  title           TEXT,
  address         TEXT,
  neighborhood    TEXT,
  lat             DECIMAL,
  lng             DECIMAL,
  price_per_hour  INT,
  max_guests      INT,
  rating_avg      DECIMAL,
  rating_count    INT,
  photos          TEXT[],
  distance_m      FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.title, s.address, s.neighborhood,
    s.lat, s.lng, s.price_per_hour, s.max_guests,
    s.rating_avg, s.rating_count, s.photos,
    ST_Distance(s.location::GEOGRAPHY, ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::GEOGRAPHY) AS distance_m
  FROM spaces s
  WHERE s.status = 'active'
    AND s.max_guests >= min_capacity
    AND (max_price IS NULL OR s.price_per_hour <= max_price)
    AND ST_DWithin(
      s.location::GEOGRAPHY,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::GEOGRAPHY,
      radius_m
    )
    AND (check_date IS NULL OR check_date NOT IN (
      SELECT blocked_date FROM space_blocked_dates WHERE space_id = s.id
    ))
    AND (check_date IS NULL OR NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.space_id = s.id
        AND b.date = check_date
        AND b.status IN ('paid', 'confirmed')
    ))
  ORDER BY distance_m ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
