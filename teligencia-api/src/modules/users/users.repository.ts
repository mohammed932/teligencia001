/*
 * Users repository — service-role-only writes; reads via service-role client
 * (RLS bypass) because the auth guard runs BEFORE RLS context is established.
 *
 * org_id resolution rule (research D2):
 *   Clerk org id → organisations.clerk_org_id → that row's UUID.
 *   No mapping → throw UnmappedOrgError (webhook returns 422 + AUTH_FAILED).
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE } from '../../common/db/supabase.module';
import { StaffRole, isStaffRole } from '../../common/types/staff-role';

export interface UserRow {
  id: string;
  org_id: string;
  email: string;
  full_name: string | null;
  role: StaffRole | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export class UnmappedOrgError extends Error {
  constructor(public readonly clerkOrgId: string) {
    super(`Clerk org ${clerkOrgId} not mapped to any organisations row`);
  }
}

export interface UpsertUserInput {
  clerkUserId: string;
  clerkOrgId: string;
  email: string;
  fullName: string | null;
  role: string | null; // raw value from Clerk publicMetadata.role; validated here
  isActive: boolean;
}

/*
 * T512 — request-scoped user cache.
 *
 * The auth guard populates `req.user` once per request and downstream
 * handlers MUST read from there (via the @CurrentUser() param decorator),
 * not by re-calling `findByClerkId`. That is the request-scoped cache:
 * a single shared in-memory copy for the lifetime of the request, with
 * no extra Nest @Injectable({ scope: REQUEST }) machinery needed.
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(
    @Inject(SUPABASE_SERVICE) private readonly supabase: SupabaseClient,
  ) {}

  async findByClerkId(clerkUserId: string): Promise<UserRow | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select('*')
      .eq('id', clerkUserId)
      .maybeSingle();

    if (error) {
      this.logger.error(`users.findByClerkId failed: ${error.message}`);
      throw error;
    }
    return (data as UserRow | null) ?? null;
  }

  /**
   * Resolve internal org UUID from the Clerk org id. Throws if no mapping.
   */
  async resolveOrgIdByClerkOrg(clerkOrgId: string): Promise<string> {
    const { data, error } = await this.supabase
      .from('organisations')
      .select('id')
      .eq('clerk_org_id', clerkOrgId)
      .maybeSingle();

    if (error) {
      this.logger.error(`organisations lookup failed: ${error.message}`);
      throw error;
    }
    if (!data) throw new UnmappedOrgError(clerkOrgId);
    return data.id as string;
  }

  /**
   * Upsert keyed on Clerk user id (natural key). Idempotency layer 1
   * (research D4). The event-id ledger is layer 2 and short-circuits
   * BEFORE this method runs on replays.
   */
  async upsertFromWebhook(input: UpsertUserInput): Promise<UserRow> {
    const orgId = await this.resolveOrgIdByClerkOrg(input.clerkOrgId);

    const role = isStaffRole(input.role) ? input.role : null;

    const row = {
      id: input.clerkUserId,
      org_id: orgId,
      email: input.email,
      full_name: input.fullName,
      role,
      is_active: input.isActive,
    };

    const { data, error } = await this.supabase
      .from('users')
      .upsert(row, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      this.logger.error(`users.upsert failed: ${error.message}`);
      throw error;
    }
    return data as UserRow;
  }

  async touchLastLogin(clerkUserId: string): Promise<void> {
    const { error } = await this.supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', clerkUserId);

    if (error) {
      this.logger.warn(`users.touchLastLogin failed: ${error.message}`);
    }
  }
}
