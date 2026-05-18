/*
 * Audit logger — single write path into audit_log.
 * Every state-changing operation across the platform calls record().
 * INSERT-only by design (Gate G-06).
 *
 * Payload discipline (Constitution Rule 4 + Security Checklist #3):
 *   - NEVER include raw tokens, secrets, passwords, or full PII bodies.
 *   - Keep payload to a small JSON object with enums + ids only.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE } from '../db/supabase.module';

export type AuditAction =
  | 'USER_CREATED'
  | 'USER_UPDATED'
  | 'SESSION_STARTED'
  | 'SESSION_ENDED'
  | 'AUTH_FAILED';

export type AuditOutcome = 'ok' | 'rejected' | 'error';

export interface AuditRecord {
  action: AuditAction;
  actorId?: string | null;
  targetId?: string | null;
  requestId?: string | null;
  outcome?: AuditOutcome;
  payload?: Record<string, unknown> | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(
    @Inject(SUPABASE_SERVICE) private readonly supabase: SupabaseClient,
  ) {}

  async record(entry: AuditRecord): Promise<void> {
    const { error } = await this.supabase.from('audit_log').insert({
      action: entry.action,
      actor_id: entry.actorId ?? null,
      target_id: entry.targetId ?? null,
      request_id: entry.requestId ?? null,
      outcome: entry.outcome ?? 'ok',
      payload: entry.payload ?? null,
    });

    if (error) {
      // Audit failures must surface loudly but MUST NOT swallow the original
      // request error. Throwing here would couple business success to audit
      // success — instead we log at error level and let an operator investigate.
      this.logger.error(
        `audit_log insert failed: action=${entry.action} actor=${entry.actorId} error=${error.message}`,
      );
    }
  }
}
