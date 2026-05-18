/*
 * AuthController — Feature 001 endpoints.
 *   GET  /auth/me        — returns CurrentUserDto (requires auth)
 *   POST /auth/sign-out  — writes SESSION_ENDED audit (requires auth)
 *
 * /auth/demo-admin-only — permanent canary that exercises @Roles().
 */

import {
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ClassSerializerInterceptor } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser as CurrentUserType } from '../../common/types/current-user';
import { CurrentUserDto } from './dto/current-user.dto';
import { AuthService } from './auth.service';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * Return the authenticated user. Side-effect: emits SESSION_STARTED
   * once per session id (the service deduplicates).
   */
  @Get('me')
  @ApiOkResponse({ type: CurrentUserDto })
  @ApiUnauthorizedResponse({ description: 'No / malformed / expired token' })
  @ApiForbiddenResponse({ description: 'No users row or role unprovisioned' })
  async me(
    @CurrentUser() user: CurrentUserType,
    @Req() req: Request,
  ): Promise<CurrentUserDto> {
    const sessionId =
      (req as Request & { auth?: { sid?: string } }).auth?.sid ?? null;
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? null;
    await this.authService.recordSessionStarted(user.id, sessionId, requestId);

    return plainToInstance(
      CurrentUserDto,
      {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        orgId: user.orgId,
      },
      { excludeExtraneousValues: true },
    );
  }

  /**
   * Application sign-out hook. Clerk revokes the session itself; this
   * endpoint exists so the application can write the audit entry.
   */
  @Post('sign-out')
  @HttpCode(204)
  async signOut(
    @CurrentUser() user: CurrentUserType,
    @Req() req: Request,
  ): Promise<void> {
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? null;
    await this.authService.recordSessionEnded(user.id, requestId);
  }

  /**
   * Canary endpoint exercising @Roles(). Permanent.
   * Used by tests/auth/roles.guard.e2e.spec.ts to verify allow/deny.
   */
  @Get('demo-admin-only')
  @Roles('lab_admin')
  demoAdminOnly(): { ok: true } {
    return { ok: true };
  }
}
