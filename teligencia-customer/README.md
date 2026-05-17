# Teligencia — Customer Portal (UI)

`teligencia-customer` is the Angular front-end for manufacturer customers. It exposes only the data approved by the lab (staged visibility, friendly status text, signed reports).

Hosted independently from the Lab Portal (own workspace, own deploy).

---

## Quick start

```bash
cd teligencia-customer
npm install
npm start            # ng serve → http://localhost:4300
npm run build
```

---

## Routes

| Route                  | Purpose |
|------------------------|---------|
| `/`                    | Redirect → `/portal/projects` |
| `/portal/projects`     | Dashboard — your active evaluations + friendly status |
| `/portal/intake`       | Multi-step intake form (placeholder) |
| `/portal/findings`     | Customer-visible findings (placeholder) |
| `/portal/reports`      | Issued, signed reports (placeholder) |
| `/portal/messages`     | Q&A with your project manager (placeholder) |

Switch to Lab Portal via the topbar link or http://localhost:4200/.

---

## Stack

Same as `teligencia-lab` — Angular 17, standalone components, signals, ng-zorro-antd 17, SCSS tokens, Inter. Identical theme system (light · system · dark).

Design tokens and shared components are intentionally duplicated from `teligencia-lab` (separation of concerns chosen over DRY).

---

## What is in here

```
src/
├── styles/                   # design tokens (duplicated from lab)
├── assets/brand/             # wordmark SVGs (light + dark)
└── app/
    ├── core/
    │   ├── icons.ts          # NG-Zorro icon registry (subset)
    │   ├── models/
    │   │   ├── enums.ts      # business enums (shared with lab)
    │   │   └── domain.ts     # customer-only types
    │   ├── mock-data/
    │   │   └── customer-data.ts
    │   └── services/
    │       └── theme.service.ts
    ├── shared/               # status-badge, severity-badge, finding-status-pill,
    │                         # avatar, empty-state, theme-toggle
    └── portal/
        ├── customer-shell.component.{ts,scss}
        ├── projects.page.{ts,scss}
        └── coming-soon.page.{ts,scss}
```

---

## Mock customer

Signed in as **Andreas Weber (Compliance Lead, Bosch GmbH)**. Five projects across the full lifecycle: NEW → INTAKE_IN_PROGRESS → IN_TESTING → MA_DD monitoring → one ISSUED with a downloadable report stub.

---

## Backend

Consumes `teligencia-api` at http://localhost:3000/api/v1 (CORS-allowed). Currently mock data is in-memory; the same component contracts will accept real API responses.
