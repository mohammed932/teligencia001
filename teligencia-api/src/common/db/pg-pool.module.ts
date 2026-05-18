/*
 * Raw PostgreSQL connection pool — used when the request handler needs
 * to set the `app.current_org_id` GUC for a tenant-scoped read path.
 *
 * The Supabase JS client cannot SET LOCAL on its underlying connection
 * (PostgREST mode), so RLS-respecting reads use this `pg` pool directly.
 */

import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = Symbol('PG_POOL');

@Global()
@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (config: ConfigService): Pool => {
        const connectionString = config.getOrThrow<string>('SUPABASE_DB_URL');
        return new Pool({
          connectionString,
          max: 10,
          idleTimeoutMillis: 30_000,
        });
      },
    },
  ],
  exports: [PG_POOL],
})
export class PgPoolModule {}
