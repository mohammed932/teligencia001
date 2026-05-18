/*
 * ClerkAuthGuard — global authentication guard for the Teligencia API.
 *
 * Flow (matches contracts/guards.md):
 *   1. @Public() route → allow.
 *   2. Missing Authorization header → 401, NO audit (Clarification 5).
 *   3. Token verification failed → 401 + AUTH_FAILED (credentialed-but-rejected).
 *   4. No users row for the verified sub → 403 + AUTH_FAILED (EC-001).
 *   5. users.role IS NULL → 403 + AUTH_FAILED (EC-002).
 *   6. users.is_active = false → 403 + AUTH_FAILED.
 *   7. Populate req.user and continue.
 *
 * Error responses are generic (FR-016). Real reason is logged server-side.
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AuditService } from '../audit/audit.service';
import { ClerkJwksService } from '../../modules/auth/clerk/clerk-jwks.service';
import { UsersRepository } from '../../modules/users/users.repository';
import { isStaffRole } from '../types/staff-role';

@Injectable()
export class ClerkAuthGuard implements CanActivate {
  private readonly logger = new Logger(ClerkAuthGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly clerk: ClerkJwksService,
    private readonly users: UsersRepository,
    private readonly audit: AuditService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const token = extractBearer(req);

    // Step 2 — no header → silent 401 per spec Clarification 5.
    if (!token) {
      throw new UnauthorizedException({ error: 'unauthorized' });
    }

    // Step 3 — verify token; failure is credentialed-but-rejected.
    let claims;
    try {
      claims = await this.clerk.verify(token);
    } catch {
      await this.audit.record({
        action: 'AUTH_FAILED',
        outcome: 'rejected',
        payload: { reason: 'token_invalid' },
      });
      throw new UnauthorizedException({ error: 'unauthorized' });
    }

    const clerkUserId = claims.sub;
    if (!clerkUserId) {
      await this.audit.record({
        action: 'AUTH_FAILED',
        outcome: 'rejected',
        payload: { reason: 'no_sub_claim' },
      });
      throw new UnauthorizedException({ error: 'unauthorized' });
    }

    // Step 4 — DB row required (EC-001).
    const row = await this.users.findByClerkId(clerkUserId);
    if (!row) {
      await this.audit.record({
        action: 'AUTH_FAILED',
        actorId: clerkUserId,
        outcome: 'rejected',
        payload: { reason: 'no_user_row' },
      });
      throw new ForbiddenException({ error: 'account_not_fully_provisioned' });
    }

    // Step 5 — role required (EC-002).
    if (!row.role || !isStaffRole(row.role)) {
      await this.audit.record({
        action: 'AUTH_FAILED',
        actorId: clerkUserId,
        outcome: 'rejected',
        payload: { reason: 'no_role' },
      });
      throw new ForbiddenException({ error: 'account_not_fully_provisioned' });
    }

    // Step 6 — must be active.
    if (!row.is_active) {
      await this.audit.record({
        action: 'AUTH_FAILED',
        actorId: clerkUserId,
        outcome: 'rejected',
        payload: { reason: 'inactive' },
      });
      throw new ForbiddenException({ error: 'account_not_fully_provisioned' });
    }

    req.user = {
      id: row.id,
      orgId: row.org_id,
      email: row.email,
      fullName: row.full_name,
      role: row.role,
    };

    return true;
  }
}

function extractBearer(req: Request): string | null {
  const header = req.headers.authorization;
  if (!header || typeof header !== 'string') return null;
  const [scheme, token] = header.split(' ');
  if (scheme?.toLowerCase() !== 'bearer' || !token) return null;
  return token.trim();
}
