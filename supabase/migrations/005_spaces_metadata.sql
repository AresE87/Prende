-- ============================================================
-- PRENDE · Migration 005 · Metadata JSONB en spaces
-- ============================================================
-- Almacena datos comerciales del onboarding (spaceType, hook,
-- weekendPrice, cancellationPolicy, segmentacion, etc.)

ALTER TABLE spaces ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

COMMENT ON COLUMN spaces.metadata IS 'Datos comerciales del onboarding: spaceType, hook, weekendPrice, cancellationPolicy, eventTypes, audiences, ambiences, etc.';
