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
-- Foundation migration — `audit_log` (append-only) and Gate G-06 enforcement.
-- Constitution Rule 1 / Article III: INSERT-only across every role, including
-- service_role. Belt-and-braces: privileges REVOKED at table level AND a row-level
-- policy that disallows UPDATE/DELETE even if a future migration accidentally
-- re-grants privileges.
--
-- Action codes consumed by Feature 001:
--   USER_CREATED, USER_UPDATED, SESSION_STARTED, SESSION_ENDED, AUTH_FAILED

CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  action      TEXT        NOT NULL,
  actor_id    TEXT,                                              -- nullable: AUTH_FAILED may have no parseable identity
  target_id   TEXT,
  request_id  TEXT,
  outcome     TEXT        NOT NULL DEFAULT 'ok',                 -- 'ok' | 'rejected' | 'error' — kept deliberately generic
  payload     JSONB,                                             -- small, NEVER includes tokens/secrets
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_action_created_at
  ON audit_log (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_created_at
  ON audit_log (actor_id, created_at DESC)
  WHERE actor_id IS NOT NULL;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Belt: revoke privileges at the table grant level.
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC;
REVOKE UPDATE, DELETE ON audit_log FROM anon;
REVOKE UPDATE, DELETE ON audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON audit_log FROM service_role;

-- Braces: even if a future migration accidentally re-grants UPDATE/DELETE,
-- these row-level policies still deny everything.
DROP POLICY IF EXISTS audit_log_no_update ON audit_log;
CREATE POLICY audit_log_no_update ON audit_log FOR UPDATE USING (false);

DROP POLICY IF EXISTS audit_log_no_delete ON audit_log;
CREATE POLICY audit_log_no_delete ON audit_log FOR DELETE USING (false);

-- service_role can INSERT (RLS-bypass + explicit grant).
GRANT INSERT ON audit_log TO service_role;
-- service_role can SELECT for application read paths (quality_manager dashboards).
-- Read access from other roles is gated by the auth guard + downstream policies.
GRANT SELECT ON audit_log TO service_role;
-- Feature 001 — add Clerk organisation mapping to `organisations`.
-- The Clerk webhook resolves the tenant by looking up the Clerk-provided
-- `organization_id` against `organisations.clerk_org_id`. A partial unique
-- index allows pre-existing rows (no Clerk binding yet) to coexist while
-- preventing duplicate mappings once set.

ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_organisations_clerk_org_id
  ON organisations (clerk_org_id)
  WHERE clerk_org_id IS NOT NULL;
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
-- Feature 001 — `webhook_deliveries` idempotency ledger.
-- Primary key = Clerk's `svix-id` header. Used to short-circuit replayed
-- webhook deliveries before any side effects (row writes, audit entries).
-- See data-model.md and research D4.

CREATE TABLE webhook_deliveries (
  svix_id      TEXT        PRIMARY KEY,
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type   TEXT        NOT NULL,
  status       TEXT        NOT NULL CHECK (status IN ('processed', 'skipped', 'failed'))
);

CREATE INDEX idx_webhook_deliveries_received_at
  ON webhook_deliveries (received_at DESC);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;
-- No client policy. service_role only (RLS bypass).
GRANT SELECT, INSERT, UPDATE ON webhook_deliveries TO service_role;
-- Feature 001 — comment-only registration of audit action codes consumed by
-- this feature. `audit_log.action` is a free-form TEXT column, so this
-- migration adds nothing structural — it exists for grep-ability and to
-- create a single canonical document of which actions Feature 001 owns.
--
-- Action          Trigger                                                  Actor
-- ---------------  -------------------------------------------------------  --------------
-- USER_CREATED     Clerk webhook user.created accepted (new users row)      Clerk webhook
-- USER_UPDATED     Clerk webhook user.updated accepted (row updated)        Clerk webhook
-- SESSION_STARTED  First authenticated request after Clerk sign-in          users.id
-- SESSION_ENDED    Sign-out — frontend signals POST /api/v1/auth/sign-out   users.id
-- AUTH_FAILED      Credentialed-but-rejected: token signature/exp/role bad  users.id or NULL
--
-- Spec Clarification 5: AUTH_FAILED is NOT emitted for missing-token
-- requests (probe / unauthenticated traffic). Missing-token requests are
-- rejected 401 silently.

COMMENT ON TABLE audit_log IS
  'Append-only audit log. Action codes documented in 20260517000012_audit_log_actions_doc.sql. INSERT-only across every role including service_role (Gate G-06).';

-- ============================================================
-- Feature 001 — seed Clerk-org mapping
-- ============================================================
UPDATE organisations
   SET clerk_org_id = 'org_3Drx3ydk0985sSP45ZuP7KQjLAy'
 WHERE slug = 'teligencia-lab';

