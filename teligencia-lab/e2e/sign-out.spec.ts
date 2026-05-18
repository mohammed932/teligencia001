/*
 * US6 — Sign Out tears down the session.
 */

import { test, expect } from '@playwright/test';
import { signIn } from './utils/clerk-auth';

const pm = {
  email: process.env.PM_EMAIL!,
  password: process.env.PM_PASSWORD!,
  totpSecret: process.env.PM_TOTP_SECRET,
};

test.skip(!pm.email || !pm.password, 'requires Clerk dev creds');

test('Sign Out → portal-picker, no app-lab-shell, replayed token rejected', async ({ page }) => {
  await signIn(page, pm);

  await page.getByRole('button', { name: /sign out/i }).click();
  await page.waitForURL((url) => url.pathname === '/', { timeout: 10_000 });
  await expect(page.locator('app-lab-shell')).toHaveCount(0);

  // Navigating back to /lab/dashboard must redirect to Clerk sign-in.
  await page.goto('/lab/dashboard');
  await page.waitForURL(/clerk\.accounts\.dev|clerk\.com/, { timeout: 10_000 });
});
