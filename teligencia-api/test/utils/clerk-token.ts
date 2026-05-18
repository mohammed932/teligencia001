/*
 * Test token forge — produces a JWT signed with a test-only key and verified
 * locally by a TEST-MODE Clerk JWKS service stub.
 *
 * The PROD ClerkAuthGuard uses the real Clerk JWKS; for e2e we swap that
 * service for a fake (see makeTestApp() in app-factory.ts).
 *
 * NEVER ship this code path enabled in production.
 */

import { SignJWT, generateKeyPair, exportJWK, JWK } from 'jose';

let cached: { privateKey: CryptoKey; publicJwk: JWK; kid: string } | null =
  null;

export async function testKeyPair(): Promise<{
  privateKey: CryptoKey;
  publicJwk: JWK;
  kid: string;
}> {
  if (cached) return cached;
  const { privateKey, publicKey } = await generateKeyPair('RS256');
  const publicJwk = await exportJWK(publicKey);
  publicJwk.alg = 'RS256';
  publicJwk.use = 'sig';
  publicJwk.kid = 'test-kid-001';
  cached = { privateKey, publicJwk, kid: publicJwk.kid! };
  return cached;
}

export interface ForgeOptions {
  sub: string;
  sid?: string;
  iss?: string;
  expSec?: number;
}

export async function forgeToken(opts: ForgeOptions): Promise<string> {
  const { privateKey, kid } = await testKeyPair();
  return new SignJWT({ sid: opts.sid ?? 'sess_test_001' })
    .setProtectedHeader({ alg: 'RS256', kid })
    .setIssuer(
      opts.iss ?? process.env.CLERK_ISSUER ?? 'https://test.clerk.local',
    )
    .setSubject(opts.sub)
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + (opts.expSec ?? 60))
    .sign(privateKey);
}
