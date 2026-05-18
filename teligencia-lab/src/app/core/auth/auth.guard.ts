/*
 * authGuard — CanActivateFn for any protected route.
 *
 * Flow:
 *   1. Ensure AuthService is loaded.
 *   2. If signed in → allow.
 *   3. Otherwise → redirect to Clerk hosted sign-in with returnUrl.
 *
 * Frontend enforcement is UX-only; the API still verifies tokens server-side
 * (Principle 6).
 */

import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (_route, state) => {
  const auth = inject(AuthService);
  inject(Router); // ensures Router context is initialised before redirect

  await auth.load();
  if (auth.isSignedIn()) return true;

  auth.signIn(state.url);
  return false;
};
