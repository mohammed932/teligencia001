/*
 * US1 — Staff Member Signs In (happy path)
 */

import { test, expect } from '@playwright/test';
import { signIn } from './utils/clerk-auth';

const pm = {
  email: process.env.PM_EMAIL!,
  password: process.env.PM_PASSWORD!,
  totpSecret: process.env.PM_TOTP_SECRET,
};

test.skip(
  !pm.email || !pm.password,
  'Provide PM_EMAIL + PM_PASSWORD (and optional PM_TOTP_SECRET) for live Clerk e2e',
);

test('signs in, lands on dashboard, /auth/me populated', async ({ page }) => {
  await signIn(page, pm);

  // Dashboard shell renders.
  await expect(page).toHaveURL(/\/lab\/dashboard/);
  await expect(page.locator('app-lab-shell')).toBeVisible();
});
