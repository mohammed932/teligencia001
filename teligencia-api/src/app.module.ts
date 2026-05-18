/*
 * Root NestJS module.
 *
 * Global wiring for Feature 001:
 *   - ConfigModule with Joi validation (fail-fast on misconfig).
 *   - SupabaseModule + PgPoolModule + AuditModule (foundational singletons).
 *   - AuthModule + UsersModule.
 *   - APP_GUARD ClerkAuthGuard (runs first; @Public() opts out).
 *   - APP_GUARD RolesGuard (runs after; consumes @Roles()).
 *   - APP_INTERCEPTOR OrgContextInterceptor (sets app.current_org_id).
 *   - APP_FILTER GenericAuthErrorFilter (generic 401/403 envelope).
 */

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { HealthModule } from './health/health.module';
import {
  configValidationSchema,
  configurationFactory,
} from './config/configuration';
import { SupabaseModule } from './common/db/supabase.module';
import { PgPoolModule } from './common/db/pg-pool.module';
import { AuditModule } from './common/audit/audit.module';
import { ClerkAuthGuard } from './common/guards/clerk-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { OrgContextInterceptor } from './common/interceptors/org-context.interceptor';
import { GenericAuthErrorFilter } from './common/filters/generic-auth-error.filter';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { WebhooksModule } from './modules/webhooks/webhooks.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: configValidationSchema,
      load: [configurationFactory],
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),
    SupabaseModule,
    PgPoolModule,
    AuditModule,
    UsersModule,
    AuthModule,
    WebhooksModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ClerkAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: OrgContextInterceptor },
    { provide: APP_FILTER, useClass: GenericAuthErrorFilter },
  ],
})
export class AppModule {}
