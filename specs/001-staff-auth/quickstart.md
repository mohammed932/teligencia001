# Phase 1 — Quickstart & Gate Verification

**Branch**: `001-staff-auth` · **Date**: 2026-05-17

This is the runbook a developer (or CI) follows to (a) bring up the stack locally, (b) execute every gate verification test required by the constitution for this feature, and (c) prove SC-001…SC-008 before merge.

## Prerequisites

- Docker + Docker Compose
- Node.js 20 LTS
- `supabase` CLI (`brew install supabase/tap/supabase`)
- A Clerk dev instance with: 1 organization, 2 test staff users (one with role `pm`, one with role `signatory`), and webhooks pointed at `http://host.docker.internal:3000/webhooks/clerk` via `ngrok` or `cloudflared`
- `.env` populated with placeholders (NEVER commit):
    - `CLERK_PUBLISHABLE_KEY=`
    - `CLERK_SECRET_KEY=` (vault in prod)
    - `CLERK_WEBHOOK_SIGNING_SECRET=` (vault in prod)
    - `SUPABASE_URL=`
    - `SUPABASE_SERVICE_ROLE_KEY=` (vault in prod)
    - `DATABASE_URL=`

## 1 — Start the stack

```bash
# From repo root
supabase start                              # Local Supabase (PG + Studio at :54323)
supabase db reset                           # Applies every migration in supabase/migrations/

cd teligencia-api && npm install && npm run start:dev    # NestJS at :3000
cd teligencia-lab && npm install && npm start            # Angular at :4200
```

Expected:

- `supabase db reset` runs migrations `00001`-`00012` clean. The migration named `00012_audit_log_actions_doc.sql` is a comment-only registration of `USER_CREATED`, `USER_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`, `AUTH_FAILED`.
- NestJS boots and logs `Clerk JWKS cached (kid=...)` within 2 s.
- Angular renders the portal-picker; clicking "Lab Portal" redirects to Clerk sign-in.

## 2 — Seed `organisations.clerk_org_id`

```sql
-- psql or Studio SQL editor
UPDATE organisations
   SET clerk_org_id = 'org_<paste from Clerk dashboard>'
 WHERE slug = 'teligencia-lab';
```

Without this row, webhooks for users in the Clerk org will be rejected with 422 and `AUTH_FAILED` (research D2). This is intentional — it is the documented operator pre-step.

## 3 — Smoke test (manual)

| Step | Expected |
|---|---|
| Sign in as the `pm` test user with MFA | Land on `/lab/dashboard`; `users` row exists; `SESSION_STARTED` audit row written |
| `curl http://localhost:3000/auth/me` (no Authorization header) | `401 {"error":"unauthorized"}` |
| `curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/auth/me` | `200 { id, email, fullName, role:"pm", orgId }` |
| Click Sign Out in the Lab Portal | `SESSION_ENDED` audit row written; same Bearer token now returns 401 |

## 4 — Gate verification tests

Each test below maps to one Constitution gate or one Success Criterion. ALL must pass before merge.

### G-06 — `audit_log` immutability

```bash
cd teligencia-api && npm run test:e2e -- audit-immutability
```

Asserts:

- `UPDATE audit_log SET action = 'x'` fails as `service_role`.
- `DELETE FROM audit_log` fails as `service_role`.
- INSERT succeeds.

### P3 + SC-004 — Tenant isolation across `users`

```bash
npm run test:e2e -- tenant-isolation
```

Seeds two `organisations` rows + two `users` rows (one per org). Calls `GET /auth/me` with each user's token and asserts:

- User A's response never contains User B's row.
- A direct `SELECT * FROM users` from User A's request context (with `SET LOCAL app.current_org_id`) returns 1 row, not 2.

### SC-005 — Webhook idempotency under replay

```bash
npm run test:e2e -- webhook-idempotency
```

Sends a synthetic `user.created` event with a fixed `svix-id` twice (re-signed both times). Asserts:

- Exactly 1 `users` row exists for that Clerk user id.
- Exactly 1 `USER_CREATED` audit entry exists.
- The second response body is `{"status":"skipped"}`.
- `webhook_deliveries` contains exactly one row with `svix_id` = the fixed id.

### SC-001 — Unauth blocked

```bash
npm run test:e2e -- unauth-blocked
```

For every controller route registered in NestJS (introspected via the discovery service at test time): send an unauthenticated request and assert status is 401 (or 400 for the webhook signature path) and the body contains no PII / no row data.

### SC-003 — Zero MFA bypass

Playwright e2e (`teligencia-lab/e2e/sign-in.spec.ts`):

