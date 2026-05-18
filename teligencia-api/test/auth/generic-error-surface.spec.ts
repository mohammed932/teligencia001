/*
 * SC-008 — snapshot every auth-error response body. CI fails on drift.
 * The bodies MUST contain only { error: '<enum>' } — no stack traces,
 * role names, token detail, or factor names.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';

describe('SC-008 — generic auth-error response bodies (snapshot)', () => {
  let app: INestApplication;
  let db: DbFixture;
  let orgA: { id: string };

  beforeAll(async () => {
    db = new DbFixture();
    await db.resetAuthTables();
    const seeded = await db.seedOrgs();
    orgA = seeded.orgA;
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  it('401 no header', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/auth/me');
    expect(res.status).toBe(401);
    expect(res.body).toMatchInlineSnapshot(`{"error": "unauthorized"}`);
  });

  it('401 bad token', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer junk');
    expect(res.status).toBe(401);
    expect(res.body).toMatchInlineSnapshot(`{"error": "unauthorized"}`);
  });

  it('403 no users row', async () => {
    const token = await forgeToken({ sub: 'user_test_nope' });
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchInlineSnapshot(
      `{"error": "account_not_fully_provisioned"}`,
    );
  });

  it('403 role mismatch on canary', async () => {
    const user = await db.seedUser({
      suffix: 'snapshot-te',
      orgId: orgA.id,
      email: 'te@test.local',
      role: 'test_engineer',
    });
    const token = await forgeToken({ sub: user.id });
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/demo-admin-only')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body).toMatchInlineSnapshot(`{"error": "forbidden"}`);
  });
});
