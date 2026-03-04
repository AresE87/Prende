-- ============================================================
-- PRENDE · Migration 001 · Schema inicial
-- ============================================================
-- Ejecutar con: supabase db push
-- ============================================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- para búsqueda por distancia

-- ─── ENUM TYPES ─────────────────────────────────────────────
CREATE TYPE space_status    AS ENUM ('draft', 'active', 'paused', 'deleted');
CREATE TYPE booking_status  AS ENUM ('pending', 'paid', 'confirmed', 'completed', 'cancelled', 'refunded');
CREATE TYPE payment_status  AS ENUM ('pending', 'approved', 'rejected', 'refunded', 'in_mediation', 'released');
CREATE TYPE fuel_type       AS ENUM ('carbon', 'lena', 'gas', 'electrica');

-- ─── PROFILES ───────────────────────────────────────────────
-- Extiende auth.users de Supabase con datos del negocio
CREATE TABLE profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL,
  phone           TEXT,                        -- +598XXXXXXXX
  avatar_url      TEXT,
  cedula          TEXT UNIQUE,                 -- para verificación de identidad
  cedula_verified BOOLEAN DEFAULT FALSE,
  mp_account_id   TEXT,                        -- MP user ID del host para transfers
  is_host         BOOLEAN DEFAULT FALSE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── SPACES ─────────────────────────────────────────────────
