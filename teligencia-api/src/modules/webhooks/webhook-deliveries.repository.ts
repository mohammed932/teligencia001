/*
 * webhook_deliveries ledger — idempotency layer 2 (research D4).
 *
 * tryClaim: INSERT ... ON CONFLICT DO NOTHING RETURNING. Returns true if
 * this delivery is fresh, false if it's a replay. Callers short-circuit
 * with 200 {status: 'skipped'} on false.
 */

import { Inject, Injectable, Logger } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_SERVICE } from '../../common/db/supabase.module';

export type DeliveryStatus = 'processed' | 'skipped' | 'failed';

@Injectable()
export class WebhookDeliveriesRepository {
  private readonly logger = new Logger(WebhookDeliveriesRepository.name);

  constructor(
    @Inject(SUPABASE_SERVICE) private readonly supabase: SupabaseClient,
  ) {}

  /**
   * Returns true if the row was inserted (fresh delivery).
   * Returns false if `svix_id` already existed (replay).
   */
  async tryClaim(svixId: string, eventType: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('webhook_deliveries')
      .insert(
        { svix_id: svixId, event_type: eventType, status: 'processed' },
        { count: 'exact' },
      )
      .select('svix_id')
      .maybeSingle();

    if (error) {
      // 23505 = unique_violation → replay; not an error condition.
      if (error.code === '23505') return false;
      this.logger.error(`webhook_deliveries insert failed: ${error.message}`);
      throw error;
    }
    return !!data;
  }

  async markStatus(svixId: string, status: DeliveryStatus): Promise<void> {
    const { error } = await this.supabase
      .from('webhook_deliveries')
      .update({ status })
      .eq('svix_id', svixId);
    if (error) {
      this.logger.warn(
        `webhook_deliveries.markStatus failed: ${error.message}`,
      );
    }
  }
}
