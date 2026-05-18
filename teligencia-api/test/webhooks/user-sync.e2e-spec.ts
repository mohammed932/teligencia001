/*
 * US3 (US4 in tasks.md) acceptance scenario 1:
 *   user.created → users row inserted + USER_CREATED audit entry.
 *   422 unmapped_org → no row + AUTH_FAILED audit (research D2).
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';
import { signDelivery } from '../utils/svix-sign';

const userCreatedPayload = (id: string, clerkOrgId: string, role: string) => ({
  type: 'user.created',
  data: {
    id,
    email_addresses: [{ id: 'eml_1', email_address: `${id}@test.local` }],
    primary_email_address_id: 'eml_1',
    first_name: 'Test',
    last_name: 'Person',
    public_metadata: { role },
    organization_memberships: [{ organization: { id: clerkOrgId } }],
    banned: false,
    locked: false,
  },
});

describe('Webhook — user.created', () => {
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

  it('happy path: creates users row + USER_CREATED audit', async () => {
    const id = 'user_test_sync_happy';
    const payload = userCreatedPayload(id, orgA.clerkOrgId, 'reviewer');
    const { rawBody, svixId, svixTimestamp, svixSignature } =
      signDelivery(payload);

    const before = await db.countAudit('USER_CREATED', 'clerk_webhook');

    const res = await request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set('svix-id', svixId)
      .set('svix-timestamp', svixTimestamp)
      .set('svix-signature', svixSignature)
      .send(rawBody)
      .expect(200);

    expect(res.body).toEqual({ status: 'processed' });

    const count = await db.countUsers(orgA.id);
    expect(count).toBeGreaterThan(0);

    const after = await db.countAudit('USER_CREATED', 'clerk_webhook');
    expect(after).toBe(before + 1);
  });

  it('422 + AUTH_FAILED when Clerk org id has no organisations mapping', async () => {
    const id = 'user_test_sync_unmapped';
    const payload = userCreatedPayload(id, 'org_test_NOT_MAPPED', 'pm');
    const { rawBody, svixId, svixTimestamp, svixSignature } =
      signDelivery(payload);

    const beforeFail = await db.countAudit('AUTH_FAILED', 'clerk_webhook');

    const res = await request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set('svix-id', svixId)
      .set('svix-timestamp', svixTimestamp)
      .set('svix-signature', svixSignature)
      .send(rawBody)
      .expect(422);

    expect(res.body).toEqual({ error: 'unmapped_org' });

    const afterFail = await db.countAudit('AUTH_FAILED', 'clerk_webhook');
    expect(afterFail).toBe(beforeFail + 1);
  });
});
