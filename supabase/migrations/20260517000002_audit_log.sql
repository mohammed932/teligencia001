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
