/*
 * user.created handler — upsert users row, emit USER_CREATED audit.
 *
 * org_id is resolved from organisations.clerk_org_id (research D2).
 * If no mapping exists → throws UnmappedOrgError → controller returns 422
 * and writes an AUTH_FAILED audit entry.
 */

import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../users/users.repository';
import { AuditService } from '../../../common/audit/audit.service';
import {
  ClerkUserEventData,
  fullName,
  primaryEmail,
  primaryOrgId,
} from '../clerk-event.types';

@Injectable()
export class UserCreatedHandler {
  constructor(
    private readonly users: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  async handle(
    data: ClerkUserEventData,
    requestId: string | null,
  ): Promise<void> {
    const clerkOrgId = primaryOrgId(data);
    if (!clerkOrgId) {
      throw new Error('no_org_membership');
    }

    const row = await this.users.upsertFromWebhook({
      clerkUserId: data.id,
      clerkOrgId,
      email: primaryEmail(data),
      fullName: fullName(data),
      role: data.public_metadata?.role ?? null,
      isActive: !data.banned && !data.locked,
    });

    await this.audit.record({
      action: 'USER_CREATED',
      actorId: 'clerk_webhook',
      targetId: row.id,
      requestId,
      outcome: 'ok',
      payload: { orgId: row.org_id, role: row.role },
    });
  }
}