- Drive Clerk's hosted UI to the MFA prompt and **abandon** the second factor (close the modal).
- Attempt to load `/lab/dashboard`. Assert redirect to sign-in, no protected content rendered.

### SC-006 — Role change latency

```bash
npm run test:e2e -- role-change-latency
```

- POST a `user.updated` webhook downgrading a user's role from `signatory` to `test_engineer`.
- Within 10 s, call a signatory-only endpoint with the user's already-issued token.
- Assert response is `403`.

### SC-008 — Generic error surface

```bash
npm run test:e2e -- generic-error-surface
```

Snapshot every auth-error response body. Assert the snapshot contains only `{ "error": "<enum>" }` — no stack traces, role names, token detail, or factor names.

### SC-002 — Auth events captured (smoke)

After the manual smoke test in section 3, run:

```sql
SELECT action, COUNT(*) FROM audit_log
 WHERE action IN ('USER_CREATED','SESSION_STARTED','SESSION_ENDED')
 GROUP BY action;
```

Counts should match the expected actions from the smoke walk-through.

## 5 — 10-point security checklist (per-PR)

| # | Item | This feature |
|---|---|---|
| 1 | All DB queries filter by `org_id` | RLS on `users` (`org_id = current_setting('app.current_org_id')::uuid`) |
| 2 | Every service-layer mutation calls the audit logger | Webhook handlers + auth events |
| 3 | No secrets in code or Git | Clerk keys + webhook secret in `.env` (gitignored) / vault |
| 4 | SHA-256 file hashing server-side | N/A — no uploads |
| 5 | MIME validated by content | N/A |
| 6 | Every controller endpoint has a role guard | `ClerkAuthGuard` global; `@Roles()` on role-restricted endpoints; webhook explicitly `@Public()` |
| 7 | Customer-facing responses strip internal fields | `/auth/me` returns a 5-field DTO; webhook 200 body is `{status}` only |
| 8 | Generic error messages | `GenericError` schema across all auth responses |
| 9 | File storage paths include `org_id` prefix | N/A |
| 10 | Webhook signatures verified | svix verification before handler |

Mark each checked in the PR description. Unchecked items block merge per Constitution Article V.

## 6 — Performance probe (NFR-001)

After the feature is wired up:

```bash
npm run test:perf -- token-verify     # measures p95 over 1000 requests
```

Assert P95 < 100 ms for the `ClerkAuthGuard` + role lookup path.

## 6.5 — Secret rotation drill (T708, Rule 4)

Rehearse the Clerk webhook signing secret rotation before any production
incident forces it. Constitution Rule 4 treats secrets as compromised on
exposure — the drill verifies the rotation procedure actually works.

**Procedure (operator):**

1. **Generate** — in the Clerk dashboard, open the webhook endpoint and
   click **Roll signing secret**. Clerk briefly serves BOTH the old and
   the new secret during the overlap window (default 24 h).
2. **Stage** — set `CLERK_WEBHOOK_SIGNING_SECRET_NEXT` in the vault
   alongside the current `CLERK_WEBHOOK_SIGNING_SECRET`. The dual-secret
   support is documented at the `WebhookSignatureGuard`; if a future
   release adds it, the guard verifies against either secret during the
   overlap window. For the current release, deploy the new secret as
   `CLERK_WEBHOOK_SIGNING_SECRET` directly during a maintenance window.
3. **Deploy** — restart the API with the new env. `WebhookSignatureGuard`
   picks up the new secret on boot via `ConfigService`.
4. **Verify** — send a probe webhook from the Clerk dashboard ("Send test
   event"). Confirm:
    - HTTP 200 from `/webhooks/clerk` (signature accepted).
    - A new `webhook_deliveries` row.
    - No `AUTH_FAILED` audit entries for that `svix-id`.
5. **Retire** — revoke the old secret in the Clerk dashboard after the
   overlap window expires. Confirm no further deliveries arrive signed
   with the old secret (Clerk's webhook log).
6. **Document** — record the rotation date in the operator log. If a
   suspected leak triggered the rotation, also rotate
   `CLERK_SECRET_KEY` and the Supabase `service_role` JWT.

**Drill cadence**: quarterly, or immediately on any exposure.

## 7 — Done

When all of section 4 + 5 + 6 pass:

- `spec.md` Clarifications section is complete.
- `plan.md` Constitution Check is `PASS`.
- `tasks.md` (generated next via `/speckit.tasks`) is checked off.
- The PR description includes the 10-point checklist with explicit ✓ on each.

Then proceed to `/speckit.tasks`.
