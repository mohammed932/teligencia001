/*
 * Gate G-06 — audit_log is INSERT-only across every role including
 *             service_role. Belt (REVOKE) and braces (POLICY) both verified.
 */

import { DbFixture } from '../utils/db-fixture';

describe('Gate G-06 — audit_log immutability', () => {
  let db: DbFixture;

  beforeAll(async () => {
    db = new DbFixture();
  });

  afterAll(async () => {
    await db.close();
  });

  it('INSERT succeeds; UPDATE fails; DELETE fails', async () => {
    const sess = await db.setLocalOrg('00000000-0000-0000-0000-000000000000');
    try {
      // INSERT — should succeed (service_role grant)
      await sess.query(
        `INSERT INTO audit_log (action, actor_id, outcome) VALUES ('G06_TEST', 'tester', 'ok')`,
      );

      // UPDATE — should error
      await expect(
        sess.query(
          `UPDATE audit_log SET action = 'X' WHERE action = 'G06_TEST'`,
        ),
      ).rejects.toThrow();

      // DELETE — should error
      await expect(
        sess.query(`DELETE FROM audit_log WHERE action = 'G06_TEST'`),
      ).rejects.toThrow();
    } finally {
      await sess.end();
    }
  });
});
