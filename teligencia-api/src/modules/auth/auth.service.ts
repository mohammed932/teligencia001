/*
 * AuthService — writes SESSION_STARTED / SESSION_ENDED audit entries.
 * Idempotent SESSION_STARTED per session id (cheap in-memory LRU) so a
 * burst of requests on a single sign-in doesn't flood the audit log.
 */

import { Injectable } from '@nestjs/common';
import { AuditService } from '../../common/audit/audit.service';

@Injectable()
export class AuthService {
  // Bounded LRU of recent session ids that have already emitted SESSION_STARTED.
  // Reset on process restart — duplicates after a restart are acceptable (rare).
  private readonly seenSessions = new Map<string, number>();
  private readonly SESSION_LRU_LIMIT = 1024;

  constructor(private readonly audit: AuditService) {}

  async recordSessionStarted(
    userId: string,
    sessionId: string | null,
    requestId: string | null,
  ): Promise<void> {
    const key =
      sessionId ?? `noSid:${userId}:${Math.floor(Date.now() / 60_000)}`;
    if (this.seenSessions.has(key)) return;

    this.seenSessions.set(key, Date.now());
    if (this.seenSessions.size > this.SESSION_LRU_LIMIT) {
      const firstKey = this.seenSessions.keys().next().value;
      if (firstKey !== undefined) this.seenSessions.delete(firstKey);
    }

    await this.audit.record({
      action: 'SESSION_STARTED',
      actorId: userId,
      targetId: userId,
      requestId,
      outcome: 'ok',
      payload: sessionId ? { sessionId } : null,
    });
  }

  async recordSessionEnded(
    userId: string,
    requestId: string | null,
  ): Promise<void> {
    await this.audit.record({
      action: 'SESSION_ENDED',
      actorId: userId,
      targetId: userId,
      requestId,
      outcome: 'ok',
    });
  }
}
