import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ClerkJwksService } from './clerk/clerk-jwks.service';

@Module({
  imports: [ConfigModule, UsersModule],
  controllers: [AuthController],
  providers: [AuthService, ClerkJwksService],
  exports: [ClerkJwksService],
})
export class AuthModule {}
