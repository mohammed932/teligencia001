# Phase 0 — Research: Staff Authentication & Authorization

**Branch**: `001-staff-auth` · **Date**: 2026-05-17

The spec's Clarifications section already resolved the five highest-impact unknowns. This document captures those decisions plus best-practice notes for each external dependency and integration pattern, so Phase 1 design + downstream tasks can proceed without re-litigating choices.

## Decisions

### D1 — Session token verification strategy

- **Decision**: JWKS local verification. The NestJS backend caches Clerk's public keys (JWKS) and verifies the JWT signature offline on every request. The JWKS cache refreshes on `kid` miss or signature failure, and periodically (default: every 60 minutes).
- **Rationale**:
    - Meets NFR-001 (P95 token verification < 100 ms) — no synchronous Clerk callout on hot path.
    - Removes Clerk availability as a single point of failure for steady-state API traffic.
    - Reduces Clerk API quota consumption to webhook + JWKS-refresh only.
- **Alternatives considered**:
    - **`@clerk/backend` `verifyToken()` with default settings** — clean SDK ergonomics, but the synchronous remote-call mode breaches the 100 ms budget under any Clerk latency spike and creates a hard dependency on Clerk for every request.
    - **Hybrid (local + SDK fallback)** — would have added complexity without measurable gain since JWKS rotation is a rare event and a `kid` miss already triggers re-fetch.
- **Implementation note**: Use `@clerk/backend`'s `verifyToken()` in its JWKS-mode constructor (or `jose` with a Clerk JWKS endpoint) and an in-memory cache keyed by `kid`. Webhook signature verification (a separate concern) uses `svix` directly.

### D2 — `org_id` resolution on user provisioning

- **Decision**: Webhook handler derives `org_id` from Clerk org membership. The Clerk payload's `organization_id` is looked up in `organisations.clerk_org_id`; the matching row's internal UUID `org_id` is stored on the new `users` row. Webhooks for users with no matching `organisations.clerk_org_id` are rejected and an `AUTH_FAILED` audit entry is written.
- **Rationale**:
    - Aligns with Constitution Principle 3 (tenant isolation; no client-trusted org context).
    - Future-proofs the schema for Feature 008 (Customer Portal) which will add multiple `organisations` rows for manufacturers.
    - Avoids a hardcoded environment variable that would later require a data migration.
- **Alternatives considered**:
    - **Hardcoded `TELIGENCIA_LAB_ORG_ID` env var** — simplest path for single-tenant v1 but creates migration debt and breaks the moment Customer Portal lands.
    - **Hybrid (Clerk org if present, env fallback)** — invites the bug it's supposed to prevent: an unbound user inheriting the lab tenant.

### D3 — Request-time role source

- **Decision**: At every protected request, the auth guard loads the `users` row by Clerk user id and uses `users.role` and `users.org_id` from that row to populate the request context. The Clerk JWT's `publicMetadata.role` claim (if present) MUST NOT be trusted by the guard for authorization.
- **Rationale**:
    - The guard already needs a DB read to resolve `org_id` (the JWT only carries Clerk identifiers, not internal UUIDs), so reading `role` in the same SELECT is essentially free.
    - DB-canonical role reflects webhook-applied changes without waiting for the Clerk JWT TTL (typically 60 s).
    - Single source of truth at request time prevents drift between JWT claim and DB row.
- **Alternatives considered**:
    - **JWT claim only** — fastest, but role-change latency = JWT TTL, and the DB read for `org_id` is needed anyway.
    - **Hybrid with mismatch logging** — useful telemetry but introduces decision branches in the hot path.
- **Performance note**: Cache the `users` row per request scope (NestJS request-scoped provider) so multiple guards/handlers in the same request share one lookup. Combined with PG connection pooling, well within the 100 ms NFR.

### D4 — Webhook idempotency strategy

- **Decision**: Two complementary layers.
    - **Row layer**: `users` writes use natural-key upsert keyed on the Clerk user id (primary key) — `INSERT ... ON CONFLICT (id) DO UPDATE`.
    - **Event layer**: a `webhook_deliveries(svix_id PK, received_at, event_type, status)` ledger records every accepted delivery; the handler short-circuits with HTTP 200 if the `svix-id` header value already exists in the ledger.
- **Rationale**:
    - SC-005 demands **zero duplicate audit entries** under replay. Row-level upsert alone leaves audit writes free to fire repeatedly. The event ledger blocks the entire handler before any audit write.
    - `svix-id` is the only Clerk-provided identifier guaranteed unique per delivery; using it as PK gives DB-level guarantee.
    - Natural-key upsert on `users` remains the right tool for the underlying row (covers the race where the ledger insert and the user upsert interleave under concurrent processing).
- **Alternatives considered**:
    - **Natural key only** — fails SC-005.
    - **Event ledger only** — works, but losing the natural-key constraint on `users` removes a safety net against any non-webhook insertion path (e.g., manual reconciliation tools written later).

