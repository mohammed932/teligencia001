<!--
SYNC IMPACT REPORT
==================
Version change:        0.0.0 (template) → 2.0.0 (initial concrete ratification)
Bump type:             MAJOR — replaces placeholder template with a concrete, binding constitution.

Modified principles:
  • (template) [PRINCIPLE_1_NAME] → Principle 1: Security at the Database Level
  • (template) [PRINCIPLE_2_NAME] → Principle 2: Immutable Audit Trail
  • (template) [PRINCIPLE_3_NAME] → Principle 3: Tenant Isolation
  • (template) [PRINCIPLE_4_NAME] → Principle 4: Test-First for Critical Paths
  • (template) [PRINCIPLE_5_NAME] → Principle 5: AI-Augmented, Human-Approved

Added principles (beyond template 5):
  • Principle 6:  Server-Side Validation and Trust Boundary
  • Principle 7:  Modular Architecture
  • Principle 8:  Defense in Depth
  • Principle 9:  Reproducible Infrastructure
  • Principle 10: Least Privilege Everywhere

Added sections:
  • Article II — The Three Portals (Lab / Customer / Public Tools / Dashboard)
  • Article III — Non-Negotiable Rules (Eight Compliance Gates, Ten-Point Security
                  Checklist, Tech Stack, Secrets Handling, Branding, Schema as Code,
                  Documentation)
  • Article IV — User Roles and Authority
  • Article V — Governance (Authority, Change Process, Enforcement, Quality Gates)
  • Article VI — Definition of Done
  • Article VII — Success Definition

Removed sections:
  • None (template placeholders fully realized).

Templates requiring updates:
  • ✅ .specify/templates/plan-template.md   — "Constitution Check" gate aligned
       to the 10 Principles + 8 Compliance Gates + 10-Point Security Checklist
       (see follow-up TODO below; template currently carries a generic placeholder
       at line 34 — flagged ⚠ pending until plan/spec workflow next runs).
  • ⚠  .specify/templates/spec-template.md  — review required for new mandatory
       sections: tenant-isolation acceptance criteria, gate-mapping, AI human-
       acceptance requirements.
  • ⚠  .specify/templates/tasks-template.md — review required for new task
       categories: RLS policy tasks, audit-logger wiring, gate-verification tests,
       tenant-isolation tests, AI human_accepted flag enforcement.
  • ⚠  .specify/templates/checklist-template.md — extend with the 10-point
       security checklist.

Runtime guidance docs reviewed:
  • README.md (repo root) — no constitutional references; no update required.
  • teligencia-lab/src/styles/tokens.scss — Rule 5 (Branding) confirms #0A2540
       navy + #00D4FF cyan + Inter; current alias bridge points to pilot100 burgundy.
       ⚠ Branding rule and current implementation diverge — flagged for owner.

Follow-up TODOs:
  • TODO(RATIFICATION_DATE): user-supplied header states "May 2026" without a
       precise day. Adopted in this repo on 2026-05-17. Confirm with project owner
       (Prof. Gatri / Dr. Ayman) whether the canonical ratification date should be
       different.
  • TODO(BRANDING_VS_CURRENT_IMPL): Rule 5 mandates navy + cyan + Inter, but the
       current Teligencia Lab styles now alias the brand to the pilot100 system
       (burgundy + bronze + Plus Jakarta Sans). Owner decision required: amend
       Rule 5 (constitutional change, requires version bump) or revert the styles.
  • TODO(TEMPLATE_GATES): Propagate the explicit gate IDs (G-01 … G-08) and the
       10-point security checklist into the Constitution Check sections of
       plan-template.md / spec-template.md / tasks-template.md / checklist-template.md
       when next touched.
-->

# Teligencia TrustOS Constitution

**Reference:** TL-DEV-BIBLE-01
**Scope:** Entire TrustOS application — Lab Portal, Customer Portal, and Public Tools

## Preamble

This constitution is the supreme authority for all development of the
Teligencia TrustOS platform. It governs every portal, every module, and
every line of code. When any specification, plan, task, or AI-generated
output conflicts with this constitution, the constitution prevails.

