# Feature Specification: Staff Authentication & Authorization (Lab Portal)

**Feature Branch**: `001-staff-auth`
**Feature ID (project)**: 000 — Foundation
**Created**: 2026-05-17
**Status**: Draft
**Portal**: Lab Portal
**Priority**: P0 — Blocking (all other features depend on this)
**Input**: User description: "Staff Authentication & Authorization for Lab Portal: Clerk-backed sign-in with mandatory MFA, six lab roles, NestJS ClerkAuthGuard + RolesGuard, Angular route guards + auth interceptor, Clerk webhook-driven user sync, append-only audit of auth events. Foundation feature; blocks all others."

## Overview

This feature establishes how Teligencia lab staff sign in to the Lab Portal, how their identity is verified, how their role is determined, and how every subsequent request is authenticated and authorized. It is the foundation on which every other module depends — no project, evidence, finding, or report can be created without an authenticated, role-bearing staff user.

This specification covers **staff/lab authentication only**. Customer Portal authentication is a separate concern handled by Feature 008. Public Tools are unauthenticated and out of scope here.

## Clarifications

### Session 2026-05-17

- Q: How does the backend verify Clerk session tokens? → A: JWKS local verification — cache Clerk's public keys, verify JWT signature offline on every request.
- Q: How is `org_id` set when a Clerk webhook provisions a new user? → A: Derived from Clerk org membership — map Clerk `organization_id` → `organisations.clerk_org_id` → use that row's `org_id`.
- Q: Where does the request context's `role` come from on every request? → A: DB row — fetch `users.role` and `users.org_id` per request; DB is canonical at request time. Clerk `publicMetadata.role` is the upstream source synced via webhook into `users`.
- Q: How is webhook idempotency guaranteed under replay (SC-005)? → A: Two layers — natural-key upsert on `users` (Clerk user id is PK) AND a `webhook_deliveries(svix_id PK)` ledger that dedupes audit writes before they fire.
- Q: Which auth failures get written as `AUTH_FAILED` audit entries? → A: Only credentialed-but-rejected — token present, signature/exp/role check failed. Missing-token requests are NOT audited (bot/probe noise).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Staff Member Signs In (Priority: P1)

A Teligencia staff member opens the Lab Portal and signs in using their issued account. Authentication is provided by Clerk and a second factor is mandatory. On success the staff member lands on the dashboard appropriate to their role.

**Why this priority**: Sign-in is the gateway to the entire Lab Portal. Until this story works, no staff member can use any feature. Independent value: a working sign-in flow is itself shippable as the very first usable surface.

**Independent Test**: Provision a staff account in Clerk with a known role, attempt sign-in with valid credentials and MFA, confirm the user is delivered to the correct dashboard and a `SESSION_STARTED` event appears in the audit log.

**Acceptance Scenarios**:

1. **Given** a provisioned staff account with role `pm` and MFA enrolled, **When** the user completes the first factor and the second factor in the Clerk-hosted flow, **Then** they are redirected to the Lab Portal dashboard and the request context shows their role as `pm`.
2. **Given** a provisioned staff account where the second factor is abandoned, **When** the user closes the MFA prompt, **Then** no session is established and protected endpoints reject any subsequent request from that browser.
3. **Given** invalid credentials, **When** the user attempts to sign in, **Then** a generic error is shown with no factor-specific detail and an `AUTH_FAILED` audit entry is written.
4. **Given** any successful sign-in, **When** the session is established, **Then** a `SESSION_STARTED` event with the user id and timestamp is written to the audit log.

---

### User Story 2 — Unauthenticated Access Is Blocked (Priority: P1)

Any attempt to reach a protected route or API without a valid session is rejected. No platform data is ever returned to an unauthenticated caller.

**Why this priority**: This is the tenant- and data-protection floor. Without it, the audit trail, RLS, and role checks are bypassable. P1 alongside sign-in because the two together form the minimum viable secure surface.

**Independent Test**: From a clean browser (no session) request a Lab Portal route and a protected API endpoint; both must be rejected — the route redirects to sign-in, the API returns 401 with no data in the body.

**Acceptance Scenarios**:

1. **Given** no Clerk session, **When** the user visits `/lab/dashboard`, **Then** the browser is redirected to the Clerk sign-in URL and no protected content renders.
2. **Given** no Authorization header, **When** an API call is made to a protected endpoint, **Then** the response is 401 and the body contains no platform data.
3. **Given** an Authorization header with an expired or malformed token, **When** an API call is made, **Then** the response is 401, the body is a generic error, and no role inference happens server-side.

