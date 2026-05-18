/*
 * US1 acceptance #2 — second factor abandoned → no session.
 */

import { test, expect } from '@playwright/test';
import { abandonAtMfa } from './utils/clerk-auth';

const pm = {
  email: process.env.PM_EMAIL!,
  password: process.env.PM_PASSWORD!,
};

test.skip(
  !pm.email || !pm.password,
  'Provide PM_EMAIL + PM_PASSWORD for live Clerk e2e',
);

test('abandoning MFA does not produce a session; dashboard still gated', async ({ page }) => {
  await abandonAtMfa(page, pm);
  // The authGuard should redirect back to Clerk hosted sign-in.
  await page.waitForURL(/clerk\.accounts\.dev|clerk\.com/);
  await expect(page.locator('text=/sign in/i')).toBeVisible();
});
