-- Feature 001 — `users` table (staff mirror of Clerk identities).
-- See specs/001-staff-auth/data-model.md for the canonical definition.
-- RLS: SELECT scoped to current_setting('app.current_org_id'). The
-- NestJS layer sets this GUC after verifying the Clerk token; the GUC value
-- is sourced from `users.org_id`, NEVER from client input (Principle 3).

CREATE TYPE staff_role AS ENUM (
  'lab_admin',
  'pm',
  'test_engineer',
  'reviewer',
  'signatory',
  'quality_manager'
);

CREATE TABLE users (
  id          TEXT        PRIMARY KEY,                                   -- Clerk user id ("user_xxx")
  org_id      UUID        NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  email       TEXT        NOT NULL,
  full_name   TEXT,
  role        staff_role,                                                -- NULL = not provisioned; rejected by the auth guard (EC-002)
  is_active   BOOLEAN     NOT NULL DEFAULT TRUE,
  last_login  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_users_org_email
  ON users (org_id, lower(email));

CREATE INDEX idx_users_org
  ON users (org_id);

CREATE INDEX idx_users_org_role
  ON users (org_id, role)
  WHERE role IS NOT NULL;

CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tenant-scoped SELECT. The `true` second arg to current_setting() makes the
-- lookup return NULL (rather than error) when the GUC is unset, which forces
-- the comparison to fail and denies the read — safe default for misconfigured
-- request paths.
CREATE POLICY users_select_same_org ON users FOR SELECT
  USING (org_id = NULLIF(current_setting('app.current_org_id', true), '')::uuid);

-- NO client INSERT/UPDATE/DELETE policy. The webhook handler runs as
-- service_role (RLS bypass). All write paths are server-side, secret-gated,
-- and audit-logged.
GRANT SELECT, INSERT, UPDATE ON users TO service_role;
