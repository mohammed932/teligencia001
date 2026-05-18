/*
 * DB fixture helper for e2e tests.
 *
 * - Connects via SUPABASE_DB_URL.
 * - Seeds two organisations (org A + org B) with Clerk-org mappings.
 * - Seeds two users (one per org) covering the role matrix needed by
 *   tenant-isolation / RLS / role-mismatch tests.
 * - Truncates and reseeds between suites (AVOID running against prod).
 *
 * Requires the foundation migrations applied (`supabase db reset`).
 */

import { Pool } from 'pg';

export interface SeededOrg {
  id: string; // internal UUID
  slug: string;
  clerkOrgId: string;
}

export interface SeededUser {
  id: string; // Clerk user id ("user_test_...")
  orgId: string;
  email: string;
  role:
    | 'lab_admin'
    | 'pm'
    | 'test_engineer'
    | 'reviewer'
    | 'signatory'
    | 'quality_manager';
}

export class DbFixture {
  private pool: Pool;

  constructor() {
    const url = process.env.SUPABASE_DB_URL;
    if (!url) throw new Error('SUPABASE_DB_URL is required for e2e tests');
    this.pool = new Pool({ connectionString: url, max: 5 });
  }

  async resetAuthTables(): Promise<void> {
    // Order matters: users → webhook_deliveries → audit_log → organisations.
    // audit_log cannot be DELETE'd (Gate G-06) — instead we recreate via
    // truncate-with-cascade restricted to test rows. For full reset use
    // `supabase db reset` between suites.
    await this.pool.query('DELETE FROM users WHERE id LIKE $1', [
      'user_test_%',
    ]);
    await this.pool.query('DELETE FROM webhook_deliveries');
    await this.pool.query(
      "DELETE FROM organisations WHERE slug LIKE 'test-%' OR clerk_org_id LIKE 'org_test_%'",
    );
  }

  async seedOrgs(): Promise<{ orgA: SeededOrg; orgB: SeededOrg }> {
    const orgA = await this.insertOrg('test-lab-alpha', 'org_test_alpha');
    const orgB = await this.insertOrg('test-lab-beta', 'org_test_beta');
    return { orgA, orgB };
  }

  private async insertOrg(
    slug: string,
    clerkOrgId: string,
  ): Promise<SeededOrg> {
    const { rows } = await this.pool.query<{ id: string }>(
      `INSERT INTO organisations (slug, name, clerk_org_id)
            VALUES ($1, $2, $3)
       ON CONFLICT (slug) DO UPDATE SET clerk_org_id = EXCLUDED.clerk_org_id
       RETURNING id`,
      [slug, slug, clerkOrgId],
    );
    return { id: rows[0].id, slug, clerkOrgId };
  }

  async seedUser(
    input: Omit<SeededUser, 'id'> & { suffix: string },
  ): Promise<SeededUser> {
    const id = `user_test_${input.suffix}`;
    await this.pool.query(
      `INSERT INTO users (id, org_id, email, full_name, role, is_active)
            VALUES ($1, $2, $3, $4, $5::staff_role, true)
       ON CONFLICT (id) DO UPDATE
         SET org_id = EXCLUDED.org_id,
             email  = EXCLUDED.email,
             role   = EXCLUDED.role`,
      [id, input.orgId, input.email, input.email.split('@')[0], input.role],
    );
    return { id, orgId: input.orgId, email: input.email, role: input.role };
  }

  async countAudit(action: string, actorId?: string): Promise<number> {
    const q = actorId
      ? `SELECT COUNT(*)::int AS c FROM audit_log WHERE action = $1 AND actor_id = $2`
      : `SELECT COUNT(*)::int AS c FROM audit_log WHERE action = $1`;
    const args = actorId ? [action, actorId] : [action];
    const { rows } = await this.pool.query<{ c: number }>(q, args);
    return rows[0].c;
  }

  async countUsers(orgId: string): Promise<number> {
    const { rows } = await this.pool.query<{ c: number }>(
      `SELECT COUNT(*)::int AS c FROM users WHERE org_id = $1`,
      [orgId],
    );
    return rows[0].c;
  }

  async setLocalOrg(
    orgId: string,
  ): Promise<{ end: () => Promise<void>; query: typeof this.pool.query }> {
    const client = await this.pool.connect();
    await client.query('SET LOCAL app.current_org_id = $1', [orgId]);
    return {
      query: client.query.bind(client) as typeof this.pool.query,
      end: async () => client.release(),
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
