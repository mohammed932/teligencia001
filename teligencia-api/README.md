# Teligencia — API (NestJS)

`teligencia-api` is the single backend serving both the Lab Portal (`teligencia-lab`, port 4200) and the Customer Portal (`teligencia-customer`, port 4300).

Empty scaffold — feature modules to be added per constitution (M0–M23).

---

## Quick start

```bash
cd teligencia-api
npm install
npm run start:dev    # nodemon-style watch on http://localhost:3000
npm run build
```

API base URL: `http://localhost:3000/api/v1`
OpenAPI explorer: `http://localhost:3000/api/docs`

Health probe: `GET /api/v1/health` → `{ status, uptimeSeconds, timestamp, version }`

---

## Stack (constitution-locked)

- NestJS 10 (TypeScript strict)
- `class-validator` + `class-transformer` for DTOs
- `@nestjs/swagger` for OpenAPI generation
- Will add: Supabase JS client, Clerk SDK, BullMQ, Anthropic SDK, pdfmake

---

## Layout

```
src/
├── main.ts                 # bootstrap, CORS, global pipes, OpenAPI
├── app.module.ts
├── health/                 # GET /api/v1/health
├── modules/                # feature modules (one per spec module M0–M23)
│   ├── auth/
│   ├── projects/
│   ├── findings/
│   ├── reports/
│   ├── evidence/
│   ├── audit/
│   ├── intake/
│   ├── contract-reviews/
│   ├── users/
│   └── ai/
├── common/                 # cross-cutting
│   ├── guards/             # RolesGuard, ClerkAuthGuard
│   ├── decorators/         # @Roles(), @CurrentUser()
│   ├── filters/            # exception filter (generic client message)
│   ├── interceptors/       # audit interceptor, response serialization
│   └── dto/                # shared DTOs
└── config/                 # env config schema, Supabase client factory
```

---

## CORS

Allowed origins (dev + prod):

- `http://localhost:4200` (lab dev)
- `http://localhost:4300` (customer dev)
- `https://lab.teligencia.app`
- `https://app.teligencia.app`
- `https://teligencia.app`

---

## Gates to enforce (constitution)

| Gate | Rule | Layer |
|------|------|-------|
| G-01 | Project → READY_FOR_TESTING blocked without approved ContractReview | Service |
| G-02 | Report sign blocked without `decision_rule` | Service |
| G-03 | Report sign blocked without `reviewer_approved=true` | Guard + Service |
| G-04 | Locked evidence immutable | Database RLS |
| G-05 | ISSUED reports immutable | Database RLS |
| G-06 | `audit_log` INSERT-only | Database REVOKE |
| G-07 | AI outputs require `human_accepted=true` | Application |
| G-08 | Customer credentials in Supabase Vault only | Application |

Every gate gets an automated test before the implementation ships.

---

## Next steps

1. Add `.env` schema + Supabase client factory in `config/`.
2. Wire `ClerkAuthGuard` + `RolesGuard` in `common/guards/`.
3. Add `AuditService` (insert-only) + interceptor that calls it before responses.
4. Build M0 (Projects) — controller + service + DTOs + RLS migration + tests.
