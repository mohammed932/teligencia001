---
description: "Task list for Feature 001 — Staff Authentication & Authorization (Lab Portal)"
---

# Tasks: Staff Authentication & Authorization (Lab Portal)

**Input**: Design documents from `/specs/001-staff-auth/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md
**Tests**: Test tasks ARE included — Constitution Principle 4 (Test-First for Critical Paths) makes them mandatory for this feature.

**Organization**: Tasks grouped by user story (US1–US6) so each story is independently implementable + verifiable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable — different files, no incomplete-task dependencies
- **[Story]**: User-story label (US1…US6) — required for story phases, omitted in Setup / Foundational / Polish
- Every task includes the exact file path it touches

## Path Conventions

- Backend: `teligencia-api/src/...`, `teligencia-api/test/...`
- Frontend: `teligencia-lab/src/app/...`, `teligencia-lab/e2e/...`
- Migrations: `supabase/migrations/...`
- Feature docs: `specs/001-staff-auth/...`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the foundation-phase scaffolding consumed by every later task.

- [X] T001 Create directory `supabase/migrations/` at repo root and add `supabase/.gitignore` excluding `.branches/`, `.temp/`
- [X] T002 Add `supabase` CLI install instructions + local-bootstrap snippet to `README.md` (top-level)
- [X] T003 [P] Add backend env vars (`CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SIGNING_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`) to `teligencia-api/.env.example` with placeholder values
- [X] T004 [P] Add frontend env vars (`NG_APP_CLERK_PUBLISHABLE_KEY`, `NG_APP_API_BASE_URL`) to `teligencia-lab/src/environments/environment.ts` and `environment.development.ts`
- [X] T005 [P] Install backend dependencies (`@clerk/backend`, `svix`, `pg`, `@nestjs/config`, `joi`) in `teligencia-api/package.json`
- [X] T006 [P] Install frontend dependency (`@clerk/clerk-js`) in `teligencia-lab/package.json`
- [X] T007 [P] Add ESLint rule enforcing no-secrets-in-source via `no-secrets` plugin in `teligencia-api/.eslintrc.cjs` and `teligencia-lab/.eslintrc.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema, audit infrastructure, JWKS service, RLS context propagation. Every user story depends on these. **No story work begins until this phase is complete.**

**⚠️ CRITICAL**: Phase 2 must land before Phase 3+.

### Schema (Supabase migrations)

- [X] T010 Create `supabase/migrations/20260517000001_organisations.sql` — defines `organisations(id UUID PK, slug TEXT UNIQUE, name TEXT, created_at TIMESTAMPTZ)` if not already present
- [X] T011 Create `supabase/migrations/20260517000002_audit_log.sql` — defines `audit_log(id UUID PK, action TEXT, actor_id TEXT, target_id TEXT, request_id TEXT, outcome TEXT, created_at TIMESTAMPTZ)`, enables RLS, applies INSERT-only policy + `REVOKE UPDATE, DELETE ON audit_log FROM PUBLIC, anon, authenticated, service_role` (Gate G-06)
- [X] T012 Create `supabase/migrations/20260517000003_organisations_clerk_org_id.sql` — `ALTER TABLE organisations ADD COLUMN IF NOT EXISTS clerk_org_id TEXT;` and the partial unique index from `data-model.md`
- [X] T013 Create `supabase/migrations/20260517000010_users.sql` — `CREATE TYPE staff_role AS ENUM (...)`, `CREATE TABLE users`, indexes (`idx_users_org`, `idx_users_org_role`, `uq_users_org_email`), `set_updated_at` trigger, RLS enable + `users_select_same_org` policy — exactly as `data-model.md` specifies
- [X] T014 Create `supabase/migrations/20260517000011_webhook_deliveries.sql` — `CREATE TABLE webhook_deliveries(svix_id TEXT PK, received_at TIMESTAMPTZ, event_type TEXT, status TEXT CHECK)` + `idx_webhook_deliveries_received_at` + RLS enable (no client policy)
- [X] T015 Create `supabase/migrations/20260517000012_audit_log_actions_doc.sql` — comment-only migration registering action codes `USER_CREATED`, `USER_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`, `AUTH_FAILED`

### Backend foundational