TrustOS is a Cyber Trust Operating System for an ISO/IEC 17025 accredited
cybersecurity testing laboratory. It produces legally significant documents.
Security failures, compliance gaps, or data leaks have real regulatory and
legal consequences. This constitution exists to make those failures
structurally difficult.

## Article I — Core Principles

### Principle 1: Security at the Database Level

All access-control and data-isolation rules MUST be enforced at the
PostgreSQL Row Level Security (RLS) layer. Application-layer checks are
defense in depth and are required, but they are never the sole line of
defense. The database is the final authority.

### Principle 2: Immutable Audit Trail

The `audit_log` table is INSERT-only. No UPDATE and no DELETE are permitted
for any role, including `service_role`. Every state-changing operation
across every portal MUST write an audit entry before reporting success.

### Principle 3: Tenant Isolation

Every domain table carries an `org_id`. Every query filters by `org_id`.
Every file storage path is prefixed with `org_id`. A user of one
organization can never see, infer, or enumerate the data of another.

### Principle 4: Test-First for Critical Paths

For compliance gates, RLS policies, and security rules, verification tests
MUST be written and passing before the implementation is considered
complete. Untested security is treated as broken security.

### Principle 5: AI-Augmented, Human-Approved

AI-generated content (compliance analysis, draft findings, recommendations)
MUST be marked `human_accepted = true` by an authorized human before it
becomes part of any official record. AI assists; humans remain accountable.

### Principle 6: Server-Side Validation and Trust Boundary

The browser is untrusted. File hashing, MIME validation, role checks,
business rules, and access control execute on the server (NestJS). Client-
side validation exists only for user experience and is never relied upon.

### Principle 7: Modular Architecture

Each module is self-contained: its own database tables with RLS, its own
NestJS module (controller, service, DTOs, guards), its own Angular feature
module, and its own audit actions. Modules communicate through defined
interfaces, not shared internal state.

### Principle 8: Defense in Depth

Security is layered so that no single failure is catastrophic:

1. **Network** — HTTPS only, security headers, CORS restricted to known origins
2. **Authentication** — Clerk with mandatory MFA for all accounts
3. **Authorization** — NestJS guards on every endpoint
4. **Application** — DTO validation, response serialization, output filtering
5. **Database** — RLS policies on every table
6. **Storage** — signed URLs with short expiry, org-scoped paths
7. **Audit** — every action recorded immutably

### Principle 9: Reproducible Infrastructure

The database schema, RLS policies, and seed data are code. They live in
version control as migration files. No schema change is ever made by
clicking in a dashboard. Local and production environments are provably
identical because they are built from the same files.

### Principle 10: Least Privilege Everywhere

Every user, role, API key, and service connection receives the minimum
access required for its function. Customers see only their own data and
only published information. Staff roles are scoped to their function.
Powerful keys (`service_role`) are used only where RLS bypass is genuinely
required, and never exposed to the client.

## Article II — The Three Portals

TrustOS comprises three distinct surfaces. All three obey this constitution,
but each has a defined boundary.

### Section 1: The Lab Portal

- **Users:** Teligencia staff (`lab_admin`, `pm`, `test_engineer`,
  `reviewer`, `signatory`, `quality_manager`).
- **Purpose:** Operate the testing lifecycle — intake, contract review,
  testing, findings, reporting, signing.
- **Visibility:** Staff see full internal data for their organization,
  including internal notes and draft findings.
- **Constraint:** Even within the lab, role boundaries apply. A
  `test_engineer` cannot sign reports; a `quality_manager` cannot alter
  operational records.

### Section 2: The Customer Portal

- **Users:** Manufacturer staff (`customer_admin`, `customer_user`).
- **Purpose:** Submit intake information, track progress, view approved
  findings, download issued reports, communicate with the lab.
- **Visibility:** Customers see ONLY their own organization's data, and
  ONLY information explicitly published to them (`customer_visible`
  findings, ISSUED reports). Internal notes, draft findings, and other
  organizations' data are never visible.
