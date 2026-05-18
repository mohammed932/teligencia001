/*
 * US3 — RolesGuard allow/deny matrix using the permanent canary
 *        endpoint GET /auth/demo-admin-only (@Roles('lab_admin')).
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';
import { STAFF_ROLES, StaffRole } from '../../src/common/types/staff-role';

describe('RolesGuard — @Roles(lab_admin) canary', () => {
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

  test.each(STAFF_ROLES as readonly StaffRole[])(
    'role=%s → %s',
    async (role) => {
      const user = await db.seedUser({
        suffix: `r-${role}`,
        orgId: orgA.id,
        email: `${role}@test.local`,
        role,
      });
      const token = await forgeToken({ sub: user.id });

      const expected = role === 'lab_admin' ? 200 : 403;
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/demo-admin-only')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(expected);
      if (expected === 200) {
        expect(res.body).toEqual({ ok: true });
      } else {
        expect(res.body).toEqual({ error: 'forbidden' });
      }
    },
  );
});
