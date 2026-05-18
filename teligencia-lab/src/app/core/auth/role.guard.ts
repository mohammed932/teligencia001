/*
 * roleGuard(roles[]) — CanActivateFn factory.
 *
 * Runs AFTER authGuard. Reads currentUser from CurrentUserStore. If the
 * user's role is not in the allowed set → navigate to /access-denied.
 *
 * Server still rejects mismatched roles with 403 — this guard exists for
 * UX only (Principle 6: never trust the client for authz).
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { CurrentUserStore } from './current-user.store';
import { StaffRole } from './staff-role';

export function roleGuard(allowed: StaffRole[]): CanActivateFn {
  return async () => {
    const store = inject(CurrentUserStore);
    const router = inject(Router);

    const user = await store.ensureLoaded();
    if (user && allowed.includes(user.role)) return true;

    return router.createUrlTree(['/access-denied']);
  };
}
