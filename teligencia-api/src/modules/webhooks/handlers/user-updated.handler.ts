/*
 * user.updated handler — update users row (role / email / active), emit
 * USER_UPDATED audit. Reuses the same upsert path as user-created so the
 * idempotent natural-key path remains a single code surface.
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
export class UserUpdatedHandler {
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
      action: 'USER_UPDATED',
      actorId: 'clerk_webhook',
      targetId: row.id,
      requestId,
      outcome: 'ok',
      payload: { orgId: row.org_id, role: row.role, isActive: row.is_active },
    });
  }
}