---

### User Story 3 — Authorization Enforced Per Role (Priority: P1)

Every authenticated request carries a verifiable role. Endpoints that restrict by role reject callers without the required role. A user with no role has no access.

**Why this priority**: Sign-in without role enforcement is just a doorman with no map of the building. P1 because all role-restricted features (signing, reviewing, quality oversight) cannot ship without it.

**Independent Test**: Provision two users — one `signatory`, one `test_engineer`. Call an endpoint annotated as signatory-only with both tokens. The first succeeds, the second returns 403 with no business data.

**Acceptance Scenarios**:

1. **Given** an authenticated user with role `signatory`, **When** they call a signatory-restricted endpoint, **Then** the request is permitted.
2. **Given** an authenticated user with role `test_engineer`, **When** they call the same endpoint, **Then** the response is 403 and no data is returned.
3. **Given** an authenticated user with `role = NULL`, **When** they call any protected endpoint, **Then** the response is 403 with a generic "account not fully provisioned" message.
4. **Given** any role check, **When** the check happens, **Then** it happens on the server. UI hiding on the client never substitutes for the server check.

---

### User Story 4 — New Staff Member Is Provisioned via Clerk Webhook (Priority: P2)

When a `lab_admin` invites a staff member in Clerk, a corresponding `users` row appears in the database with the role set, the user linked to the Teligencia lab organization, and a `USER_CREATED` audit entry recorded.

**Why this priority**: Without provisioning, sign-in works but the user has no row in `users`, so they have no role and effectively no access. P2 because the system can ship with manually inserted rows for an initial cohort, but at scale this must be automatic.

**Independent Test**: Send a Clerk `user.created` webhook payload (with a valid signature) for a new user assigned role `reviewer`. Confirm a `users` row exists with the expected id, email, role, and `org_id`, and a `USER_CREATED` audit entry is present.

**Acceptance Scenarios**:

1. **Given** a valid Clerk `user.created` event, **When** the webhook is received and signature-verified, **Then** a `users` row is inserted with the Clerk user id, email, role, and the lab organization's `org_id`, and a `USER_CREATED` audit entry is written.
2. **Given** the same event is re-delivered, **When** the webhook is received again, **Then** the existing row is detected, no duplicate is created, and no inconsistent audit entries are added (idempotent).
3. **Given** a webhook request with a missing or invalid signature, **When** it is received, **Then** it is rejected before any processing, no `users` row is touched, and the attempt is logged.

---

### User Story 5 — Role Change Takes Effect on Next Request (Priority: P2)

When a `lab_admin` changes a staff member's role in Clerk, the change is reflected in the application on the user's next request. Actions newly permitted are granted; actions newly forbidden are rejected.

**Why this priority**: Critical for compliance (least privilege, traceable authority transitions), but the system is functional with static roles for the initial release, so P2 rather than P1.

**Independent Test**: Provision user as `test_engineer`, then send a Clerk `user.updated` webhook changing role to `reviewer`. The next authenticated request from that user must reflect the new role; an endpoint requiring `reviewer` must now succeed; an endpoint requiring `test_engineer` only (if any) must now fail.

**Acceptance Scenarios**:

1. **Given** a valid `user.updated` webhook reducing the user's role, **When** the webhook is received, **Then** the `users` row is updated and a `USER_UPDATED` audit entry is written.
2. **Given** a role change has been applied, **When** the user issues their next API request, **Then** the new role is in effect; no caching causes the old role to persist.

---

### User Story 6 — Staff Member Signs Out (Priority: P2)

A staff member can sign out. The session ends immediately and any further request using the old session token is rejected.

**Why this priority**: P2 because sessions also expire naturally and revocation flows through Clerk; explicit sign-out is a usability and security-hygiene feature, not a blocker for the first usable release.

**Independent Test**: Authenticate, capture the session token, sign out via the UI, then replay an API call with the captured token; the response must be 401 and a `SESSION_ENDED` audit entry must be present.

**Acceptance Scenarios**:

1. **Given** a signed-in user, **When** they click sign-out, **Then** the session is terminated by Clerk, the local app state is cleared, and a `SESSION_ENDED` audit entry is written.
2. **Given** a terminated session, **When** an old token is replayed against a protected endpoint, **Then** the response is 401.

---

### Edge Cases

