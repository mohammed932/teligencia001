/*
 * WebhooksController — Clerk lifecycle events.
 *
 * Auth model:
 *   - @Public()  → opts out of ClerkAuthGuard.
 *   - @UseGuards(WebhookSignatureGuard) → svix verification before any handler.
 *
 * Idempotency:
 *   - WebhookDeliveriesRepository.tryClaim(svix_id) returns false on replay.
 *   - Replays return 200 {status:'skipped'} with no side effects.
 *
 * org-mapping failure:
 *   - UnmappedOrgError → 422 + AUTH_FAILED audit (research D2).
 */

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
  Req,
  UnprocessableEntityException,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { AuditService } from '../../common/audit/audit.service';
import { UnmappedOrgError } from '../users/users.repository';
import { WebhookSignatureGuard } from './webhook-signature.guard';
import { WebhookDeliveriesRepository } from './webhook-deliveries.repository';
import { UserCreatedHandler } from './handlers/user-created.handler';
import { UserUpdatedHandler } from './handlers/user-updated.handler';
import { SessionCreatedHandler } from './handlers/session-created.handler';
import {
  ClerkEvent,
  ClerkSessionEventData,
  ClerkUserEventData,
} from './clerk-event.types';

@ApiTags('Webhooks')
@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly ledger: WebhookDeliveriesRepository,
    private readonly audit: AuditService,
    private readonly userCreated: UserCreatedHandler,
    private readonly userUpdated: UserUpdatedHandler,
    private readonly sessionCreated: SessionCreatedHandler,
  ) {}

  @Post('clerk')
  @Public()
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(HttpStatus.OK)
  async receive(
    @Body() event: ClerkEvent,
    @Req() req: Request & { verifiedSvixId?: string },
  ): Promise<{ status: 'processed' | 'skipped' }> {
    const svixId = req.verifiedSvixId!;
    const requestId =
      (req.headers['x-request-id'] as string | undefined) ?? null;

    // Idempotency check — short-circuit replays BEFORE any side effects.
    const fresh = await this.ledger.tryClaim(svixId, event.type);
    if (!fresh) return { status: 'skipped' };

    try {
      switch (event.type) {
        case 'user.created':
          await this.userCreated.handle(
            event.data as ClerkUserEventData,
            requestId,
          );
          break;
        case 'user.updated':
          await this.userUpdated.handle(
            event.data as ClerkUserEventData,
            requestId,
          );
          break;
        case 'session.created':
          await this.sessionCreated.handle(
            event.data as ClerkSessionEventData,
            requestId,
          );
          break;
        default:
          // Unknown event type — accept (svix verified) but do nothing.
          this.logger.debug(`Ignoring event type ${event.type}`);
      }
      return { status: 'processed' };
    } catch (err) {
      if (err instanceof UnmappedOrgError) {
        await this.ledger.markStatus(svixId, 'failed');
        await this.audit.record({
          action: 'AUTH_FAILED',
          actorId: 'clerk_webhook',
          outcome: 'rejected',
          payload: { reason: 'unmapped_org', clerkOrgId: err.clerkOrgId },
        });
        throw new UnprocessableEntityException({ error: 'unmapped_org' });
      }
      await this.ledger.markStatus(svixId, 'failed');
      throw err;
    }
  }
}
