# Implementation Plan: Staff Authentication & Authorization (Lab Portal)

**Branch**: `001-staff-auth` | **Date**: 2026-05-17 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-staff-auth/spec.md`

## Summary

Foundation feature delivering Clerk-backed authentication with mandatory MFA, six-role authorization, append-only audit of auth events, and webhook-driven user synchronization. Delivers two reusable NestJS guards (`ClerkAuthGuard`, `RolesGuard`) consumed by every subsequent feature, an Angular auth guard + interceptor, the `users` / `webhook_deliveries` schemas with RLS, and the `audit_log` write-paths for `USER_CREATED`, `USER_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`, `AUTH_FAILED`. Verification of session tokens is local-only via cached JWKS; request-time role is sourced from the `users` table (DB canonical); webhook idempotency uses a `webhook_deliveries(svix_id PK)` ledger combined with natural-key upserts on `users`.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) on Node.js 20 LTS for backend; TypeScript 5.x on Angular 17 for frontend
**Primary Dependencies**:
- Backend: NestJS 10, `@clerk/backend` (JWKS verification + webhook signature), `@clerk/express` (optional), `svix` (webhook signature verification), `pg` / Supabase JS client, `class-validator`, `class-transformer`
- Frontend: Angular 17, `@clerk/clerk-js` (or `@clerk/angular` once stable), ng-zorro-antd, RxJS
- Database: PostgreSQL (managed via Supabase), `supabase` CLI for migrations
**Storage**: PostgreSQL (Supabase). Tables this feature owns: `users`, `webhook_deliveries`. Writes to: `audit_log`. References: `organisations`.
**Testing**:
- Backend: Jest unit, Jest + Supertest e2e (NestJS testing module), Pact-style contract tests for `/auth/me` + `/webhooks/clerk`
- Frontend: Karma + Jasmine unit, Playwright (or Cypress) e2e for sign-in / route-guard flows
- Security gates: dedicated RLS test suite (psql + service vs anon role), tenant-isolation suite with two seeded orgs, webhook replay/idempotency suite
**Target Platform**: Linux containers (Docker) for API + Angular; PostgreSQL 15 via Supabase; browser targets: evergreen Chromium / Firefox / Safari (Lab Portal is internal-staff facing)
**Project Type**: Web application — Angular frontend (`teligencia-lab/`) + NestJS backend (`teligencia-api/`) + Supabase migrations (foundation-level)
**Performance Goals**:
- P95 token verification < 100 ms (NFR-001) — achievable via local JWKS verification + role lookup over a connection pool, no synchronous Clerk callout on hot path
- P95 sign-in → dashboard render < 3 s
- P95 webhook processing < 2 s
**Constraints**:
- Constitution Rule 3 fixes the stack (Clerk MFA-mandatory; NestJS strict-mode + class-validator DTOs; Angular strict mode; Supabase PG + RLS + Storage + Vault; BullMQ + Redis available for async jobs)
- Constitution Rule 2 — every PR satisfies the 10-point security checklist
- Constitution Rule 1 / Gate G-06 — `audit_log` INSERT-only, no UPDATE/DELETE for any role including `service_role`
- Constitution Principle 3 — every domain query filters by `org_id`; org context comes from verified token, never client input
**Scale/Scope**:
- Initial scale: single Teligencia lab org, ~30 staff users, ~1,000 protected API requests/day per user (peak), <100 webhook events/day
- Audit-log growth: ~10–50 auth events/staff/day; designed to grow over years (append-only, partition-friendly)
- Lab portal is the only consumer this feature ships; Customer Portal (Feature 008) and Public Tools (009–012) will consume the same `audit_log` + `organisations` later but ship their own auth paths

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Gates derived from `.specify/memory/constitution.md` v2.0.0. Marked **PASS** when the feature's design plainly satisfies the gate, **REVIEW** when an explicit Phase-1 artifact will demonstrate it, **N/A** when the gate is unrelated to this feature.

### Principle gates (Article I)

- **P1 — Security at the Database Level**: PASS. `users.org_id`-scoped SELECT RLS policy; INSERT/UPDATE restricted to service role; no client-side INSERT/UPDATE/DELETE policy granted. Verified by RLS test suite.
- **P2 — Immutable Audit Trail**: PASS. All five auth events route through the audit logger; `audit_log` carries an INSERT-only policy enforced at DB level (Gate G-06).
- **P3 — Tenant Isolation**: PASS. `users` carries `org_id`; RLS filters every read; `app.current_org_id` session var is set from the verified token, never from client input (FR-019). Tenant-isolation test seeds two orgs and verifies zero leakage (SC-004).
- **P4 — Test-First for Critical Paths**: REVIEW. The auth guards, RLS policies, webhook signature verification, and idempotency ledger are critical paths — verification tests for each MUST be written and passing before merge. Phase 1 will list them explicitly under `contracts/` and `quickstart.md`.
- **P5 — AI-Augmented, Human-Approved**: N/A — no AI-generated user-facing content in this feature.
- **P6 — Server-Side Validation and Trust Boundary**: PASS. JWKS verification, signature checks, role enforcement, and `org_id` resolution all execute server-side; client-supplied headers are never trusted for identity or org.
- **P7 — Modular Architecture**: PASS. `auth` and `users` modules in `teligencia-api/src/modules/` carry their own controller/service/DTOs/guards; the Angular `core/auth/` module owns the route guard + interceptor.
- **P8 — Defense in Depth**: PASS. Layered: HTTPS-only transport (NFR-001/Rule 3) → Clerk MFA → `ClerkAuthGuard` → `RolesGuard` → `class-validator` DTOs → Supabase RLS → INSERT-only audit.
- **P9 — Reproducible Infrastructure**: PASS. Schema lives in `supabase/migrations/00xx_users.sql` and `00xx_webhook_deliveries.sql`; no dashboard schema edits. RLS policies are checked into source.
- **P10 — Least Privilege Everywhere**: PASS. Six fixed roles; user with `role IS NULL` has no access (EC-002); webhook endpoint accepts no authenticated traffic and is gated by signature verification.

### Compliance Gates (Article III, Rule 1)

- **G-01 (APP)** — N/A this feature (no project lifecycle state).
- **G-02 (APP)** — N/A.
- **G-03 (APP)** — N/A (no signing flow).
- **G-04 (DB)** — N/A (no evidence lock).
- **G-05 (DB)** — N/A (no report status).
- **G-06 (DB)** — **PASS (load-bearing)**. `audit_log` INSERT-only policy enforced at DB level; auth events depend on it. Phase 1 quickstart MUST include a test that asserts UPDATE/DELETE on `audit_log` fails for every role including `service_role`.
- **G-07 (APP)** — N/A (no AI outputs).
- **G-08 (APP)** — PASS. No customer credentials in this feature; staff credentials are entirely owned by Clerk. No DB columns store secrets.

### Ten-Point Security Checklist (Article III, Rule 2)

1. **All queries filter by `org_id`**: PASS. Every read of `users` runs under RLS that filters by `app.current_org_id`. No raw service-role read paths in the request lifecycle.
2. **Service-layer mutations call the audit logger**: PASS. Auth events explicitly listed in FR-015; webhook handler writes via the audit service.
3. **No secrets in code / Git**: PASS. Clerk publishable key in `.env`; Clerk secret key in vault; webhook signing secret in vault.
4. **SHA-256 file hashing server-side**: N/A — no file uploads in this feature.
5. **MIME type validated server-side**: N/A.
6. **Every controller endpoint has a role guard**: PASS. `/auth/me` is decorated with `ClerkAuthGuard` (no `@Roles()` — only requires authentication). The webhook is the only unauthenticated endpoint and is signature-gated, documented as the constitutional exception.
7. **Customer-facing responses strip internal fields**: PASS. `/auth/me` returns a small DTO (`{ id, email, fullName, role, orgId }`); webhook responses are minimal status.
8. **Generic error messages to client**: PASS. FR-016 explicit; SC-008 regression-snapshot test.
9. **File storage paths include `org_id` prefix**: N/A.
10. **Webhook signatures verified before processing**: PASS. `svix` signature verification runs before any handler logic; FR-012 + EC-004 explicit.

**Overall gate verdict**: **PASS — proceed to Phase 0**. No constitutional violations. The Complexity Tracking table is empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-staff-auth/
├── plan.md              # This file
├── spec.md              # Feature spec (with Clarifications section)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output — gate verification + dev runbook
├── contracts/
│   ├── auth-me.openapi.yaml         # GET /auth/me contract
│   ├── webhook-clerk.openapi.yaml   # POST /webhooks/clerk contract
│   └── guards.md                    # ClerkAuthGuard + RolesGuard contracts (for downstream features)
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
teligencia/                                       # monorepo root
├── teligencia-api/                               # NestJS backend
│   └── src/
│       ├── common/
│       │   ├── decorators/
│       │   │   └── roles.decorator.ts            # @Roles()
│       │   ├── guards/
│       │   │   ├── clerk-auth.guard.ts           # JWKS-based token verification
│       │   │   └── roles.guard.ts                # @Roles() enforcement
│       │   └── audit/
│       │       └── audit.service.ts              # writes to audit_log
│       └── modules/
│           ├── auth/
│           │   ├── auth.module.ts
│           │   ├── auth.controller.ts            # GET /auth/me
│           │   ├── auth.service.ts
│           │   ├── dto/
│           │   │   └── current-user.dto.ts
│           │   └── clerk/
│           │       ├── clerk-jwks.service.ts     # JWKS cache, signature verification
│           │       └── clerk.types.ts
│           ├── users/
│           │   ├── users.module.ts
│           │   ├── users.service.ts              # users.id → row lookup; org_id + role
│           │   └── users.repository.ts
│           └── webhooks/
│               ├── webhooks.module.ts
│               ├── webhooks.controller.ts        # POST /webhooks/clerk
│               ├── webhook-signature.guard.ts    # svix verification
│               ├── webhook-deliveries.repository.ts  # svix_id idempotency ledger
│               └── handlers/
│                   ├── user-created.handler.ts
│                   ├── user-updated.handler.ts
│                   └── session-created.handler.ts
│
├── teligencia-lab/                               # Angular frontend (Lab Portal)
│   └── src/app/core/
│       ├── auth/
│       │   ├── auth.service.ts                   # wraps Clerk JS SDK
│       │   ├── auth-token.interceptor.ts         # attaches Bearer token
│       │   ├── auth.guard.ts                     # CanActivate; redirects to sign-in
│       │   ├── role.guard.ts                     # role-aware route guard
│       │   └── current-user.store.ts             # populated from /auth/me
│       └── icons.ts                              # (existing)
│
├── supabase/                                      # NEW (foundation phase)
│   └── migrations/
│       ├── 20260517000001_organisations.sql      # PRECONDITION: exists or created here
│       ├── 20260517000002_audit_log.sql          # PRECONDITION: exists or created here (G-06)
│       ├── 20260517000010_users.sql              # users table + RLS
│       └── 20260517000011_webhook_deliveries.sql # idempotency ledger
│
└── specs/001-staff-auth/                         # this feature's design artifacts
```

