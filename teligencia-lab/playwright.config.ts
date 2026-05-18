/*
 * Playwright config — Lab Portal e2e.
 *
 * Requires a running NestJS API (default http://localhost:3000) AND
 * a Clerk dev instance with two test accounts:
 *   - PM_EMAIL + PM_PASSWORD   (role: pm)
 *   - TE_EMAIL + TE_PASSWORD   (role: test_engineer)
 * Provide via env at test time.
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: false,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
