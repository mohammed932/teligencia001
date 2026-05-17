# Teligencia — workspace

Three independent projects, each with its own `package.json`, `node_modules`, and deploy lane. Separation-of-concerns wins over DRY here — copies of design tokens stay aligned through the design-decisions doc.

```
teligencia/
├── teligencia-lab/       Angular 17 · Lab Portal      · port 4200
├── teligencia-customer/  Angular 17 · Customer Portal · port 4300
└── teligencia-api/       NestJS 10  · backend API     · port 3000
```

## Run all three (separate terminals)

```bash
# Terminal 1 — API (must be up before either portal calls it)
cd teligencia-api && npm install && npm run start:dev

# Terminal 2 — Lab Portal
cd teligencia-lab && npm install && npm start

# Terminal 3 — Customer Portal
cd teligencia-customer && npm install && npm start
```

Then open:

- http://localhost:4200/lab/dashboard — Lab Portal (hero)
- http://localhost:4300/portal/projects — Customer Portal
- http://localhost:3000/api/v1/health — API health probe
- http://localhost:3000/api/docs — OpenAPI explorer

## Why three folders, not one monorepo?

- Hard isolation of deps and CI lanes (Angular tooling vs NestJS tooling don't mix).
- Each portal can deploy to its own subdomain (`lab.teligencia.app`, `app.teligencia.app`) without bundle-splitting hacks.
- The shared design tokens (`src/styles/tokens.scss`) are intentionally duplicated between the two Angular apps. Changes get committed in a single PR touching both.

For sharing real domain types and DTOs between API and the two portals, the API will publish a generated OpenAPI client. Each portal pulls it as a regular npm dep.

## Constitution

Governance lives in `.specify/memory/constitution.md`. Read it before changing the stack, the gate list, or any non-negotiable principle.

## Status

| Project          | Stage            | Notes |
|------------------|------------------|-------|
| `teligencia-lab`    | Hero screen done | Dashboard + 6 sections, role switcher, light/dark theme |
| `teligencia-customer` | Scaffold done  | Customer dashboard + 4 placeholder pages |
| `teligencia-api`    | Empty scaffold   | `/health` only — feature modules pending |