- **EC-001 — User exists in Clerk but not in database**: A staff member authenticates but no `users` row exists (the creation webhook was missed). The request is rejected with a generic message. The system does not invent a role. A reconciliation path (re-trigger sync, or `lab_admin` action) restores the row. The failure is logged.
- **EC-002 — User has no role assigned**: A staff account exists but has no role in Clerk metadata or the `users.role` column is `NULL`. All protected endpoints reject the user with 403. The user sees an "account not fully provisioned" message directing them to a `lab_admin`.
- **EC-003 — Expired or revoked session**: A session token is expired or revoked. The next request is rejected with 401; the frontend redirects to sign-in. No protected data is returned.
- **EC-004 — Webhook signature invalid**: A request hits the user-sync webhook with a bad or missing signature. It is rejected immediately, before any processing. No `users` row is created or modified. The attempt is logged.
- **EC-005 — Replayed webhook event**: Clerk re-delivers a `user.created` event already processed. The existing row is detected; no duplicate is created; the operation succeeds without side effects.
- **EC-006 — Role changed mid-session**: A user's role is downgraded while they have an active session. The next request reflects the new role. Actions that the old role permitted but the new role does not are rejected from that point on.
- **EC-007 — MFA not completed**: A user passes the first factor but abandons MFA. The session is not authenticated. No protected access is granted. The state is treated as unauthenticated.
- **EC-008 — Direct API call bypassing the frontend**: A user crafts a direct API request without going through the Angular app. Server-side guards verify the token and role regardless of client. This is the intended trust boundary, not a defect.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 — Authentication Provider**: The system MUST use Clerk as the authentication provider. The application MUST NOT implement its own password storage, password reset, or session issuance.
- **FR-002 — Mandatory MFA**: MFA MUST be required for every staff account. A session is not considered authenticated until the second factor is satisfied.
- **FR-003 — Account Creation Boundary**: The application MUST NOT create staff accounts itself. Accounts are created in Clerk (by invitation); the application only mirrors them.
- **FR-004 — Fixed Role Set**: The role set MUST be exactly: `lab_admin`, `pm`, `test_engineer`, `reviewer`, `signatory`, `quality_manager`. A staff user MUST have exactly one role. A user with no role MUST have no access.
- **FR-005 — Role Storage and Mirror**: A staff user's role MUST be stored in Clerk (`publicMetadata.role`) as the upstream source and mirrored into the `users` table by the Clerk webhook. At request time the `users` table is the canonical source consulted by the auth guard — JWT role claims (if present) MUST NOT be trusted by the guard for authorization. Updates flow Clerk → webhook → `users` row → next request.
- **FR-006 — Token-Based Session Verification**: Every request to a protected backend endpoint MUST present a valid Clerk session token in the `Authorization: Bearer <token>` header. A server-side authentication guard MUST verify the token on every request. Verification MUST use JWKS local verification: the backend caches Clerk's public keys (JWKS) and verifies the JWT signature offline per request. The JWKS cache MUST refresh on `kid` miss / signature failure and on a periodic schedule (default: every 60 minutes). Token verification MUST NOT make a synchronous network call to Clerk on the request hot path.
- **FR-007 — 401 on Bad Tokens**: A request with a missing, malformed, or expired token MUST be rejected with HTTP 401. No platform data is returned in the response body.
- **FR-008 — Request Context Population**: After successful token verification the auth guard MUST load the `users` row by Clerk user id and populate the request context with: user id, `org_id`, role, email — all sourced from that `users` row. Downstream code MUST read these from the verified context, never from client-supplied headers or body. If no `users` row exists for the verified user (see EC-001) or `users.role IS NULL` (see EC-002), the request is rejected with the appropriate status before any business handler runs.
- **FR-009 — Role-Based Authorization**: A roles guard MUST enforce per-endpoint role requirements. An endpoint with no role declared still requires authentication. A request from a user lacking the required role MUST be rejected with HTTP 403. Role checks happen on the server.
- **FR-010 — Frontend Route Protection**: Frontend route guards MUST protect all Lab Portal routes. An unauthenticated user reaching a protected route is redirected to sign-in. An authenticated user lacking the role for a route is shown an "access denied" view, not the protected content.
- **FR-011 — Frontend Token Attachment**: A frontend auth interceptor MUST attach the Clerk session token to every API request. The frontend MUST NOT make protected API calls without a session token.
- **FR-012 — Webhook Signature Verification**: A webhook endpoint MUST receive Clerk user lifecycle events. The webhook signature MUST be verified before any processing. Unverified or unsigned webhook calls MUST be rejected.
- **FR-013 — Webhook Event Handling**: On `user.created` the system MUST upsert a `users` row (id, email, role, `org_id`). On `user.updated` the system MUST update the corresponding `users` row. On `session.created` the system MUST update the user's `last_login` timestamp. The `org_id` MUST be resolved by looking up the Clerk `organization_id` (from the webhook payload) in the `organisations.clerk_org_id` column and using the matching row's `org_id`. A webhook for a user with no matching Clerk-org mapping MUST be rejected and an `AUTH_FAILED` audit entry written; the `users` row is not created.
- **FR-014 — Webhook Idempotency**: Webhook handling MUST be idempotent at two layers. (a) **Row layer:** `users` writes use natural-key upsert keyed on the Clerk user id (primary key). (b) **Event layer:** a `webhook_deliveries(svix_id PK, received_at, event_type, status)` ledger MUST record every accepted delivery; if the `svix-id` header value already exists in the ledger, the handler MUST short-circuit (no row touch, no audit write) and return 200. A re-delivered event MUST NOT create duplicate `users` rows OR duplicate audit entries.
- **FR-015 — Audit of Auth Events**: The system MUST write the following events to the append-only audit log: `USER_CREATED`, `USER_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`, `AUTH_FAILED`. The audit log MUST permit INSERT only (Gate G-06). `AUTH_FAILED` MUST be emitted ONLY for credentialed-but-rejected requests — i.e., a token was presented and failed signature verification, expiry check, or role/role-mapping. Requests with no `Authorization` header (probe / unauthenticated traffic) MUST be rejected with 401 but MUST NOT generate audit entries.
- **FR-016 — Generic Auth Errors**: All authentication and authorization failures returned to the client MUST be generic. No detail about which factor failed, which role is required, or which token attribute was invalid is leaked. Detail is logged server-side only.
- **FR-017 — HTTPS-Only Tokens**: Session tokens MUST be transmitted only over HTTPS, only in the `Authorization` header. Tokens MUST NEVER appear in URLs, query strings, or logs.
- **FR-018 — Role-Aware Dashboard Routing**: After sign-in, the staff member MUST be routed to the Lab Portal dashboard with content filtered to what their role is authorized to see (Constitution Article II, Section 4).
- **FR-019 — Tenant Context for RLS**: The data layer MUST set the database session variable used by RLS (e.g., `app.current_org_id`) on every connection/transaction, derived from the verified token. The org context MUST NEVER come from client input.
- **FR-020 — Provided Guards as Deliverables**: This feature MUST deliver two reusable guards consumed by every other module: an authentication guard that verifies the token and populates context, and a roles guard with a `@Roles()` decorator that enforces per-endpoint role.
- **FR-021 — `/auth/me` Endpoint**: The backend MUST expose `GET /auth/me`. Auth required. Returns `{ id, email, fullName, role, orgId }` for the signed-in user. 401 if not authenticated, 403 if the user has no role.