### Tests

```text
teligencia-api/test/
├── auth/
│   ├── clerk-auth.guard.e2e.spec.ts              # JWKS verify, 401 paths
│   ├── roles.guard.e2e.spec.ts                   # 403 / role mismatch
│   ├── auth-me.e2e.spec.ts                       # GET /auth/me happy + 401 + 403
│   └── tenant-isolation.e2e.spec.ts              # SC-004
├── webhooks/
│   ├── webhook-signature.e2e.spec.ts             # EC-004
│   ├── webhook-idempotency.e2e.spec.ts           # SC-005
│   └── user-sync.e2e.spec.ts                     # US3, US5
├── audit/
│   └── audit-immutability.e2e.spec.ts            # G-06 — UPDATE/DELETE rejected
└── rls/
    └── users-rls.spec.ts                         # P1 / P3 — cross-org SELECT blocked

teligencia-lab/src/app/core/auth/
├── auth.service.spec.ts
├── auth.guard.spec.ts
└── role.guard.spec.ts

teligencia-lab/e2e/
└── sign-in.spec.ts                               # US1 happy + EC-007 (MFA abandoned)
```

**Structure Decision**: Web-application monorepo with two existing TypeScript projects (`teligencia-api/`, `teligencia-lab/`) plus a NEW `supabase/migrations/` tree for schema-as-code. The auth module is intentionally placed in `teligencia-api/src/modules/auth/`, the guards and audit logger in `src/common/` (consumed by every other module), and the Clerk JWKS service inside the `auth/clerk/` subfolder so the Clerk dependency is bounded and replaceable.

## Complexity Tracking

> Fill ONLY if Constitution Check has violations that must be justified.

*No violations. Table intentionally empty.*
