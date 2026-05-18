# Teligencia — Lab Portal (UI)

`teligencia-lab` is the Angular front-end for the Teligencia platform — a multi-tenant SaaS that digitizes the lifecycle of an ISO/IEC 17025-accredited cybersecurity testing laboratory.

This repository contains the **Lab Portal** dashboard (hero screen) plus polished placeholders for every other surface (Customer Portal, Lab feature areas). All data is mocked locally — no backend is wired yet.

---

## Quick start

```bash
cd teligencia-lab
npm install
npm start            # ng serve  → http://localhost:4200
npm run build        # ng build  → dist/teligencia-lab
```

Requires Node 20.x. Tested with the local Angular CLI 17.0.7.

---

## Sign-in (Feature 001 — Clerk + mandatory MFA)

1. Create a Clerk dev instance and one staff user. Set `publicMetadata.role`
   to one of: `lab_admin`, `pm`, `test_engineer`, `reviewer`, `signatory`,
   `quality_manager`.
2. Note your publishable key (`pk_test_…`).
3. Edit `src/environments/environment.development.ts`:
   ```ts
   clerkPublishableKey: 'pk_test_<your-value>',
   apiBaseUrl: 'http://localhost:3000/api/v1',
   ```
4. Make sure `teligencia-api` is running with matching Clerk config and the
   `users` row for your account has been webhook-provisioned (see
   `specs/001-staff-auth/quickstart.md`).
5. `npm start`, visit `/lab/dashboard` — `authGuard` redirects to Clerk
   hosted sign-in. Complete first factor + MFA to land on the dashboard.

Sign-out: use the **Sign out** button in the sidebar foot.

---

## What is in the box

| Route | Purpose |
|-------|---------|
| `/`                            | Portal picker — Lab vs Customer split entry |
| `/lab/dashboard`               | **The hero screen** — 6-section dashboard |
| `/lab/coming-soon/:area`       | Polished placeholders for unimplemented lab areas |
| `/customer`                    | Customer Portal preview frame |

### Dashboard anatomy

1. **Greeting strip** — time-of-day, first name, role-aware lede, ISO week.
2. **KPI strip** — 4 custom `KpiCard` tiles (active projects, in testing, criticals, awaiting signature).
3. **Needs your attention** — role-aware (PM / Lab Admin / Test Engineer / Reviewer / Signatory / Quality Manager). 4 px `--brand-cyan` inset left border, role label as eyebrow.
4. **Recent projects + Findings to address** — 16/8 two-column split (collapses on tablet). Custom row markup, not `nz-table`.
5. **SLA & MA-DD watch** — horizontal scroll strip. Visible only to PM + Lab Admin (gated by `MockSessionService.canSeeSla()`).
6. **Activity feed** — day-grouped timeline (Today / Yesterday / weekday + date). Audit-trail aesthetic with gate badges.

### Role switcher

Top-right of the Lab Shell. Lets you simulate any of the 8 mock staff members. Switching changes `MockSessionService.currentRole()` → re-renders "Needs your attention" + toggles SLA visibility.

---

## Stack

- **Angular 17** (standalone components, signals, `@if` / `@for` / `@switch`, `provideRouter`, `provideAnimations`)
- **ng-zorro-antd 17** (themed: primary `#0A2540`, link `#00D4FF`)
- **@ant-design/icons-angular 17** (curated registry — no `registerAllIcons`)
- **SCSS** with design tokens (`src/styles/tokens.scss`)
- **Inter** via Google Fonts (400 / 500 / 600 / 700)
- **TypeScript strict** — no `any`, no `// @ts-ignore`

No Tailwind. No Material. No Bootstrap. No PrimeNG. No Lottie. No stock illustrations. No emojis as icons (single 🎯 exception in the no-findings empty state).

---

## Architecture

```
src/
├── styles/
│   ├── tokens.scss                  # All design tokens (single source)
│   ├── typography.scss              # Inter type scale
│   └── ng-zorro-theme.scss          # NG-Zorro overrides → brand
├── assets/
│   └── brand/                       # Wordmark SVGs (light + navy)
└── app/
    ├── core/
    │   ├── icons.ts                 # IconDefinition registry (NZ_ICONS)
    │   ├── models/
    │   │   ├── enums.ts             # Role / ProjectStatus / Severity / Finding / Gates
    │   │   └── domain.ts            # Project / Finding / AuditEvent / SlaItem
    │   ├── mock-data/
    │   │   ├── people.ts            # 8 staff — exact spec names
    │   │   ├── manufacturers.ts     # 14 manufacturers + 15 products
    │   │   ├── projects.ts          # 16 projects across every status enum
    │   │   ├── findings.ts          # 20 findings across every severity
    │   │   ├── audit.ts             # 30 audit events / today+yesterday+2d
    │   │   └── sla.ts               # 7 SLA-watch items
    │   └── services/
    │       ├── mock-session.service.ts
    │       └── dashboard-data.service.ts
    ├── shared/
    │   ├── status-badge/            # Custom badge for ProjectStatus
    │   ├── severity-badge/          # Custom badge for Severity
    │   ├── finding-status-pill/     # Pill for FindingStatus
    │   ├── kpi-card/                # Custom KPI tile (no nz-statistic)
    │   ├── avatar/                  # Initials avatar with deterministic tint
    │   ├── sla-countdown/           # Compact countdown chip
    │   ├── activity-item/           # Timeline row
    │   ├── empty-state/             # Inline SVG empty states
    │   └── role-switcher/           # Topbar role/user switcher
    ├── lab/
    │   ├── layout/
    │   │   └── lab-shell.component  # 240px sidebar + 64px topbar
    │   └── features/
    │       ├── dashboard/
    │       │   ├── dashboard.page.ts
    │       │   └── sections/
    │       │       ├── greeting-strip/
    │       │       ├── kpi-strip/
    │       │       ├── needs-my-attention/
    │       │       ├── recent-projects/
    │       │       ├── critical-findings/
    │       │       ├── sla-watch/
    │       │       └── activity-feed/
    │       └── coming-soon/
    │           └── coming-soon.page.ts
    ├── customer/
    │   └── customer-placeholder.page.ts
    ├── portal/
    │   └── portal-picker.page.ts
    ├── app.routes.ts                # 3 top-level surfaces
    └── app.config.ts                # Router / animations / icons / locale
```

