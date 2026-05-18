/*
 * Maps UnauthorizedException / ForbiddenException to the canonical generic
 * envelope { "error": "<enum>" } per contracts/auth-me.openapi.yaml.
 * Strips stack traces, role names, and any internal detail before
 * responses leave the server (Security Checklist #8, FR-016, SC-008).
 */

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpStatus,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(UnauthorizedException, ForbiddenException)
export class GenericAuthErrorFilter implements ExceptionFilter<
  UnauthorizedException | ForbiddenException
> {
  private readonly logger = new Logger(GenericAuthErrorFilter.name);

  catch(
    exception: UnauthorizedException | ForbiddenException,
    host: ArgumentsHost,
  ): void {
    const res = host.switchToHttp().getResponse<Response>();
    const status =
      exception instanceof UnauthorizedException
        ? HttpStatus.UNAUTHORIZED
        : HttpStatus.FORBIDDEN;

    // Read the exception body if the caller used `new XException({ error: '...' })`;
    // otherwise fall back to a strictly safe default per status.
    const responseBody = exception.getResponse();
    const error =
      typeof responseBody === 'object' &&
      responseBody !== null &&
      typeof (responseBody as { error?: unknown }).error === 'string'
        ? (responseBody as { error: string }).error
        : status === HttpStatus.UNAUTHORIZED
          ? 'unauthorized'
          : 'forbidden';

    // Log the real reason server-side only.
    this.logger.debug(`auth-error ${status}: ${exception.message}`);

    res.status(status).json({ error });
  }
}
