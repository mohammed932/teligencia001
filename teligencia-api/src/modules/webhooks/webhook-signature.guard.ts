/*
 * WebhookSignatureGuard — svix verification for the Clerk webhook.
 *
 * The Public() decorator on WebhooksController opts the route out of
 * ClerkAuthGuard. This guard runs in its place and gates the route with
 * the svix signature. On failure: 400 Bad Request with the generic
 * envelope { error: 'invalid_signature' | 'missing_headers' }.
 *
 * Reads the raw request body from req.rawBody (populated by main.ts's
 * raw-body middleware for the webhook route).
 */

import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { Webhook } from 'svix';

@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  private readonly logger = new Logger(WebhookSignatureGuard.name);
  private readonly webhook: Webhook;

  constructor(config: ConfigService) {
    const secret = config.getOrThrow<string>('CLERK_WEBHOOK_SIGNING_SECRET');
    this.webhook = new Webhook(secret);
  }

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx
      .switchToHttp()
      .getRequest<Request & { rawBody?: Buffer; verifiedSvixId?: string }>();

    const svixId = req.headers['svix-id'];
    const svixTs = req.headers['svix-timestamp'];
    const svixSig = req.headers['svix-signature'];

    if (
      typeof svixId !== 'string' ||
      typeof svixTs !== 'string' ||
      typeof svixSig !== 'string'
    ) {
      throw new BadRequestException({ error: 'missing_headers' });
    }
    if (!req.rawBody) {
      this.logger.error(
        'Webhook route missed raw-body middleware — check main.ts wiring',
      );
      throw new BadRequestException({ error: 'missing_headers' });
    }

    try {
      this.webhook.verify(req.rawBody.toString('utf8'), {
        'svix-id': svixId,
        'svix-timestamp': svixTs,
        'svix-signature': svixSig,
      });
    } catch (err) {
      this.logger.warn(
        `svix verification failed: ${(err as Error).message ?? 'unknown'}`,
      );
      throw new BadRequestException({ error: 'invalid_signature' });
    }

    req.verifiedSvixId = svixId;
    return true;
  }
}
