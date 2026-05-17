/*
 * GET /api/v1/health
 * Returns { status, uptime, timestamp, version }.
 * No auth required. Cheap.
 */

import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  @Get()
  check(): {
    status: 'ok';
    uptimeSeconds: number;
    timestamp: string;
    version: string;
  } {
    return {
      status: 'ok',
      uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000),
      timestamp: new Date().toISOString(),
      version: '0.1.0'
    };
  }
}
