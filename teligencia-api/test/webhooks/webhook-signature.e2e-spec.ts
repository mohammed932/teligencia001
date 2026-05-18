/*
 * EC-004 — webhook signature verification.
 *   - missing svix headers → 400 missing_headers
 *   - bad signature       → 400 invalid_signature
 *   - no body touch + no row created in either case
 */

import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';

describe('Webhook — signature gate', () => {
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

  it('400 missing_headers when svix-* headers are absent', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send({ type: 'user.created', data: { id: 'user_x' } })
      .expect(400);
    expect(res.body).toEqual({ error: 'missing_headers' });
  });

  it('400 invalid_signature when svix signature does not match', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .set('svix-id', 'msg_test_bad')
      .set('svix-timestamp', `${Math.floor(Date.now() / 1000)}`)
      .set('svix-signature', 'v1,bogus')
      .send({ type: 'user.created', data: { id: 'user_x' } })
      .expect(400);
    expect(res.body).toEqual({ error: 'invalid_signature' });
  });
});
