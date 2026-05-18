/*
 * Drives the Clerk-hosted sign-in flow including MFA.
 * Implementation detail: Clerk's hosted UI element IDs are stable in
 * dev but may shift in major version bumps — re-check selectors then.
 */

import { Page, expect } from '@playwright/test';

export interface TestAccount {
  email: string;
  password: string;
  totpSecret?: string;       // optional pre-shared TOTP seed for MFA
}

export async function signIn(page: Page, account: TestAccount): Promise<void> {
  await page.goto('/lab/dashboard');
  // ClerkAuthGuard redirects to hosted sign-in
  await page.waitForURL(/clerk\.accounts\.dev|clerk\.com/, { timeout: 15_000 });

  await page.getByLabel(/email/i).fill(account.email);
  await page.getByRole('button', { name: /continue|next/i }).click();
  await page.getByLabel(/password/i).fill(account.password);
  await page.getByRole('button', { name: /continue|sign in/i }).click();

  if (account.totpSecret) {
    // Generate TOTP and submit. Caller is responsible for keeping
    // totpSecret out of CI logs.
    const { totp } = await import('otplib');
    const code = totp.generate(account.totpSecret);
    await page.getByLabel(/verification code/i).fill(code);
    await page.getByRole('button', { name: /continue|verify/i }).click();
  }

  await page.waitForURL(/\/lab\/dashboard/, { timeout: 15_000 });
  await expect(page.locator('app-lab-shell')).toBeVisible();
}

export async function abandonAtMfa(page: Page, account: Omit<TestAccount, 'totpSecret'>): Promise<void> {
  await page.goto('/lab/dashboard');
  await page.waitForURL(/clerk\.accounts\.dev|clerk\.com/);
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByRole('button', { name: /continue|next/i }).click();
  await page.getByLabel(/password/i).fill(account.password);
  await page.getByRole('button', { name: /continue|sign in/i }).click();
  // At MFA prompt — close the tab/navigate away without entering the code.
  await page.goto('/lab/dashboard');
}
