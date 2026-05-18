/*
 * SC-001 — every controller route registered in the API rejects
 *          unauthenticated requests (or returns 400 for the webhook
 *          signature path). No platform data in the response body.
 *
 * Uses NestJS DiscoveryService at runtime to enumerate registered routes
 * so new endpoints are covered automatically.
 */

import { INestApplication } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PATH_METADATA, METHOD_METADATA } from '@nestjs/common/constants';
import { RequestMethod } from '@nestjs/common';
import * as request from 'supertest';
import { makeTestApp } from '../utils/app-factory';
import { DbFixture } from '../utils/db-fixture';

const METHOD_NAMES: Record<number, string> = {
  [RequestMethod.GET]: 'GET',
  [RequestMethod.POST]: 'POST',
  [RequestMethod.PUT]: 'PUT',
  [RequestMethod.DELETE]: 'DELETE',
  [RequestMethod.PATCH]: 'PATCH',
};

describe('SC-001 — unauthenticated access blocked on every route', () => {
  let app: INestApplication;
  let db: DbFixture;

  beforeAll(async () => {
    db = new DbFixture();
    await db.resetAuthTables();
    await db.seedOrgs();
    app = await makeTestApp();
  });

  afterAll(async () => {
    await app.close();
    await db.close();
  });

  it('returns 401 or 400 with generic body for every protected route', async () => {
    const discovery = app.get(DiscoveryService);
    const scanner = app.get(MetadataScanner);
    const reflector = app.get(Reflector);

    const controllers = discovery.getControllers().filter((w) => !!w.metatype);

    const routes: Array<{ path: string; method: string; isPublic: boolean }> =
      [];
    for (const w of controllers) {
      const prefix = (
        reflector.get<string>(PATH_METADATA, w.metatype!) ?? ''
      ).replace(/^\/+|\/+$/g, '');
      const proto = w.metatype!.prototype as Record<string, unknown>;
      scanner.getAllMethodNames(proto).forEach((name) => {
        const handler = proto[name];
        if (typeof handler !== 'function') return;
        const subPath = (
          reflector.get<string>(PATH_METADATA, handler as never) ?? ''
        ).replace(/^\/+|\/+$/g, '');
        const method = reflector.get<number>(METHOD_METADATA, handler as never);
        const isPublic = !!reflector.get('isPublic', handler as never);
        if (method === undefined) return;
        const url = ['/api/v1', prefix, subPath].filter(Boolean).join('/');
        routes.push({
          path: `/${url.replace(/^\/+/, '')}`,
          method: METHOD_NAMES[method],
          isPublic,
        });
      });
    }

    expect(routes.length).toBeGreaterThan(0);

    for (const r of routes) {
      const agent = request(app.getHttpServer());
      const send: ReturnType<typeof agent.get> =
        r.method === 'GET'
          ? agent.get(r.path)
          : r.method === 'POST'
            ? agent.post(r.path)
            : r.method === 'DELETE'
              ? agent.delete(r.path)
              : r.method === 'PUT'
                ? agent.put(r.path)
                : agent.patch(r.path);
      const res = await send;
      if (r.isPublic) {
        // Webhook: must reject with 400 on missing svix headers, generic body.
        expect([400, 401]).toContain(res.status);
        expect(res.body).toEqual(
          expect.objectContaining({ error: expect.any(String) }),
        );
      } else {
        expect(res.status).toBe(401);
        expect(res.body).toEqual({ error: 'unauthorized' });
      }
    }
  });
});
