/*
 * SC-004 — zero cross-org leak via the users table.
 *
 * Seeds two orgs (alpha + beta) with one user each. Verifies that:
 *   (1) /auth/me returns the caller's identity and ONLY the caller's identity.
 *   (2) A raw RLS SELECT under each user's org context returns exactly 1 row.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';

describe('SC-004 — tenant isolation on users', () => {
  let app: INestApplication;
  let db: DbFixture;
  let orgA: { id: string };
  let orgB: { id: string };

  beforeAll(async () => {
    db = new DbFixture();
    await db.resetAuthTables();
    const seeded = await db.seedOrgs();
    orgA = seeded.orgA;
    orgB = seeded.orgB;
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  it('each user only sees their own row through the API + through RLS', async () => {
    const a = await db.seedUser({
      suffix: 'iso-a',
      orgId: orgA.id,
      email: 'iso.a@test.local',
      role: 'pm',
    });
    const b = await db.seedUser({
      suffix: 'iso-b',
      orgId: orgB.id,
      email: 'iso.b@test.local',
      role: 'pm',
    });

    // API path
    const tokenA = await forgeToken({ sub: a.id });
    const resA = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${tokenA}`)
      .expect(200);
    expect(resA.body.id).toBe(a.id);
    expect(resA.body.orgId).toBe(orgA.id);

    // RLS path — set GUC to org A and assert SELECT returns 1 row, not 2.
    const sessA = await db.setLocalOrg(orgA.id);
    const { rows: rowsA } = await sessA.query<{ id: string }>(
      'SELECT id FROM users WHERE id IN ($1, $2)',
      [a.id, b.id],
    );
    await sessA.end();
    expect(rowsA.map((r) => r.id)).toEqual([a.id]);

    const sessB = await db.setLocalOrg(orgB.id);
    const { rows: rowsB } = await sessB.query<{ id: string }>(
      'SELECT id FROM users WHERE id IN ($1, $2)',
      [a.id, b.id],
    );
    await sessB.end();
    expect(rowsB.map((r) => r.id)).toEqual([b.id]);
  });
});
