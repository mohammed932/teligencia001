/*
 * @CurrentUser() — param decorator for handlers to read the authenticated
 * user without touching req.user directly. Throws if used on a route that
 * ClerkAuthGuard did not run on (defensive — should be impossible).
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { CurrentUser as CurrentUserType } from '../types/current-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentUserType => {
    const req = ctx.switchToHttp().getRequest<Request>();
    if (!req.user) {
      throw new Error(
        'CurrentUser decorator used on an unauthenticated route. Add ClerkAuthGuard.',
      );
    }
    return req.user;
  },
);