- **Constraint:** Customer-facing API responses MUST pass through response
  DTOs that strip internal fields. The customer portal is treated as a
  hostile-input surface.

### Section 3: The Public Tools

- **Users:** Unauthenticated visitors (potential customers).
- **Purpose:** Lead-generation tools — Readiness Check, ROI Calculator,
  SBOM Generator, Deadline Tracker.
- **Visibility:** No access to any platform data. Public tools read and
  write only their own isolated tables (`leads`, `readiness_checks`,
  `public_sbom_jobs`).
- **Constraint:** Public endpoints are rate-limited, accept no
  authenticated data, and can never reach lab or customer records.
  Uploaded files are sandboxed and auto-deleted within 24 hours.

### Section 4: The Dashboard

Each portal has a role-appropriate dashboard. Dashboards display only
aggregates and records the viewer is authorized to see. A dashboard widget
is subject to the same RLS and serialization rules as any other view —
aggregation is never an excuse to bypass tenant isolation.

## Article III — Non-Negotiable Rules

### Rule 1: The Eight Compliance Gates

The following gates MUST be enforced. Gates marked **(DB)** are enforced by
the database and cannot be bypassed by application code. Gates marked
**(APP)** are enforced in NestJS services.

- **G-01 (APP):** A project cannot enter `READY_FOR_TESTING` without an
  approved ContractReview (PM approved, QM approved, `decision_rule` present).
- **G-02 (APP):** A report cannot be signed without a `decision_rule`
  defined in the ContractReview.
- **G-03 (APP):** A report cannot be signed without `reviewer_approved=true`,
  and only the `signatory` role may sign.
- **G-04 (DB):** Evidence with `locked=true` cannot be modified.
- **G-05 (DB):** Reports with status `ISSUED` cannot be modified.
- **G-06 (DB):** The `audit_log` permits INSERT only — no UPDATE, no DELETE.
- **G-07 (APP):** AI outputs require `human_accepted=true` to become official.
- **G-08 (APP):** Customer credentials are stored only in the secrets vault,
  never in database columns or code.

### Rule 2: The Ten-Point Security Checklist

Every Pull Request MUST pass all ten points, documented in the PR:

1. All database queries filter by `org_id`.
2. Every service-layer mutation calls the audit logger.
3. No secrets in code, config files committed to Git, or documents.
4. SHA-256 file hashing computed server-side.
5. File MIME type validated by content server-side, not by extension.
6. Every NestJS controller endpoint carries a role guard.
7. Customer-facing responses use DTOs that exclude internal fields.
8. Error messages to clients are generic; detail is logged server-side.
9. File storage paths include the `org_id` prefix.
10. All webhook signatures are verified before processing.

### Rule 3: Technology Stack

The stack is fixed:

- **Frontend:** Angular with TypeScript strict mode; Angular Material.
- **Backend:** NestJS with TypeScript strict mode; class-validator DTOs.
- **Database & Storage:** Supabase (PostgreSQL, RLS, Storage, Vault).
- **Local development:** the full Supabase stack runs in Docker via
  `supabase start`; the local Studio dashboard is at `localhost:54323`.
- **Authentication:** Clerk, with mandatory MFA for all accounts.
- **Background jobs:** BullMQ with Redis.
- **Email:** Resend. **Payments:** Stripe. **AI:** Anthropic Claude API.

Local and production environments are identical because both are built from
the same migration files. No substitution of frameworks is permitted.

### Rule 4: Secrets Handling

Secrets (API keys, database passwords, service-role keys, tokens) are
handled under strict discipline:

- Real secrets live in exactly two places: a git-ignored `.env` file in
  the runtime environment, and a dedicated secret manager.
- Secrets are NEVER committed to Git, pasted into chats or AI tools,
  placed in documents, or embedded in code.
- Specifications, examples, and shared documents use placeholders only.
- Onboarding credentials are delivered through a secure share (e.g. a
  password manager), never email or plain text.
- If a secret is exposed, it is treated as compromised and rotated
  immediately, and the project owner is notified.

