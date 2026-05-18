/*
 * US2 — unauthenticated visit to /lab/dashboard redirects to Clerk
 *       hosted sign-in; no protected DOM rendered.
 */

import { test, expect } from '@playwright/test';

test('clean browser → /lab/dashboard → redirected to Clerk sign-in', async ({ page, context }) => {
  await context.clearCookies();
  await page.goto('/lab/dashboard');

  // Wait for the redirect to Clerk's hosted page.
  await page.waitForURL(/clerk\.accounts\.dev|clerk\.com|accounts\./, { timeout: 15_000 });

  // The Lab shell must NOT be rendered.
  await expect(page.locator('app-lab-shell')).toHaveCount(0);
});
