/*
 * Supabase service-role client provider.
 * RLS-bypassing client used by:
 *   - the audit logger (insert-only into audit_log, per G-06 design)
 *   - the webhook handler (writes users + webhook_deliveries)
 *   - the users repository (reads users by Clerk id; RLS is set via GUC
 *     on a separate connection — this client bypasses RLS for upsert paths)
 *
 * The service-role key is constitutional contraband if leaked, so this
 * provider is the only place the key is read. NEVER inject this client
 * into a controller; always go through a repository/service that the
 * security review can audit.
 */

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SupabaseClient, createClient } from '@supabase/supabase-js';

export const SUPABASE_SERVICE = Symbol('SUPABASE_SERVICE');

@Global()
@Module({
  providers: [
    {
      provide: SUPABASE_SERVICE,
      inject: [ConfigService],
      useFactory: (config: ConfigService): SupabaseClient => {
        const url = config.getOrThrow<string>('SUPABASE_URL');
        const key = config.getOrThrow<string>('SUPABASE_SERVICE_ROLE_KEY');
        return createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false },
        });
      },
    },
  ],
  exports: [SUPABASE_SERVICE],
})
export class SupabaseModule {}
