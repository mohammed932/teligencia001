/*
 * HealthModule — single endpoint GET /api/v1/health.
 * Used by load balancer + the two Angular apps to verify the API is reachable.
 */

import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController]
})
export class HealthModule {}
