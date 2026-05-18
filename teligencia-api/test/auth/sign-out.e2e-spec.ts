/*
 * US6 — POST /auth/sign-out writes SESSION_ENDED.
 *       Clerk-side session revocation is out of scope for this server-side
 *       test (the FakeClerkJwksService accepts the token regardless), so
 *       we only verify the audit-write contract here.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';

describe('POST /auth/sign-out', () => {
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

  it('writes SESSION_ENDED audit and returns 204', async () => {
    const user = await db.seedUser({
      suffix: 'signout',
      orgId: orgA.id,
      email: 'signout@test.local',
      role: 'pm',
    });
    const token = await forgeToken({ sub: user.id });

    const before = await db.countAudit('SESSION_ENDED', user.id);

    await request(app.getHttpServer())
      .post('/api/v1/auth/sign-out')
      .set('Authorization', `Bearer ${token}`)
      .expect(204);

    const after = await db.countAudit('SESSION_ENDED', user.id);
    expect(after).toBe(before + 1);
  });
});
