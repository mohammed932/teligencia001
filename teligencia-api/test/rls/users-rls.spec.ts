/*
 * P1 / P3 — direct psql verification of users RLS.
 *   - With no GUC set: SELECT returns 0 rows (NULLIF protects misconfig).
 *   - With GUC set to org A: only org A rows visible.
 *   - With GUC set to org B: only org B rows visible.
 *
 * This is the "RLS works at the DB even if the app forgets" test —
 * doesn't go through NestJS at all.
 */

import { Pool } from 'pg';
import { DbFixture } from '../utils/db-fixture';

describe('users RLS direct', () => {
  let pool: Pool;
  let db: DbFixture;
  let orgA: { id: string };
  let orgB: { id: string };

  beforeAll(async () => {
    db = new DbFixture();
    await db.resetAuthTables();
    const seeded = await db.seedOrgs();
    orgA = seeded.orgA;
    orgB = seeded.orgB;
    await db.seedUser({
      suffix: 'rls-a',
      orgId: orgA.id,
      email: 'rls.a@test.local',
      role: 'pm',
    });
    await db.seedUser({
      suffix: 'rls-b',
      orgId: orgB.id,
      email: 'rls.b@test.local',
      role: 'pm',
    });

    pool = new Pool({ connectionString: process.env.SUPABASE_DB_URL });
  });

  afterAll(async () => {
    await pool.end();
    await db.close();
  });

  it('GUC unset → empty result (no leak)', async () => {
    const client = await pool.connect();
    try {
      await client.query('RESET app.current_org_id');
      const { rows } = await client.query(
        "SELECT id FROM users WHERE id LIKE 'user_test_%'",
      );
      // With NULLIF + ::uuid cast the WHERE always false → 0 rows.
      expect(rows.length).toBe(0);
    } finally {
      client.release();
    }
  });

  it('GUC = orgA → only orgA rows', async () => {
    const sess = await db.setLocalOrg(orgA.id);
    const { rows } = await sess.query<{ id: string }>(
      "SELECT id FROM users WHERE id LIKE 'user_test_rls-%'",
    );
    await sess.end();
    expect(rows.every((r) => r.id.endsWith('rls-a'))).toBe(true);
  });

  it('GUC = orgB → only orgB rows', async () => {
    const sess = await db.setLocalOrg(orgB.id);
    const { rows } = await sess.query<{ id: string }>(
      "SELECT id FROM users WHERE id LIKE 'user_test_rls-%'",
    );
    await sess.end();
    expect(rows.every((r) => r.id.endsWith('rls-b'))).toBe(true);
  });
});
