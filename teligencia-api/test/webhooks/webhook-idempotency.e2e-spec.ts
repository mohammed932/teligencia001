/*
 * SC-005 — re-delivered Clerk webhook causes zero duplicate users rows
 *          and zero duplicate audit entries.
 *
 * Strategy:
 *   1. Sign one delivery (fixed svix_id).
 *   2. POST it twice.
 *   3. Assert: first response = processed, second response = skipped,
 *      audit count for USER_CREATED unchanged after second call,
 *      users row count unchanged.
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { signDelivery } from '../utils/svix-sign';

describe('SC-005 — webhook idempotency under replay', () => {
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

  it('replay returns 200 skipped; no duplicate rows or audit entries', async () => {
    const id = 'user_test_replay';
    const payload = {
      type: 'user.created',
      data: {
        id,
        email_addresses: [{ id: 'eml_1', email_address: 'rep@test.local' }],
        primary_email_address_id: 'eml_1',
        first_name: 'Replay',
        last_name: 'Test',
        public_metadata: { role: 'pm' },
        organization_memberships: [{ organization: { id: orgA.clerkOrgId } }],
        banned: false,
        locked: false,
      },
    };
    const { rawBody, svixId, svixTimestamp, svixSignature } =
      signDelivery(payload);

    const auditBefore = await db.countAudit('USER_CREATED', 'clerk_webhook');
    const usersBefore = await db.countUsers(orgA.id);

    const first = await request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set('svix-id', svixId)
      .set('svix-timestamp', svixTimestamp)
      .set('svix-signature', svixSignature)
      .send(rawBody)
      .expect(200);
    expect(first.body).toEqual({ status: 'processed' });

    const second = await request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set('svix-id', svixId)
      .set('svix-timestamp', svixTimestamp)
      .set('svix-signature', svixSignature)
      .send(rawBody)
      .expect(200);
    expect(second.body).toEqual({ status: 'skipped' });

    const auditAfter = await db.countAudit('USER_CREATED', 'clerk_webhook');
    const usersAfter = await db.countUsers(orgA.id);

    expect(auditAfter - auditBefore).toBe(1); // exactly one new entry, not two
    expect(usersAfter - usersBefore).toBe(1);
  });
});