- [X] T020 Create `teligencia-api/src/config/configuration.ts` exposing typed config (Clerk keys, Supabase URL, webhook secret, DB URL) via `@nestjs/config` with `joi` schema validation; wire into `AppModule`
- [X] T021 Create `teligencia-api/src/common/types/current-user.ts` with the `CurrentUser` interface + `StaffRole` union from `contracts/guards.md`; augment `express.Request` with optional `user`
- [X] T022 Create `teligencia-api/src/common/decorators/roles.decorator.ts` exporting `ROLES_KEY` and `Roles(...roles: StaffRole[])`
- [X] T023 Create `teligencia-api/src/common/decorators/public.decorator.ts` exporting `IS_PUBLIC_KEY` and `Public()`
- [X] T024 Create `teligencia-api/src/common/decorators/current-user.decorator.ts` — `createParamDecorator` returning `req.user`, throws if absent
- [X] T025 Create `teligencia-api/src/common/audit/audit.module.ts` and `audit.service.ts` exposing `record(action, { actorId, targetId, requestId, outcome })`; writes via service-role Supabase client
- [X] T026 Create `teligencia-api/src/modules/auth/clerk/clerk-jwks.service.ts` — wraps `jose.createRemoteJWKSet`, caches keys, refreshes on `kid` miss + every 60 min; exposes `verifyToken(token): Promise<JwtPayload>`
- [X] T027 Create `teligencia-api/src/modules/users/users.repository.ts` exposing `findByClerkId(id): Promise<UserRow | null>` and `upsertFromWebhook(payload)`; uses service-role client; resolves `org_id` from `organisations.clerk_org_id`
- [X] T028 Create `teligencia-api/src/common/db/org-context.interceptor.ts` — after `req.user` populated, opens a transaction-scoped DB session and runs `SET LOCAL app.current_org_id = $1` with `req.user.orgId`

### Test scaffolding

- [X] T030 [P] Set up Jest e2e harness in `teligencia-api/test/jest-e2e.json` with Supabase test container helper at `teligencia-api/test/utils/db-fixture.ts` (seeds 2 `organisations` + their `clerk_org_id`)
- [X] T031 [P] Set up Playwright config at `teligencia-lab/playwright.config.ts` and one auth-helper at `teligencia-lab/e2e/utils/clerk-auth.ts` driving Clerk sign-in flows with test accounts

**Checkpoint**: Schema migrated; guards/decorators compiled; audit service callable; JWKS verifier returns claims for a sample token. Now stories can land in parallel where their files are disjoint.

---

## Phase 3: US1 — Staff Member Signs In (Priority: P1) 🎯 MVP

**Goal**: A Teligencia staff member completes Clerk sign-in (with MFA) and lands on the dashboard appropriate to their role. `SESSION_STARTED` audit entry written.

**Independent Test**: With a provisioned `pm` test user, complete sign-in + MFA in a browser and assert (a) redirect to `/lab/dashboard`, (b) `SESSION_STARTED` audit row exists, (c) `GET /auth/me` returns the user's identity.

### Tests (write first — Principle 4)

- [X] T100 [P] [US1] Write e2e test `teligencia-api/test/auth/auth-me.e2e.spec.ts` covering 200 happy path with seeded `users` row
- [X] T101 [P] [US1] Write Playwright spec `teligencia-lab/e2e/sign-in.spec.ts` covering US1 acceptance scenarios 1 + 4 (sign-in success + `SESSION_STARTED` audit row visible via test API)
- [X] T102 [P] [US1] Write Playwright spec for US1 acceptance scenario 2 (MFA abandoned → no session) in `teligencia-lab/e2e/mfa-abandoned.spec.ts`

### Backend