CREATE TABLE spaces (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title             TEXT NOT NULL,
  description       TEXT,
  status            space_status DEFAULT 'draft',

  -- Ubicación
  address           TEXT NOT NULL,
  neighborhood      TEXT,                      -- Pocitos, Malvín, Cordón, etc.
  city              TEXT DEFAULT 'Montevideo',
  lat               DECIMAL(10, 8) NOT NULL,
  lng               DECIMAL(11, 8) NOT NULL,
  location          GEOGRAPHY(POINT, 4326),    -- postgis para búsqueda por radio

  -- Capacidad y características
  max_guests        INT NOT NULL DEFAULT 15,
  min_hours         INT NOT NULL DEFAULT 2,
  price_per_hour    INT NOT NULL,              -- en UYU, entero

  -- Parrilla
  has_grill         BOOLEAN DEFAULT TRUE,
  fuel_type         fuel_type DEFAULT 'carbon',
  has_fire_extinguisher BOOLEAN DEFAULT FALSE,
  flue_condition    TEXT,                      -- descripción del tiraje
  grill_verified    BOOLEAN DEFAULT FALSE,     -- verificado por Prende

  -- Amenities (jsonb para flexibilidad)
  amenities         JSONB DEFAULT '[]',        -- ["estacionamiento","baño","cocina","wifi"]

  -- Imágenes (max 12)
  photos            TEXT[] DEFAULT '{}',       -- URLs de Supabase Storage

  -- Reglas
  house_rules       TEXT,
  allows_alcohol    BOOLEAN DEFAULT TRUE,
  allows_music      BOOLEAN DEFAULT TRUE,
  instant_booking   BOOLEAN DEFAULT TRUE,

  -- Reputación
  rating_avg        DECIMAL(3,2) DEFAULT 0,
  rating_count      INT DEFAULT 0,

  -- Régimen de copropiedad horizontal
  is_condo          BOOLEAN DEFAULT FALSE,     -- está en un edificio
  condo_allows_commercial BOOLEAN,             -- reglamento permite uso comercial

  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Índice geoespacial para búsqueda por radio
CREATE INDEX idx_spaces_location ON spaces USING GIST(location);
CREATE INDEX idx_spaces_status   ON spaces(status);
CREATE INDEX idx_spaces_host     ON spaces(host_id);

-- Trigger para actualizar location a partir de lat/lng
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

-- ─── SPACE AVAILABILITY ─────────────────────────────────────
-- Bloques de disponibilidad semanal del host
CREATE TABLE space_availability (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id   UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo
  open_time  TIME NOT NULL,
  close_time TIME NOT NULL,
  UNIQUE (space_id, day_of_week)
);

-- Fechas bloqueadas específicas (vacaciones, eventos propios)
CREATE TABLE space_blocked_dates (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id   UUID NOT NULL REFERENCES spaces(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason     TEXT,
  UNIQUE (space_id, blocked_date)
);

-- ─── BOOKINGS ───────────────────────────────────────────────
CREATE TABLE bookings (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  space_id        UUID NOT NULL REFERENCES spaces(id),
  guest_id        UUID NOT NULL REFERENCES profiles(id),
  host_id         UUID NOT NULL REFERENCES profiles(id),

  -- Tiempo
  date            DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NOT NULL,
  total_hours     DECIMAL(4,1) NOT NULL,

  -- Precios (snapshot al momento de reserva, en UYU)
  price_per_hour  INT NOT NULL,
  subtotal        INT NOT NULL,          -- price_per_hour × total_hours
  platform_fee    INT NOT NULL,          -- subtotal × take_rate (15%)
  total_charged   INT NOT NULL,          -- subtotal + platform_fee (lo que paga el guest)
  host_payout     INT NOT NULL,          -- subtotal × (1 - take_rate) = 85%

  -- Estado
  status          booking_status DEFAULT 'pending',
  guest_count     INT NOT NULL DEFAULT 1,
  special_requests TEXT,

  -- MercadoPago
  mp_preference_id TEXT,                 -- ID de la preferencia creada
  mp_payment_id    TEXT UNIQUE,          -- ID del pago aprobado
  mp_disbursement_id TEXT,              -- ID de la transferencia al host
  payment_status   payment_status DEFAULT 'pending',
  payment_released_at TIMESTAMPTZ,       -- cuando se liberó al host

  -- Política de cancelación
  cancellation_deadline TIMESTAMPTZ GENERATED ALWAYS AS
    ((date + start_time)::TIMESTAMPTZ - INTERVAL '24 hours') STORED,

  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_space   ON bookings(space_id);
CREATE INDEX idx_bookings_guest   ON bookings(guest_id);
CREATE INDEX idx_bookings_host    ON bookings(host_id);
CREATE INDEX idx_bookings_date    ON bookings(date);
CREATE INDEX idx_bookings_status  ON bookings(status);
CREATE INDEX idx_bookings_mp_payment ON bookings(mp_payment_id);

-- ─── REVIEWS ────────────────────────────────────────────────
CREATE TABLE reviews (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID NOT NULL UNIQUE REFERENCES bookings(id),
  reviewer_id  UUID NOT NULL REFERENCES profiles(id),
  reviewed_id  UUID NOT NULL REFERENCES profiles(id),  -- puede ser host o guest
  space_id     UUID REFERENCES spaces(id),
  rating       INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  is_host_reviewing BOOLEAN NOT NULL,  -- true=host→guest, false=guest→host/space
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para actualizar rating promedio del space
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

-- ─── NOTIFICATIONS LOG ──────────────────────────────────────
CREATE TABLE notification_log (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id   UUID REFERENCES bookings(id),
  recipient_id UUID REFERENCES profiles(id),
  channel      TEXT NOT NULL,           -- 'whatsapp' | 'email'
  template     TEXT NOT NULL,           -- nombre del template
  status       TEXT DEFAULT 'sent',     -- 'sent' | 'failed' | 'delivered'
  external_id  TEXT,                    -- ID del mensaje en 360dialog/Resend
  error        TEXT,
  sent_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ─── ROW LEVEL SECURITY ─────────────────────────────────────

ALTER TABLE profiles              ENABLE ROW LEVEL SECURITY;
ALTER TABLE spaces                ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_availability    ENABLE ROW LEVEL SECURITY;
ALTER TABLE space_blocked_dates   ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews               ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log      ENABLE ROW LEVEL SECURITY;

-- Profiles: cada usuario ve y edita solo su perfil
CREATE POLICY "profiles_select_own"  ON profiles FOR SELECT  USING (auth.uid() = id);
CREATE POLICY "profiles_update_own"  ON profiles FOR UPDATE  USING (auth.uid() = id);
-- Perfiles públicos para que guests vean info básica del host
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (TRUE);

-- Spaces: cualquiera puede ver espacios activos; solo el host edita los suyos
CREATE POLICY "spaces_select_active"  ON spaces FOR SELECT  USING (status = 'active' OR host_id = auth.uid());
CREATE POLICY "spaces_insert_own"     ON spaces FOR INSERT  WITH CHECK (host_id = auth.uid());
CREATE POLICY "spaces_update_own"     ON spaces FOR UPDATE  USING (host_id = auth.uid());
CREATE POLICY "spaces_delete_own"     ON spaces FOR DELETE  USING (host_id = auth.uid());

-- Space availability: público para lectura, solo host edita
CREATE POLICY "availability_select"  ON space_availability FOR SELECT  USING (TRUE);
CREATE POLICY "availability_modify"  ON space_availability FOR ALL     USING (
  space_id IN (SELECT id FROM spaces WHERE host_id = auth.uid())
);

-- Bookings: guest y host ven sus reservas
CREATE POLICY "bookings_select_own"  ON bookings FOR SELECT  USING (guest_id = auth.uid() OR host_id = auth.uid());
CREATE POLICY "bookings_insert_guest" ON bookings FOR INSERT  WITH CHECK (guest_id = auth.uid());
CREATE POLICY "bookings_update_own"  ON bookings FOR UPDATE  USING (guest_id = auth.uid() OR host_id = auth.uid());

-- Reviews: públicas para lectura
CREATE POLICY "reviews_select"       ON reviews FOR SELECT  USING (TRUE);
CREATE POLICY "reviews_insert_own"   ON reviews FOR INSERT  WITH CHECK (reviewer_id = auth.uid());

-- ─── FUNCTIONS ──────────────────────────────────────────────

-- Buscar espacios por radio (en metros)
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
    -- Excluir fechas bloqueadas si se proporciona una fecha
    AND (check_date IS NULL OR check_date NOT IN (
      SELECT blocked_date FROM space_blocked_dates WHERE space_id = s.id
    ))
    -- Excluir espacios ya reservados en esa fecha
    AND (check_date IS NULL OR NOT EXISTS (
      SELECT 1 FROM bookings b
      WHERE b.space_id = s.id
        AND b.date = check_date
        AND b.status IN ('paid', 'confirmed')
    ))
  ORDER BY distance_m ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
