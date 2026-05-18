/*
 * Boots a NestJS test app that wires the real Clerk auth pipeline EXCEPT
 * the JWKS verifier — that is swapped for a fake that accepts tokens
 * signed by the testKeyPair() above.
 *
 * Every e2e suite goes through this factory so the suites stay
 * independent of network availability for Clerk.
 */

import { INestApplication, Injectable } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { jwtVerify, importJWK } from 'jose';
import { json, raw } from 'express';
import { AppModule } from '../../src/app.module';
import {
  ClerkJwksService,
  VerifiedClerkClaims,
} from '../../src/modules/auth/clerk/clerk-jwks.service';
import { testKeyPair } from './clerk-token';

@Injectable()
class FakeClerkJwksService extends ClerkJwksService {
  constructor() {
    // Bypass ConfigService usage — fake constructor doesn't read env.
    super({ getOrThrow: (k: string) => process.env[k] ?? 'test' } as never);
  }

  async verify(token: string): Promise<VerifiedClerkClaims> {
    const { publicJwk } = await testKeyPair();
    const key = await importJWK(publicJwk, 'RS256');
    const issuer = process.env.CLERK_ISSUER ?? 'https://test.clerk.local';
    const { payload } = await jwtVerify(token, key, { issuer });
    return payload as unknown as VerifiedClerkClaims;
  }
}

export async function makeTestApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(ClerkJwksService)
    .useClass(FakeClerkJwksService)
    .compile();

  const app = moduleRef.createNestApplication({ rawBody: true });
  app.use('/api/v1/webhooks/clerk', raw({ type: 'application/json' }));
  app.use(json());
  app.setGlobalPrefix('api/v1');
  await app.init();
  return app;
}
