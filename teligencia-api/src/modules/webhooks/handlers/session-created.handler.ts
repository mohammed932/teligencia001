/*
 * session.created handler — bump users.last_login, emit SESSION_STARTED
 * audit. The /auth/me path also writes SESSION_STARTED on first
 * authenticated request; both paths are deduplicated by session id in
 * AuthService.recordSessionStarted's LRU.
 */

import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../../users/users.repository';
import { AuditService } from '../../../common/audit/audit.service';
import { ClerkSessionEventData } from '../clerk-event.types';

@Injectable()
export class SessionCreatedHandler {
  constructor(
    private readonly users: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  async handle(
    data: ClerkSessionEventData,
    requestId: string | null,
  ): Promise<void> {
    await this.users.touchLastLogin(data.user_id);

    await this.audit.record({
      action: 'SESSION_STARTED',
      actorId: data.user_id,
      targetId: data.user_id,
      requestId,
      outcome: 'ok',
      payload: { sessionId: data.id, source: 'webhook' },
    });
  }
}
