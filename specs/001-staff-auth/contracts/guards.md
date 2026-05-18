# Internal Contracts — Auth Guards & Roles Decorator

**Branch**: `001-staff-auth` · **Audience**: every downstream feature module (001 → 012).

This document is the contract Feature 000 publishes to the rest of the codebase. It is NOT an HTTP contract — it describes the NestJS guard + decorator API that every other feature consumes.

## `ClerkAuthGuard`

**Path**: `teligencia-api/src/common/guards/clerk-auth.guard.ts`

**Scope**: Registered as a **global** guard in `AppModule`. Every controller endpoint is authenticated by default unless explicitly marked `@Public()`.

**Behavior**:

1. Read `Authorization` header. If missing or not `Bearer <token>` → throw `UnauthorizedException` (HTTP 401). **No `AUTH_FAILED` audit entry** (spec Clarification 5).
2. Verify the JWT signature locally against cached Clerk JWKS (research D1).
3. Verify `exp`, `iat`, `nbf`, `iss`. On any failure → throw `UnauthorizedException` (HTTP 401). **Write `AUTH_FAILED`** (credentialed-but-rejected).
4. Extract Clerk user id (`sub`) from claims.
5. Load `users` row by Clerk user id (research D3). If no row → throw `ForbiddenException` with code `account_not_fully_provisioned` (HTTP 403). **Write `AUTH_FAILED`**. (EC-001)
6. If `users.role IS NULL` → same 403 + `AUTH_FAILED`. (EC-002)
7. If `users.is_active = FALSE` → same 403 + `AUTH_FAILED`.
8. Populate `req.user` (TypeScript interface below) and set `app.current_org_id` GUC on the request-scoped DB transaction.

**`@Public()` decorator**: marks a single controller method or controller class as opt-out. The only consumer in this feature is `WebhooksController#receive` (signature-gated instead).

```ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

## `RolesGuard` + `@Roles()`

**Path**: `teligencia-api/src/common/guards/roles.guard.ts` and `src/common/decorators/roles.decorator.ts`

**Scope**: Registered as a **global** guard, executed AFTER `ClerkAuthGuard`. By itself it is a no-op for endpoints without `@Roles()`.

**Decorator**:

```ts
import { Reflector, SetMetadata } from '@nestjs/core';

export type StaffRole =
  | 'lab_admin'
  | 'pm'
  | 'test_engineer'
  | 'reviewer'
  | 'signatory'
  | 'quality_manager';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: StaffRole[]) => SetMetadata(ROLES_KEY, roles);
```

**Behavior**:

1. Resolve `@Roles(...)` metadata from handler then controller (handler wins). If none → return `true`.
2. Compare `req.user.role` against the allowed set. If absent → throw `ForbiddenException` (HTTP 403). **No `AUTH_FAILED`** (this is a normal RBAC denial, not credential rejection — borderline; spec Clarification 5 places "role check failed" inside `AUTH_FAILED` so we DO write it here too).
3. On allow → return `true`.

**Edge note**: An endpoint protected only by `ClerkAuthGuard` (no `@Roles()`) STILL requires authentication. There is no path to a protected endpoint without `ClerkAuthGuard` running first.

## Request context — `req.user` shape

```ts
// teligencia-api/src/common/types/current-user.ts
export interface CurrentUser {
  /** Clerk user id, same value as users.id */
  id: string;
  /** Internal organisation UUID (NOT Clerk's org id) */
  orgId: string;
  email: string;
  fullName: string | null;
  /** Always non-null when present in req.user — guard rejects null-role users */
  role: StaffRole;
}

declare module 'express' {
  // Augments the Express Request type so handlers can read `req.user`
  // without casts. Provided by the auth module on bootstrap.
  interface Request {
    user?: CurrentUser;
  }
}
```

**Helper** (preferred over direct `req.user` access in handlers):

```ts
// teligencia-api/src/common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (_data, ctx: ExecutionContext): CurrentUser => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user) throw new Error('CurrentUser used outside an authenticated route');
    return req.user;
  }
);

// Usage in a future feature:
// @Get('/projects')
// list(@CurrentUser() user: CurrentUser) { ... }
```

## RLS context propagation

After `ClerkAuthGuard` populates `req.user`, an `OrgContextInterceptor` runs:

```sql
SET LOCAL app.current_org_id = '<req.user.orgId>';
```

Inside the same DB transaction the handler uses. Every downstream feature's repositories rely on this — they MUST NOT set `app.current_org_id` themselves and MUST NOT bypass it via service-role.

**Service-role exception**: the webhook handler runs as service-role (RLS bypass) because it operates BEFORE the user's first signed request and has no user identity to map. This is the only constitutional exception (research D2, research best practices).

## Backward-compatibility commitment

The shapes in this document are part of the public-internal contract Feature 000 publishes. Breaking changes to:

- `CurrentUser` field names / types
- `StaffRole` union (add: minor; remove: major; rename: major)
- `@Roles()` decorator signature
- `@Public()` decorator semantics

require a constitutional amendment AND coordination with every dependent feature (001–012).
