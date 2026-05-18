import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from '../../common/db/supabase.module';
import { UsersModule } from '../users/users.module';
import { WebhooksController } from './webhooks.controller';
import { WebhookSignatureGuard } from './webhook-signature.guard';
import { WebhookDeliveriesRepository } from './webhook-deliveries.repository';
import { UserCreatedHandler } from './handlers/user-created.handler';
import { UserUpdatedHandler } from './handlers/user-updated.handler';
import { SessionCreatedHandler } from './handlers/session-created.handler';

@Module({
  imports: [ConfigModule, SupabaseModule, UsersModule],
  controllers: [WebhooksController],
  providers: [
    WebhookSignatureGuard,
    WebhookDeliveriesRepository,
    UserCreatedHandler,
    UserUpdatedHandler,
    SessionCreatedHandler,
  ],
})
export class WebhooksModule {}