### Rule 5: Branding

All interfaces use the Teligencia identity: primary color `#0A2540` (navy),
accent color `#00D4FF` (cyan), font Inter, and a clean, professional,
corporate style. Each portal clearly identifies itself to the user.

### Rule 6: Schema as Code

All schema changes flow through version-controlled migration files. The
Supabase Studio dashboard and SQL editor are used to inspect data and to
prototype locally, never to alter the production schema directly. Every
migration touching a table with security implications is reviewed for RLS
correctness before merge.

### Rule 7: Documentation

Every feature produces a specification, a technical plan, a task list, and
generated OpenAPI documentation. Every PR documents its security checklist
results. Undocumented work is incomplete work.

## Article IV — User Roles and Authority

### Lab Staff

- **`lab_admin`** — full system access; user and configuration management.
- **`pm`** — creates and manages projects; approves contract reviews;
  assigns staff; communicates with customers.
- **`test_engineer`** — executes test plans; uploads evidence; drafts
  findings.
- **`reviewer`** — reviews and approves findings for customer visibility;
  approves test results; cannot sign reports.
- **`signatory`** — the sole role authorized to sign reports (Gate G-03).
- **`quality_manager`** — views audit trails and compliance data;
  read-only on operational records.

### Customer Staff

- **`customer_admin`** — manages the customer organization; views all of
  its projects; approves or declines findings; downloads issued reports.
- **`customer_user`** — views assigned projects only; read-only.

### Public

- **Unauthenticated visitors** — use public tools only; become leads via
  consented email capture; reach no platform data.

No role may exceed its defined authority. Role escalation, if ever needed,
occurs only through `lab_admin` action and is itself audited.

## Article V — Governance

### Authority

The security reviewer approves all Pull Requests against this constitution.
Prof. Gatri (Dr. Ayman) provides architectural direction and is the owner
of constitutional change.

### Change Process

- This constitution may be amended only with the explicit approval of the
  project owner.
- Stack changes (Rule 3) require a documented migration analysis.
- New or modified compliance gates require an ISO 17025 compliance review.
- Every amendment increments the version number and records the date.
- Versioning follows semantic versioning: **MAJOR** for backward-incompatible
  governance/principle changes; **MINOR** for new principle/section or
  materially expanded guidance; **PATCH** for clarifications, wording, or
  non-semantic refinements.

### Enforcement

- No Pull Request merges with an incomplete security checklist.
- No feature ships without passing its gate verification tests.
- No release reaches production without tenant-isolation verification.
- Violations of the secrets rule trigger immediate credential rotation.

### Quality Gates

- Each feature defines acceptance criteria in its specification.
- Gate verification tests run before any go-live.
- Tenant isolation is re-verified at every major milestone.

## Article VI — Definition of Done

A feature is complete only when ALL of the following hold:

- It satisfies every functional requirement in its specification.
- All applicable compliance gates pass verification tests.
- Tenant isolation is verified for every table the feature touches.
- The ten-point security checklist passes and is documented.
- The audit trail captures every state-changing action.
- It is reviewed and approved by the security reviewer.
- Specification, plan, tasks, and OpenAPI docs are current.
- It is deployed and monitored, showing healthy metrics.

## Article VII — Success Definition

TrustOS succeeds when:

1. Every ISO 17025 compliance gate passes verification.
2. Tenant isolation is mathematically demonstrable across all portals.
3. The audit trail is complete, immutable, and regulator-ready.
4. The Customer Portal safely serves real manufacturers.
5. The Public Tools generate qualified leads without exposing data.
6. Zero security incidents occur.
7. Teligencia's ISO/IEC 17025 accreditation is upheld by the platform.

---

*This constitution is the single source of truth for all TrustOS
development across every portal. When in doubt, return to these principles.*

*Amendments require the approval of the project owner and a version
increment. Version 2.0.0 supersedes all prior versions.*

**Version**: 2.0.0 | **Ratified**: 2026-05-17 | **Last Amended**: 2026-05-17