---

## Design tokens (single source: `src/styles/tokens.scss`)

| Token              | Value      |
|--------------------|------------|
| `--brand-navy`     | `#0A2540`  |
| `--brand-cyan`     | `#00D4FF`  |
| `--bg-app`         | `#F7F9FC`  |
| `--bg-surface`     | `#FFFFFF`  |
| `--text`           | `#1A1F2E`  |
| `--text-muted`     | `#5B6573`  |
| `--border`         | `#E5EAF0`  |
| `--s-1` … `--s-8`  | 4, 8, 12, 16, 24, 32, 48, 64 px |
| `--radius-sm/md/lg/pill` | 4, 8, 12, 999 px |
| `--shadow-sm/md/lg`| navy-tinted 1/4/12 px |
| `--motion-fast/normal/slow` | 150 / 240 / 400 ms |

No raw hex outside `tokens.scss`. No raw pixel spacing outside the `--s-*` ladder.

---

## Business enums

Sourced from `Teligencia-LLM-Handoff.md` + constitution + prompt:

- **Role** — `lab_admin · pm · test_engineer · reviewer · signatory · quality_manager`
- **ProjectStatus** — `NEW → QUOTE_SENT → PO_RECEIVED → INTAKE_IN_PROGRESS → CONTRACT_REVIEW → READY_FOR_TESTING → IN_TESTING → FINDINGS_REVIEW → RETEST → REPORT_DRAFT → UNDER_REVIEW → AWAITING_SIGNATORY → ISSUED → CLOSED → ARCHIVED`
- **ProjectType** — `EVALUATION · MA_DD · SUBSCRIPTION · CONSULTING · DPP · PRE_CERT · SBOM_ATTESTATION`
- **Severity** — `CRITICAL · HIGH · MEDIUM · LOW · INFORMATIONAL`
- **FindingStatus** — `OPEN · IN_REVIEW · ACCEPTED · REJECTED · RETESTED`
- **StandardScheme** — `EN_18031_{1,2,3} · ETSI_EN_303_645 · IEC_62443_4_{1,2} · NIST_8259A · OWASP_IOT_TOP10`
- **Gate** — `G-01 … G-08`

Customer-friendly status text mapping is in `enums.ts` (`STATUS_TEXT_CUSTOMER`).

---

## Roles & demo controls

Default user: **Lea Hoffmann (PM)** — best dashboard showcase. Switch via the topbar avatar dropdown. All 8 mock staff members live in `src/app/core/mock-data/people.ts`.

Role-aware sections:

| Section            | Behavior |
|--------------------|----------|
| Greeting lede      | Different one-liner per role |
| Needs your attention | 3 different priority cards per role |
| SLA & MA-DD watch  | Visible only to `pm` and `lab_admin` |

---

## Anti-patterns this UI deliberately rejects

- AI purple/pink gradients
- Glassmorphism / neumorphism / particle backgrounds / Lottie
- Default Ant Design blue (overridden everywhere)
- `nz-statistic` for KPIs (custom `KpiCard` instead)
- `nz-tag` for status/severity (custom badges instead)
- Material / Heroicons / Lucide / Feather / Font Awesome
- Stock illustrations, smiling vector people, Lorem ipsum
- Friendly fluff ("Welcome!", "Awesome!", "You rock!")
- Emoji as icons (single intentional 🎯 in no-findings empty state)
- Hardcoded hex outside `tokens.scss`
- `*ngIf` / `*ngFor` / `NgModule` (all standalone, all `@if`/`@for`/`@switch`)

---

## Responsive

| Width         | Behavior |
|---------------|----------|
| 1920 px       | Centered 1440 max-width, generous breathing room |
| 1440 px       | Primary design target |
| 1280 px       | Compact column widths, table loses Type + Team columns |
| 1024 – 1279   | Two-column row collapses to stack |
| 768 – 1023    | Sidebar becomes drawer (hidden, transform-driven) |
| 375 (mobile)  | KPI 2×2, tables become card lists, search shrinks |

Test breakpoints: **375 / 768 / 1024 / 1280 / 1440 / 1920**.

---

## Accessibility

- All text contrast ≥ 4.5:1 against backgrounds (WCAG AA body, AAA for headings)
- Visible focus rings (`outline: 2px solid var(--brand-cyan); outline-offset: 2px`)
- `prefers-reduced-motion: reduce` honored globally
- All interactive elements have `cursor: pointer` + hover states (150 ms)
- Status changes announced via `role="status"` on badges
- ISO-week numeric reads tabular nums

---

## Next module

Move the dashboard data from `core/mock-data` to a typed `api-client` hitting NestJS endpoints (per constitution stack). Replace `MockSessionService` with Clerk session. Wire role guards on the router. None of the dashboard component code should need to change.

---

© 2026 Teligencia Labs · Teligencia UI · all simulated data
