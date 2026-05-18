# Phase 1 — Data Model: Staff Authentication & Authorization

**Branch**: `001-staff-auth` · **Date**: 2026-05-17

This document is the source of truth for every table, type, index, RLS policy, and audit action introduced or referenced by Feature 000. Migrations in `supabase/migrations/` must match it exactly.

## Entity catalogue

| Entity | Storage | Owner | RLS | Notes |
|---|---|---|---|---|
| `organisations` | `public.organisations` | Foundation (precondition) | tenant-scoped SELECT | Referenced — adds `clerk_org_id` if not already present |
| `users` | `public.users` | **This feature** | tenant-scoped SELECT; no client INSERT/UPDATE | Mirrors Clerk staff |
| `webhook_deliveries` | `public.webhook_deliveries` | **This feature** | service-role only | Idempotency ledger |
| `audit_log` | `public.audit_log` | Foundation (precondition) | INSERT-only (G-06) | Receives 5 new actions |

## Types

```sql
-- Six fixed staff roles. Future roles require a constitutional amendment.
CREATE TYPE staff_role AS ENUM (
  'lab_admin',
  'pm',
  'test_engineer',
  'reviewer',
  'signatory',
  'quality_manager'
);

-- Webhook delivery processing status. CHECK constraint mirrors this list.
-- 'processed' = handler ran successfully.
-- 'skipped'   = duplicate svix_id; handler short-circuited.
-- 'failed'    = signature invalid OR org-mapping missing OR handler errored.
```

## Table — `organisations` (precondition)

Owned by the foundation phase. **This feature adds `clerk_org_id`** if it doesn't already exist; otherwise unchanged.

```sql
ALTER TABLE organisations
  ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS uq_organisations_clerk_org_id
  ON organisations(clerk_org_id)
  WHERE clerk_org_id IS NOT NULL;
```

**Rationale**: The webhook resolves the tenant by matching the Clerk-provided org id against `clerk_org_id`. A partial unique index allows pre-existing `organisations` rows (no Clerk binding yet) to coexist, while preventing any duplicate Clerk-org mapping once set.

## Table — `users`

```sql
CREATE TABLE users (
  id           TEXT       PRIMARY KEY,                     -- Clerk user id ("user_xxx"); natural key for idempotency
  org_id       UUID       NOT NULL REFERENCES organisations(id) ON DELETE RESTRICT,
  email        TEXT       NOT NULL,
  full_name    TEXT,
  role         staff_role,                                 -- NULL = not provisioned; rejected at the guard
  is_active    BOOLEAN    NOT NULL DEFAULT TRUE,
  last_login   TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX uq_users_org_email ON users(org_id, lower(email));
CREATE INDEX idx_users_org              ON users(org_id);
CREATE INDEX idx_users_org_role         ON users(org_id, role) WHERE role IS NOT NULL;

CREATE TRIGGER trg_users_set_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
```

### Field rules

- `id` — Clerk's `user_xxx` string. Natural primary key supports `INSERT ... ON CONFLICT (id) DO UPDATE` (idempotency layer 1).
- `org_id` — internal UUID. Resolved at provisioning time from Clerk org membership; NEVER set from client input (Constitution P3 + spec FR-019).
- `email` — case-insensitive uniqueness within an org via `uq_users_org_email`.
- `role` — `NULL` is the explicit "unprovisioned" sentinel. EC-002 treats `NULL` as 403 with the generic "account not fully provisioned" response.
- `last_login` — updated by `session.created` webhook handler; not blocking for sign-in success.

### State transitions

```
                       (Clerk user.created)
                           │
                           ▼
                  ┌────────────────────┐  (role assigned in Clerk later
        ┌─────────│  unprovisioned     │   via user.updated)
        │         │  role = NULL       │
        │         │  is_active = TRUE  │
        │         └────────┬───────────┘
        │                  │
        │ (role granted)   │
        ▼                  ▼
┌────────────────┐  ┌─────────────────────┐    (user.updated → role changed)
│  active        │◄─┤  active             │◄──┐
│  role NOT NULL │  │  role NOT NULL      │   │
│  is_active T   │  │  is_active TRUE     │   │
└──────┬─────────┘  └──────────┬──────────┘   │
       │                       │              │
       │ (user.deleted, OR     │ (role downgraded)
       │  admin deactivation)  │              │
       ▼                       └──────────────┘
┌────────────────┐
│  deactivated   │     (rehydrate via re-activation in Clerk)
│  is_active F   │
└────────────────┘
```