### Non-Functional Requirements

- **NFR-001 — Performance**: Token verification MUST add less than 100 ms to a request. Sign-in to dashboard render MUST complete in under 3 seconds. Webhook processing MUST complete in under 2 seconds.
- **NFR-002 — Reliability**: Webhook handling MUST tolerate out-of-order and repeated delivery. A briefly unavailable webhook MUST recover without manual reconciliation when Clerk retries.
- **NFR-003 — Auditability**: 100% of authentication events MUST appear in the audit log. The audit log is append-only (Gate G-06) — auth events can never be erased.
- **NFR-004 — Security Posture**: No credentials, tokens, or secrets in code, configuration files committed to Git, error messages, or client-visible responses (Constitution Rule 4 + Security Checklist points 2, 3, 8).

### Key Entities *(data involved)*

- **User (`users` row)**: A Teligencia staff member mirrored from Clerk. Key attributes: id (Clerk user id, string), email, full name, role (one of the six fixed staff roles or `NULL` if unprovisioned), `org_id` (the Teligencia lab organization), `is_active`, `last_login`, `created_at`, `updated_at`. Relationships: belongs to one organization; referenced by every domain row created by that user.
- **Organization (`organisations` row)**: The tenant. For the Lab Portal this is the single Teligencia lab organization. Carries `org_id` (internal UUID) and `clerk_org_id` (Clerk's identifier) so webhook payloads can resolve the tenant. Provides the `org_id` that every `users` row references and that RLS policies filter on.
- **Audit Entry (`audit_log` row)**: An append-only record of every state-changing action. For this feature: `USER_CREATED`, `USER_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`, `AUTH_FAILED`. Key attributes: actor id, action, target id, timestamp, request id, generic outcome. INSERT-only.
- **Webhook Delivery (`webhook_deliveries` row)**: Idempotency ledger for inbound Clerk webhooks. Key attributes: `svix_id` (primary key, from Clerk's `svix-id` header), `received_at`, `event_type`, `status`. Used to short-circuit replayed deliveries before any side effects (row writes or audit entries) execute.
- **Session (Clerk-managed)**: Issued and revoked by Clerk; presented to the backend as a Bearer token. The application does not store sessions; it only verifies them.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001 — Unauth blocked**: 100% of protected endpoints reject unauthenticated requests with no platform data in the response body. Verified by an automated unauthenticated-access test suite covering every protected route.
- **SC-002 — Auth events captured**: 100% of `USER_CREATED`, `USER_UPDATED`, `SESSION_STARTED`, `SESSION_ENDED`, and `AUTH_FAILED` events appear in the audit log within 5 seconds of the underlying action. No auth event has ever been erased (Gate G-06).
- **SC-003 — Zero MFA bypass**: Zero sessions are authenticated without MFA. Verified by an explicit test that abandons the second factor and confirms no session is issued.
- **SC-004 — Zero cross-org leak via `users`**: Zero requests return `users` rows from a different organization than the caller's. Verified by a tenant-isolation test with two seeded organizations.
- **SC-005 — Replay idempotency**: A re-delivered Clerk webhook event causes zero duplicate `users` rows and zero duplicate audit entries. Verified by a replay test on a CI fixture.
- **SC-006 — Role change latency**: A role change made in Clerk takes effect for the user on their next request, with effective latency under 10 seconds end-to-end.
- **SC-007 — Sign-in latency**: P95 sign-in to dashboard render is under 3 seconds; P95 token verification per request is under 100 ms; P95 webhook processing is under 2 seconds.
- **SC-008 — Generic error surface**: Zero authentication or authorization error responses returned to the client contain factor-specific or token-specific detail. Verified by a regression suite that snapshots every auth-error response body.

## Assumptions

- A Teligencia Clerk organization and a single lab `organisations` row already exist or will be created as part of the foundation-phase migrations. Multi-org / multi-tenant scaling beyond the single lab tenant is out of scope for this feature.
- The `audit_log` table and its INSERT-only RLS policy (Gate G-06) exist or will be created in the same foundation migration sequence. This spec depends on them but does not redefine them.
- Clerk is configured to require MFA at the organization level. The application enforces MFA by trusting Clerk's "session_active = true only after MFA" guarantee.
- The frontend is the Angular Lab Portal at `teligencia-lab/`; the backend is the NestJS API at `teligencia-api/`. Customer Portal authentication is a separate codepath (Feature 008).
- Role storage in Clerk uses `publicMetadata.role`. The webhook payload includes this field on `user.created` and `user.updated` events.
- The RLS context variable is named `app.current_org_id` and is set per database session/transaction. If the deployment uses Supabase's `auth.jwt()` instead, the principle (org from verified token, never from client) holds and the implementation substitutes accordingly.

## Dependencies

### Internal

- `organisations` table must exist (`users.org_id` references it).
- `audit_log` table and the audit logging service must exist (INSERT-only, Gate G-06).

### External

- **Clerk** — authentication provider, MFA enforcement, webhook source.
- **Supabase / PostgreSQL** — `users` table storage and RLS enforcement.

### Blocks

- Every other feature (001–012 in the broader roadmap). No protected functionality can be built or tested until the authentication guard and roles guard exist.

## Out of Scope

- Customer Portal authentication (`customer_admin`, `customer_user`) — Feature 008.
- Public Tools (no authentication) — Features 009–012.
- Account creation / invitation flow — handled in Clerk, not in the application.
- Password reset and password policy — handled by Clerk.
- User management UI (a `lab_admin` creating, editing, or deactivating staff inside the app) — a later feature. This spec covers only the sync that results from Clerk-side changes.

## Compliance & Constitution References

- **Principle 6**: Server-side validation / trust boundary.
- **Principle 8**: Defense in depth — network → auth → authz layers.
- **Principle 10**: Least privilege.
- **Article II, Section 1**: Lab Portal role boundaries.
- **Rule 1, Gate G-06**: Audit immutability for auth events.
- **Rule 2 — Security Checklist**: Points 2 (audit on every mutation), 6 (every endpoint has a role guard), 8 (generic errors), 10 (webhook signature verification).
- **Rule 3 — Technology Stack**: Clerk with mandatory MFA; NestJS for backend; Angular for frontend.
- **ISO/IEC 17025 §6.2**: Personnel competence and authorization.