### D5 — `AUTH_FAILED` audit scope

- **Decision**: `AUTH_FAILED` audit entries are written ONLY for credentialed-but-rejected requests: a token was presented and failed signature verification, expiry check, or role/role-mapping. Requests with no `Authorization` header are still rejected with 401, but no audit entry is created.
- **Rationale**:
    - Internet-facing endpoints attract steady probe traffic. Auditing every 401 floods the immutable log with noise and degrades signal-to-noise for real security review.
    - "A token was presented and failed" is the actual security-meaningful event (compromised token, stale token, role downgrade collision).
    - Constitution Rule 1 / G-06 mandates immutability; we should keep the log lean precisely because we can't prune it.
- **Alternatives considered**:
    - **Every 401** — high noise, low signal.
    - **Clerk-emitted failed sign-in events via webhook** — relies on Clerk delivering them reliably and doesn't cover replayed-token attacks on the API directly.

## Best-Practice Notes

### NestJS guards + request context

- **Pattern**: `ClerkAuthGuard` is a global guard (registered in `AppModule`) so every endpoint is authenticated by default. Endpoints that should be public (only `/webhooks/clerk` in this feature) opt out via a custom `@Public()` decorator.
- **Request context**: Populate `req.user = { id, orgId, role, email }` inside the guard. Downstream code reads via a request-scoped provider (`CurrentUserService`) — never directly from headers. Implements FR-008.
- **RLS context**: After the guard sets `req.user`, an interceptor (`OrgContextInterceptor`) runs `SET LOCAL app.current_org_id = $1` on the same DB transaction the handler will use. The `users` repository owns this; downstream feature modules consume it transparently.

### Clerk integration

- **JWKS endpoint**: `https://<your-frontend-api>.clerk.accounts.dev/.well-known/jwks.json` (dev) / production equivalent. Cache with `jose`'s built-in `createRemoteJWKSet` (handles `kid` miss + rotation natively).
- **Webhook**: Use `svix` Node library. The Clerk dashboard provides a webhook signing secret; store in vault and load via `ConfigService`. Reject with 400 (not 401) on signature failure — 401 implies "auth required" which doesn't fit a webhook semantically.
- **Webhook payload version**: Clerk's user events carry `data.public_metadata.role` (snake_case) — map to `role` in the upsert. Clerk's `data.organization_memberships[0].organization.id` is the source for org resolution; fall back to `data.organization_id` for tooling that exposes it flat.

### Supabase RLS patterns

- **Auth context variable**: Use `app.current_org_id` (custom GUC, set per transaction) rather than `auth.jwt() ->> 'org_id'` because the NestJS backend doesn't run as a Postgres role authenticated via Supabase Auth — it sets the GUC after verifying the Clerk token.
- **`users` policies**: One SELECT policy filtering on `app.current_org_id`; NO insert/update/delete policy for non-service roles. Service-role bypasses RLS for webhook-driven upserts, which is constitutional because the service-role path is server-side, secret-gated, and audit-logged.
- **`audit_log` policy**: INSERT-only policy for the service role; no other policy. UPDATE / DELETE are revoked at the privilege level too (`REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC, service_role`).

### Angular auth

- **Token retrieval**: Use Clerk JS's `await Clerk.session.getToken({ template: 'default' })` per request rather than caching the token in app state — Clerk handles refresh internally and the cost is local.
- **Route guards**: Two guards — `authGuard` (CanActivate; redirect to Clerk sign-in if no session) and `roleGuard(roles[])` factory (CanActivate; shows access-denied component if `currentUser.role` not in allowed set).
- **Interceptor**: `HttpInterceptorFn` that attaches `Authorization: Bearer ${token}` to every request to the API base URL. Skip when the request target is the Clerk Frontend API itself.

### Webhook delivery ledger

- **Schema**: `webhook_deliveries(svix_id TEXT PRIMARY KEY, received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), event_type TEXT NOT NULL, status TEXT NOT NULL CHECK (status IN ('processed','skipped','failed')))`.
- **Retention**: Append-only; rotate via partition (monthly) after 12 months. Separate from `audit_log` because deliveries are infrastructure telemetry, not compliance events.

## Open Questions for Future Features (not blocking this plan)

- **Cross-org user reassignment** (currently no support; user is bound to one org for life): out of scope for Feature 000. Feature 008 (Customer Portal) will reopen this when it onboards customer orgs.
- **Service-account / API-key auth** (machine-to-machine calls into the API): future feature; this plan covers human staff only.
- **Hardware security key as second factor**: handled inside Clerk; no application-side change required.

## Phase 0 Exit Criteria — met

- All `NEEDS CLARIFICATION` from the spec resolved (5/5 via Clarifications session 2026-05-17).
- All external dependencies (Clerk, Supabase, svix) have a chosen integration pattern.
- All non-trivial integration patterns (JWKS caching, RLS context propagation, idempotency ledger, role source-of-truth) have a decision recorded.
- Proceed to Phase 1.