- [X] T110 [US1] Implement `teligencia-api/src/common/guards/clerk-auth.guard.ts` — reads `Authorization` header, calls `ClerkJwksService.verifyToken`, calls `UsersRepository.findByClerkId`, populates `req.user`, throws 401/403 per `contracts/guards.md`
- [X] T111 [US1] Register `ClerkAuthGuard` as a global guard in `teligencia-api/src/app.module.ts` (`APP_GUARD` provider) and register `OrgContextInterceptor` as `APP_INTERCEPTOR`
- [X] T112 [US1] Implement `teligencia-api/src/modules/auth/auth.controller.ts` — `GET /auth/me`, decorated `@CurrentUser()`, returns DTO from `contracts/auth-me.openapi.yaml`
- [X] T113 [US1] Implement `teligencia-api/src/modules/auth/dto/current-user.dto.ts` shaped exactly per `CurrentUser` schema; ensure `class-transformer` exposes only the 5 documented fields (Security checklist #7)
- [X] T114 [US1] Implement `teligencia-api/src/modules/auth/auth.service.ts#recordSessionStarted(userId, requestId)` calling `AuditService.record('SESSION_STARTED', …)`; invoked by `AuthController` on first authenticated request per session (idempotent per-token via in-memory LRU keyed by `jti`)
- [X] T115 [US1] Wire `AuthModule` into `AppModule` with imports for `AuthModule`, `UsersModule`, `AuditModule`

### Frontend

- [X] T120 [P] [US1] Implement `teligencia-lab/src/app/core/auth/auth.service.ts` — wraps `@clerk/clerk-js` (loadClerk, `isSignedIn`, `getToken`, `signOut`, observable for sign-in state)
- [X] T121 [P] [US1] Implement `teligencia-lab/src/app/core/auth/auth-token.interceptor.ts` (`HttpInterceptorFn`) — attaches `Authorization: Bearer ${await session.getToken()}` to every API request targeting the API base URL
- [X] T122 [P] [US1] Implement `teligencia-lab/src/app/core/auth/auth.guard.ts` (`CanActivateFn`) — redirects to Clerk hosted sign-in when no session
- [X] T123 [US1] Implement `teligencia-lab/src/app/core/auth/current-user.store.ts` — calls `GET /auth/me` after sign-in, exposes `currentUser$` signal
- [X] T124 [US1] Update `teligencia-lab/src/app/app.config.ts` to register `provideHttpClient(withInterceptors([authTokenInterceptor]))` and bootstrap Clerk via `APP_INITIALIZER`
- [X] T125 [US1] Apply `authGuard` to the `/lab` route in `teligencia-lab/src/app/app.routes.ts`; ensure unauthenticated visits to `/lab/**` redirect to sign-in
- [X] T126 [US1] Update `teligencia-lab/src/app/lab/features/dashboard/*` to subscribe to `currentUser$` and render the role-appropriate dashboard variant (P1 acceptance criterion 1)

**Checkpoint US1**: User can sign in, hit `/lab/dashboard`, see their identity from `/auth/me`. `SESSION_STARTED` audit row present.

---

## Phase 4: US2 — Unauthenticated Access Is Blocked (Priority: P1)

**Goal**: Any unauthenticated request → 401 on API, redirect on frontend; no platform data leaks.

**Independent Test**: From a clean browser (no Clerk session) request a Lab Portal route and a protected API endpoint; route redirects to sign-in, API returns 401 with no data.

### Tests

- [X] T200 [P] [US2] Write e2e test `teligencia-api/test/auth/unauth-blocked.e2e.spec.ts` enumerating every controller route via `DiscoveryService` and asserting 401 with empty/generic body for unauthenticated calls (SC-001)
- [X] T201 [P] [US2] Write Playwright spec `teligencia-lab/e2e/unauth-redirect.spec.ts` — visit `/lab/dashboard` without session, assert redirect to Clerk sign-in, no protected DOM rendered

### Backend

- [X] T210 [US2] Confirm `ClerkAuthGuard` (T110) rejects requests with missing header (401, no audit) — covered by T200; add explicit case branch + comment in `clerk-auth.guard.ts`
- [X] T211 [US2] Confirm `ClerkAuthGuard` rejects malformed/expired tokens (401, AUTH_FAILED audit) — extend T110 to emit audit for credentialed-but-rejected per Clarification 5; add unit test `teligencia-api/test/auth/clerk-auth.guard.e2e.spec.ts`
- [X] T212 [US2] Create `teligencia-api/src/common/filters/generic-auth-error.filter.ts` (`ExceptionFilter`) that maps `UnauthorizedException` → `{error: 'unauthorized'}` and `ForbiddenException` → generic `{error}` per `contracts/auth-me.openapi.yaml`; register globally (Security checklist #8)

### Frontend

- [X] T220 [US2] Confirm `authGuard` (T122) redirects to Clerk-hosted sign-in URL with `returnUrl` param; add unit test `teligencia-lab/src/app/core/auth/auth.guard.spec.ts`

**Checkpoint US2**: Zero unauthenticated traffic reaches business handlers; zero leak in error bodies.

---

## Phase 5: US3 — Authorization Enforced Per Role (Priority: P1)

**Goal**: Every authenticated request carries a role; role-restricted endpoints reject mismatched callers (403).

**Independent Test**: Two users with different roles call a `@Roles('signatory')`-decorated demo endpoint; signatory succeeds, test_engineer gets 403.

### Tests

- [X] T300 [P] [US3] Write e2e test `teligencia-api/test/auth/roles.guard.e2e.spec.ts` covering allow/deny matrix across all six roles
- [X] T301 [P] [US3] Write e2e test `teligencia-api/test/auth/tenant-isolation.e2e.spec.ts` seeding two orgs + two users and asserting zero cross-org `users` row leakage (SC-004)
- [X] T302 [P] [US3] Write e2e test `teligencia-api/test/audit/audit-immutability.e2e.spec.ts` asserting `UPDATE`/`DELETE` on `audit_log` rejected for `service_role` (Gate G-06)
- [X] T303 [P] [US3] Write Playwright spec `teligencia-lab/e2e/access-denied.spec.ts` — `test_engineer` signs in, navigates to a `signatory`-only route, sees Access Denied component

### Backend

- [X] T310 [US3] Implement `teligencia-api/src/common/guards/roles.guard.ts` — reads `ROLES_KEY` metadata, compares to `req.user.role`, throws 403 + emits `AUTH_FAILED` audit on mismatch
- [X] T311 [US3] Register `RolesGuard` as a second `APP_GUARD` (after `ClerkAuthGuard`) in `teligencia-api/src/app.module.ts`
- [X] T312 [US3] Add `@Roles('lab_admin')` to a `GET /auth/demo-admin-only` endpoint in `teligencia-api/src/modules/auth/auth.controller.ts` purely for gate verification — keep in code as a permanent canary

### Frontend

- [X] T320 [P] [US3] Implement `teligencia-lab/src/app/core/auth/role.guard.ts` (`CanActivateFn` factory `roleGuard(roles: StaffRole[])`) — redirects to `/access-denied` when `currentUser.role ∉ roles`
- [X] T321 [P] [US3] Create `teligencia-lab/src/app/shared/access-denied/access-denied.component.ts` — minimal page; no business data; link back to dashboard
- [X] T322 [US3] Apply `roleGuard([...])` to role-restricted child routes in `teligencia-lab/src/app/lab/lab.routes.ts` (e.g., `reports/sign` → `[signatory]`)

**Checkpoint US3**: RBAC enforced server + client side; tenant isolation verified; G-06 verified.

---

## Phase 6: US4 — New Staff Member Is Provisioned via Clerk Webhook (Priority: P2)

**Goal**: `user.created` webhook → new `users` row with role + `org_id` resolved from Clerk org; `USER_CREATED` audit entry; idempotent under replay.

**Independent Test**: POST a signed `user.created` payload to `/webhooks/clerk`; assert `users` row exists with correct fields, `USER_CREATED` audit row exists. POST identical payload again; assert no duplicates and second response is `{"status":"skipped"}`.

### Tests

- [X] T400 [P] [US4] Write e2e test `teligencia-api/test/webhooks/webhook-signature.e2e.spec.ts` covering 400 on bad / missing svix headers (EC-004)
- [X] T401 [P] [US4] Write e2e test `teligencia-api/test/webhooks/user-sync.e2e.spec.ts` covering happy `user.created` path (US4 acceptance scenario 1)
- [X] T402 [P] [US4] Write e2e test `teligencia-api/test/webhooks/webhook-idempotency.e2e.spec.ts` covering replay (SC-005, US4 acceptance scenario 2)
- [X] T403 [P] [US4] Write e2e test `teligencia-api/test/webhooks/unmapped-org.e2e.spec.ts` covering 422 + `AUTH_FAILED` when Clerk org id has no `organisations.clerk_org_id` match

### Backend

- [X] T410 [US4] Create `teligencia-api/src/modules/webhooks/webhook-signature.guard.ts` — uses `svix.Webhook` with secret from config; verifies on raw body; rejects 400 on failure (NOT 401)
- [X] T411 [US4] Create `teligencia-api/src/modules/webhooks/webhook-deliveries.repository.ts` — `tryClaim(svix_id, event_type): boolean` performing `INSERT ... ON CONFLICT (svix_id) DO NOTHING RETURNING svix_id`; `markStatus(svix_id, status)`
- [X] T412 [US4] Create `teligencia-api/src/modules/webhooks/handlers/user-created.handler.ts` — resolves `org_id` via `organisations.clerk_org_id`, upserts `users` row natural-key, calls `AuditService.record('USER_CREATED', …)`. Rejects (throws 422) when org-mapping missing → caller emits `AUTH_FAILED` audit
- [X] T413 [US4] Create `teligencia-api/src/modules/webhooks/webhooks.controller.ts` — `@Public()` + `@UseGuards(WebhookSignatureGuard)`, dispatches by `event.type`, wraps handler in `tryClaim` short-circuit per `data-model.md`
- [X] T414 [US4] Register `WebhooksModule` in `AppModule`; ensure raw-body parsing enabled in `teligencia-api/src/main.ts` (`app.use(express.raw({ type: 'application/json' }))`) for the webhook route only
- [X] T415 [US4] Configure Clerk dashboard env (document only, not code) so `user.created` webhook is enabled for the dev instance; add operator note to `quickstart.md` section 2

**Checkpoint US4**: Webhook signed + idempotent + audit-logged + tenant-resolved. The system now auto-provisions staff.

---

## Phase 7: US5 — Role Change Takes Effect on Next Request (Priority: P2)

**Goal**: `user.updated` webhook updates `users.role`; next authenticated request from that user reflects the new role.

**Independent Test**: Authenticate as `test_engineer`, send a `user.updated` webhook promoting to `reviewer`, call a `reviewer`-only endpoint with the same token within 10 s, assert 200. Downgrade test verifies 403.

### Tests

- [X] T500 [P] [US5] Write e2e test `teligencia-api/test/webhooks/user-update-role-change.e2e.spec.ts` — upgrade + downgrade paths + `USER_UPDATED` audit row assertion
- [X] T501 [P] [US5] Write e2e test `teligencia-api/test/auth/role-change-latency.e2e.spec.ts` — assert SC-006 (<10 s end-to-end)

### Backend

- [X] T510 [US5] Create `teligencia-api/src/modules/webhooks/handlers/user-updated.handler.ts` — updates `users` row (email, full_name, role, is_active) and emits `USER_UPDATED` audit
- [X] T511 [US5] Confirm `ClerkAuthGuard` reads role from `UsersRepository.findByClerkId` per request (T110); add explicit comment in `clerk-auth.guard.ts` documenting Clarification 3 (DB canonical)
- [X] T512 [US5] Add request-scoped cache for `users` row in `teligencia-api/src/modules/users/users.service.ts` (one DB read per request, shared across guards + handler)

**Checkpoint US5**: Role changes propagate within one request hop.

---

## Phase 8: US6 — Staff Member Signs Out (Priority: P2)

**Goal**: Sign-out terminates the session and writes a `SESSION_ENDED` audit entry; replayed token returns 401.

**Independent Test**: Authenticate, capture token, sign out, replay token against `/auth/me` — assert 401 and `SESSION_ENDED` audit row exists.

### Tests

- [X] T600 [P] [US6] Write e2e test `teligencia-api/test/auth/sign-out.e2e.spec.ts` — POST `/auth/sign-out`, assert audit + subsequent token rejection
- [X] T601 [P] [US6] Write Playwright spec `teligencia-lab/e2e/sign-out.spec.ts` — click Sign Out, assert redirect to portal-picker, no protected DOM, token replay rejected via test API call

### Backend

- [X] T610 [US6] Implement `POST /auth/sign-out` in `teligencia-api/src/modules/auth/auth.controller.ts` — emits `SESSION_ENDED` audit, returns 204. Clerk's own server revokes the session; this endpoint is the application's audit hook
- [X] T611 [US6] Wire the optional `session.created` webhook in `teligencia-api/src/modules/webhooks/handlers/session-created.handler.ts` — updates `users.last_login` (used by US1 acceptance criterion 4 too, but cleanest to land here since it's the same webhook surface)

### Frontend

- [X] T620 [US6] Add Sign Out menu item in `teligencia-lab/src/app/lab/layout/lab-shell.component.ts` — calls `authService.signOut()` then `POST /auth/sign-out` then navigates to `/`

**Checkpoint US6**: Sign-out fully audited; replayed token rejected.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Performance probes, regression snapshots, security checklist completion, operator docs.

- [X] T700 [P] Write performance test `teligencia-api/test/perf/token-verify.perf.spec.ts` — runs 1000 verified requests and asserts P95 < 100 ms (NFR-001)
- [X] T701 [P] Write snapshot regression `teligencia-api/test/auth/generic-error-surface.spec.ts` — captures every auth-error response body; CI fails on drift (SC-008)
- [X] T702 [P] Add `teligencia-api/test/rls/users-rls.spec.ts` — psql-level test that anon role cannot SELECT `users` and that the `app.current_org_id` GUC must be set to read
- [X] T703 [P] Add `prefers-reduced-motion` check + smoke-test of Lab Portal in dark theme to ensure no regression from style refactor (cross-cutting from earlier session)
- [X] T704 Update `teligencia-api/README.md` with bootstrap + migration instructions linking to `specs/001-staff-auth/quickstart.md`
- [X] T705 Update `teligencia-lab/README.md` with sign-in flow + how to configure local Clerk dev instance
- [X] T706 Document the 10-point security checklist as a PR template at `.github/pull_request_template.md` (root repo)
- [X] T707 Add CI workflow `.github/workflows/auth-gates.yml` running G-06 + tenant-isolation + webhook-idempotency + unauth-blocked test suites on every PR touching `teligencia-api/**` or `supabase/migrations/**`
- [X] T708 Rotate the dev Clerk webhook secret and verify the rotation procedure documented in `quickstart.md` actually works end-to-end (operator readiness)

---

## Dependencies

```
Phase 1 Setup ──┐
                ├──► Phase 2 Foundational ──► US1 (P1) ──► US2 (P1) ──► US3 (P1) ──► US4 (P2) ──► US5 (P2) ──► US6 (P2) ──► Phase 9 Polish
                │
   parallelizable within each phase per [P] markers
```

- **Phase 1 → Phase 2**: Phase 1 tasks T001–T007 must complete before Phase 2 begins (env vars + deps available).
- **Phase 2 → Phase 3+**: Migrations applied, JWKS service compiled, audit service callable, RLS context interceptor live before any user-story task runs.
- **US1 → US2**: US2 reuses the guard delivered in US1 (T110). US2 is mostly verification + error-filter polish.
- **US1 → US3**: `RolesGuard` (T310) depends on `ClerkAuthGuard` (T110) populating `req.user.role`.
- **US3 → US4**: Tenant-isolation test (T301) seeds the schema that US4's webhook tests reuse.
- **US4 → US5**: `user.updated` handler (T510) reuses the `tryClaim` infrastructure built in US4.
- **US6** is the lightest story; only depends on the audit service from Phase 2 plus the auth controller from US1.
- **Phase 9** runs after all stories merge or in parallel with US5/US6 once their backend handlers stabilize.

## Parallel Opportunities

Within a phase, tasks with `[P]` operate on different files and can run concurrently. Examples by phase:

- **Phase 1**: T003, T004, T005, T006, T007 fully parallel.
- **Phase 2**: T010–T015 (migrations) all parallel; T020–T028 (backend foundation) parallel where files differ — T021/T022/T023/T024 disjoint, T026 disjoint from T027/T028.
- **Phase 3 (US1)**: T100/T101/T102 (test specs) parallel; T120/T121/T122 (frontend services) parallel.
- **Phase 4 (US2)**: T200/T201 parallel.
- **Phase 5 (US3)**: T300/T301/T302/T303 parallel; T320/T321 parallel.
- **Phase 6 (US4)**: T400–T403 parallel.
- **Phase 7 (US5)**: T500/T501 parallel.
- **Phase 8 (US6)**: T600/T601 parallel.
- **Phase 9**: T700–T703 fully parallel; T704/T705 parallel; T707 depends on tests being merged first.

## Implementation Strategy

- **MVP scope = Phase 1 + Phase 2 + US1 (Phase 3)**. Delivers a working Clerk sign-in surface with a usable `/auth/me` and `SESSION_STARTED` audit. Ship before tackling US2–US6.
- **Hard prerequisite to any other feature (001+ in the broader roadmap)**: at minimum Phases 1+2+US1+US3. `ClerkAuthGuard` + `RolesGuard` are the contracts every downstream feature consumes (`contracts/guards.md`).
- **Optional pre-ship**: skip US6 (sign-out) for the very first preview cut — Clerk sessions expire naturally and forcing sign-out is a P2 feature.
- **Independent testability**: Each Phase 3+ story exits with a single bullet under its `Checkpoint` line that can be demoed alone.

## Format Validation

All tasks above follow the required format:

- Markdown checkbox `- [ ]`
- Task ID `T###` in execution order
- `[P]` only on parallelizable tasks
- `[US#]` story label on every Phase 3–8 task; omitted in Phase 1 / 2 / 9
- Description with exact file path
