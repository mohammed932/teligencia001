/*
 * Root NestJS module — registers feature modules.
 * Feature modules will be added as the platform grows:
 *  - AuthModule, ProjectsModule, FindingsModule, ReportsModule,
 *    EvidenceModule, AuditModule, etc.
 */

import { Module } from '@nestjs/common';
import { HealthModule } from './health/health.module';

@Module({
  imports: [HealthModule],
  controllers: [],
  providers: []
})
export class AppModule {}
