/*
 * NFR-001 — P95 token verification < 100 ms.
 *
 * Drives 1000 GET /auth/me calls with a valid forged token; asserts the
 * P95 latency is under 100 ms. Run on CI for trend tracking.
 *
 * Note: the FakeClerkJwksService used in tests is comparable in cost to
 * production JWKS local verification (both are local RS256 verify). This
 * probe is a reasonable proxy for the production path.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';

const SAMPLE_COUNT = 1000;
const P95_BUDGET_MS = 100;

describe('NFR-001 — token verification P95', () => {
  let app: INestApplication;
  let db: DbFixture;

  beforeAll(async () => {
    db = new DbFixture();
    await db.resetAuthTables();
    const { orgA } = await db.seedOrgs();
    await db.seedUser({
      suffix: 'perf',
      orgId: orgA.id,
      email: 'perf@test.local',
      role: 'pm',
    });
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  it(`p95 < ${P95_BUDGET_MS} ms over ${SAMPLE_COUNT} calls`, async () => {
    const token = await forgeToken({ sub: 'user_test_perf' });
    const samples: number[] = [];

    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const start = process.hrtime.bigint();
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const ns = Number(process.hrtime.bigint() - start);
      samples.push(ns / 1_000_000);
    }

    samples.sort((a, b) => a - b);
    const p95 = samples[Math.floor(SAMPLE_COUNT * 0.95) - 1];
    // eslint-disable-next-line no-console
    console.log(
      `[perf] p50=${samples[499].toFixed(1)}ms p95=${p95.toFixed(1)}ms`,
    );
    expect(p95).toBeLessThan(P95_BUDGET_MS);
  });
});
