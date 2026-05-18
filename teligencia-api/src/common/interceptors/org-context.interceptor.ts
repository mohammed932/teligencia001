/*
 * After ClerkAuthGuard populates req.user, this interceptor opens a
 * dedicated DB connection from the pg pool and sets `app.current_org_id`
 * for the lifetime of the request. Downstream feature repositories
 * SHOULD acquire their connection via the same helper so RLS reads
 * are tenant-scoped automatically.
 *
 * For Feature 001 the only RLS-respecting read path is debug/inspection
 * (the auth guard uses the service-role client). Future features wire
 * their tenant-scoped queries through this interceptor's connection.
 */

import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { from, Observable, switchMap } from 'rxjs';
import { PG_POOL } from '../db/pg-pool.module';
import { Pool } from 'pg';

export const ORG_DB_CONNECTION = Symbol('ORG_DB_CONNECTION');

@Injectable()
export class OrgContextInterceptor implements NestInterceptor {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  intercept(ctx: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { [ORG_DB_CONNECTION]?: unknown }>();

    if (!req.user) {
      // Public route (e.g. webhooks) — no GUC to set.
      return next.handle();
    }

    return from(this.pool.connect()).pipe(
      switchMap(async (client) => {
        try {
          await client.query('SET LOCAL app.current_org_id = $1', [
            req.user!.orgId,
          ]);
          req[ORG_DB_CONNECTION] = client;
          return null;
        } catch (err) {
          client.release();
          throw err;
        }
      }),
      switchMap(
        () =>
          new Observable((observer) => {
            const sub = next.handle().subscribe({
              next: (v) => observer.next(v),
              error: (err) => {
                releaseClient(req);
                observer.error(err);
              },
              complete: () => {
                releaseClient(req);
                observer.complete();
              },
            });
            return () => sub.unsubscribe();
          }),
      ),
    );
  }
}

function releaseClient(req: Request & { [ORG_DB_CONNECTION]?: unknown }): void {
  const client = req[ORG_DB_CONNECTION];
  if (
    client &&
    typeof (client as { release?: () => void }).release === 'function'
  ) {
    (client as { release: () => void }).release();
  }
  delete req[ORG_DB_CONNECTION];
}
