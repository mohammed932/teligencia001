/*
 * Targeted guard behaviour:
 *   - missing token → 401, NO audit (Clarification 5)
 *   - malformed token → 401 + AUTH_FAILED
 *   - expired token → 401 + AUTH_FAILED
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';

describe('ClerkAuthGuard', () => {
  let app: INestApplication;
  let db: DbFixture;

  beforeAll(async () => {
    db = new DbFixture();
    await db.resetAuthTables();
    await db.seedOrgs();
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  it('401 + no audit when Authorization header missing', async () => {
    const before = await db.countAudit('AUTH_FAILED');
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .expect(401)
      .expect({ error: 'unauthorized' });
    const after = await db.countAudit('AUTH_FAILED');
    expect(after).toBe(before); // missing token MUST NOT audit
  });

  it('401 + AUTH_FAILED when token is malformed', async () => {
    const before = await db.countAudit('AUTH_FAILED');
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', 'Bearer not-a-real-jwt')
      .expect(401)
      .expect({ error: 'unauthorized' });
    const after = await db.countAudit('AUTH_FAILED');
    expect(after).toBe(before + 1);
  });

  it('401 + AUTH_FAILED when token is expired', async () => {
    const expired = await forgeToken({ sub: 'user_test_expired', expSec: -10 });
    const before = await db.countAudit('AUTH_FAILED');
    await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expired}`)
      .expect(401);
    const after = await db.countAudit('AUTH_FAILED');
    expect(after).toBe(before + 1);
  });
});
