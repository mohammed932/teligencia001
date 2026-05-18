/*
 * RolesGuard — second-pass authorization based on @Roles() metadata.
 * Runs AFTER ClerkAuthGuard. A handler with no @Roles() still requires
 * authentication; this guard returns true for those.
 *
 * On role mismatch: 403 + AUTH_FAILED audit (Clarification 5 includes
 * "role check failed" under credentialed-but-rejected).
 */

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { StaffRole } from '../types/staff-role';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly audit: AuditService,
  ) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const required = this.reflector.getAllAndOverride<StaffRole[] | undefined>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!required || required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest<Request>();
    const user = req.user;
    if (!user) {
      // Shouldn't happen — ClerkAuthGuard runs first. Defensive 403.
      throw new ForbiddenException({ error: 'forbidden' });
    }

    if (!required.includes(user.role)) {
      await this.audit.record({
        action: 'AUTH_FAILED',
        actorId: user.id,
        outcome: 'rejected',
        payload: { reason: 'role_mismatch', required, actual: user.role },
      });
      throw new ForbiddenException({ error: 'forbidden' });
    }

    return true;
  }
}
