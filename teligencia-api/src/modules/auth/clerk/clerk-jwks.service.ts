/*
 * Clerk JWT verification via cached JWKS (research D1).
 *
 * - Uses @clerk/backend's verifyToken with networkless mode (jwksCacheTtlInMs).
 * - No synchronous Clerk callout on the request hot path under steady state.
 * - On `kid` miss the underlying jose/Clerk client auto-refreshes the JWKS.
 *
 * Throws on signature / expiry / issuer mismatch; the auth guard maps those
 * to UnauthorizedException + AUTH_FAILED audit (credentialed-but-rejected).
 */

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';

export interface VerifiedClerkClaims {
  /** Clerk user id */
  sub: string;
  /** session id (used for SESSION_STARTED dedupe) */
  sid?: string;
  /** Clerk organization id when active org is set on the JWT */
  org_id?: string;
  iss: string;
  exp: number;
  iat: number;
  [claim: string]: unknown;
}

@Injectable()
export class ClerkJwksService {
  private readonly logger = new Logger(ClerkJwksService.name);
  private readonly secretKey: string;
  private readonly issuer: string;

  constructor(config: ConfigService) {
    this.secretKey = config.getOrThrow<string>('CLERK_SECRET_KEY');
    this.issuer = config.getOrThrow<string>('CLERK_ISSUER');
  }

  /**
   * Verify a Clerk-issued JWT. Returns the parsed claims on success.
   * Throws (with a generic message) on any verification failure.
   */
  async verify(token: string): Promise<VerifiedClerkClaims> {
    try {
      const claims = (await verifyToken(token, {
        secretKey: this.secretKey,
        issuer: this.issuer,
      })) as unknown as VerifiedClerkClaims;
      return claims;
    } catch (err) {
      // Generic surface — actual reason logged server-side only (FR-016).
      this.logger.warn(
        `Clerk token verification failed: ${(err as Error).message ?? 'unknown'}`,
      );
      throw new Error('token_invalid');
    }
  }
}
