/*
 * US5 — user.updated webhook propagates role change.
 *
 *   1. Seed user as test_engineer.
 *   2. Forge token for that user; demo-admin-only → 403.
 *   3. Send user.updated webhook promoting role to lab_admin.
 *   4. Same token → demo-admin-only → 200 (SC-006: under 10s end-to-end).
 *   5. USER_UPDATED audit row written.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { forgeToken } from '../utils/clerk-token';
import { signDelivery } from '../utils/svix-sign';

describe('US5 — role change via user.updated webhook', () => {
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

  it('next request reflects the new role under 10 s', async () => {
    const user = await db.seedUser({
      suffix: 'roleflip',
      orgId: orgA.id,
      email: 'flip@test.local',
      role: 'test_engineer',
    });
    const token = await forgeToken({ sub: user.id });

    await request(app.getHttpServer())
      .get('/api/v1/auth/demo-admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(403);

    const payload = {
      type: 'user.updated',
      data: {
        id: user.id,
        email_addresses: [{ id: 'eml_1', email_address: 'flip@test.local' }],
        primary_email_address_id: 'eml_1',
        first_name: 'Flip',
        last_name: 'Test',
        public_metadata: { role: 'lab_admin' },
        organization_memberships: [{ organization: { id: orgA.clerkOrgId } }],
        banned: false,
        locked: false,
      },
    };
    const sig = signDelivery(payload);

    const auditBefore = await db.countAudit('USER_UPDATED', 'clerk_webhook');
    const start = Date.now();

    await request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set('svix-id', sig.svixId)
      .set('svix-timestamp', sig.svixTimestamp)
      .set('svix-signature', sig.svixSignature)
      .send(sig.rawBody)
      .expect(200);

    await request(app.getHttpServer())
      .get('/api/v1/auth/demo-admin-only')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(10_000);

    const auditAfter = await db.countAudit('USER_UPDATED', 'clerk_webhook');
    expect(auditAfter).toBe(auditBefore + 1);
  });
});
