/*
 * US1 acceptance — GET /auth/me happy path + EC-001 + EC-002.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';

describe('GET /auth/me', () => {
  let app: INestApplication;
  let db: DbFixture;
  let orgA: { id: string; clerkOrgId: string };

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

  it('returns the user when token + users row + role all valid', async () => {
    const user = await db.seedUser({
      suffix: 'pm-1',
      orgId: orgA.id,
      email: 'pm1@test.local',
      role: 'pm',
    });
    const token = await forgeToken({ sub: user.id });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body).toEqual({
      id: user.id,
      email: 'pm1@test.local',
      fullName: 'pm1',
      role: 'pm',
      orgId: orgA.id,
    });
  });

  it('EC-001: rejects 403 when verified user has no users row', async () => {
    const token = await forgeToken({ sub: 'user_test_ghost' });

    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    expect(res.body).toEqual({ error: 'account_not_fully_provisioned' });
  });

  it('EC-002: rejects 403 when users.role IS NULL', async () => {
    const id = 'user_test_norole';
    // direct DB insert with role NULL — bypass webhook path on purpose.
    const f = await db.setLocalOrg(orgA.id);
    await f.query(
      `INSERT INTO users (id, org_id, email, role)
            VALUES ($1, $2, $3, NULL)
       ON CONFLICT (id) DO UPDATE SET role = NULL`,
      [id, orgA.id, 'norole@test.local'],
    );
    await f.end();

    const token = await forgeToken({ sub: id });
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);
    expect(res.body).toEqual({ error: 'account_not_fully_provisioned' });
  });
});
