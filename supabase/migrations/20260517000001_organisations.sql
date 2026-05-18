-- Foundation migration — `organisations` table.
-- Referenced by Feature 001 (Staff Authentication & Authorization).
-- This migration is idempotent: it creates the table only if not already present
-- (allows the foundation phase to extend an existing schema cleanly).

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS organisations (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug       TEXT        NOT NULL UNIQUE,
  name       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shared updated_at trigger function (re-used by other tables).
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_organisations_set_updated_at ON organisations;
CREATE TRIGGER trg_organisations_set_updated_at
  BEFORE UPDATE ON organisations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Seed the single Teligencia lab tenant for local dev. Production data is
-- inserted by the operator runbook; this row is overwritten or ignored there.
INSERT INTO organisations (slug, name)
VALUES ('teligencia-lab', 'Teligencia Lab')
ON CONFLICT (slug) DO NOTHING;