### RLS

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Staff can SELECT users within their own org. The GUC is set by the
-- NestJS layer after the Clerk token has been verified.
CREATE POLICY users_select_same_org ON users FOR SELECT
  USING (org_id = current_setting('app.current_org_id', true)::uuid);

-- NO client INSERT/UPDATE/DELETE policy. The webhook handler runs as
-- service_role (RLS bypass) and is the only write path.
```

## Table — `webhook_deliveries`

```sql
CREATE TABLE webhook_deliveries (
  svix_id      TEXT        PRIMARY KEY,                                 -- from Clerk's svix-id header
  received_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_type   TEXT        NOT NULL,                                    -- e.g., 'user.created'
  status       TEXT        NOT NULL CHECK (status IN ('processed','skipped','failed'))
);

CREATE INDEX idx_webhook_deliveries_received_at ON webhook_deliveries(received_at DESC);
```

### Idempotency contract

- Handler flow:
    1. Verify svix signature.
    2. `INSERT INTO webhook_deliveries (svix_id, event_type, status) VALUES ($1, $2, 'processed') ON CONFLICT (svix_id) DO NOTHING RETURNING svix_id`.
    3. If the RETURNING produced no row, the delivery is a replay → mark status `skipped` in-memory and return 200 without further side effects.
    4. Otherwise run the event handler (which performs the `users` upsert + audit write).
    5. On handler error, UPDATE the row status to `failed` and re-raise (Clerk retries).

### RLS

```sql
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- No client-facing policy. Only service_role (RLS bypass) writes/reads.
```

## Table — `audit_log` (precondition + new actions)

Owned by foundation. **This feature relies on G-06** and registers five new actions.

### New action codes consumed by this feature

| Action | Trigger | Actor | Target |
|---|---|---|---|
| `USER_CREATED` | webhook `user.created` accepted; new `users` row inserted | Clerk webhook (service identity) | `users.id` |
| `USER_UPDATED` | webhook `user.updated` accepted; existing row updated (role/email/active) | Clerk webhook (service identity) | `users.id` |
| `SESSION_STARTED` | First authenticated request after a Clerk sign-in (or `session.created` webhook, whichever lands first) | `users.id` | `users.id` |
| `SESSION_ENDED` | Sign-out — frontend signals backend; backend writes audit | `users.id` | `users.id` |
| `AUTH_FAILED` | Credentialed-but-rejected request: signature/exp/role check failed (NOT no-token probes — spec Clarification 5) | `users.id` (if claim parseable) or `unknown` | request id |

### G-06 enforcement

```sql
-- Append-only by privilege AND by policy.
REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC, anon, authenticated, service_role;

-- Belt-and-braces: a policy that prevents UPDATE/DELETE even if a future
-- migration accidentally re-grants the privilege.
DROP POLICY IF EXISTS audit_log_no_update ON audit_log;
CREATE POLICY audit_log_no_update ON audit_log FOR UPDATE USING (false);

DROP POLICY IF EXISTS audit_log_no_delete ON audit_log;
CREATE POLICY audit_log_no_delete ON audit_log FOR DELETE USING (false);
```

The quickstart `g06.test.ts` MUST verify both REVOKE and POLICY pathways.

## Field-level validation summary

| Surface | Rule | Source |
|---|---|---|
| `users.role` accepted values | enum `staff_role` (six values) | Spec FR-004 |
| `users.org_id` derivation | webhook → `organisations.clerk_org_id` lookup | Spec FR-013 + Clarification 2 |
| Email format | RFC 5322 validation in `class-validator` DTO before DB | Spec NFR-001 + best practice |
| Webhook `svix-id` | non-empty, UUID-shaped string; required header | spec FR-012 + Clarification 4 |
| Audit action codes | must match the table above | this document |

## Migration ordering

1. `20260517000001_organisations.sql` — only if `organisations` does not yet exist; otherwise no-op.
2. `20260517000002_audit_log.sql` — only if `audit_log` + G-06 not yet in place.
3. `20260517000003_organisations_clerk_org_id.sql` — adds `clerk_org_id` column + partial unique index.
4. `20260517000010_users.sql` — creates `staff_role` enum, `users` table, indexes, RLS policy.
5. `20260517000011_webhook_deliveries.sql` — creates `webhook_deliveries` table + index.
6. `20260517000012_audit_log_actions_doc.sql` — comment-only migration registering the five new action codes (for grep-ability; `audit_log.action` itself is `TEXT`).

Each migration is independently reversible (`DROP TABLE IF EXISTS` / `DROP TYPE IF EXISTS`); the foundation team retains responsibility for `audit_log` itself.
