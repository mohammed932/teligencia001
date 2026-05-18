import { Module } from '@nestjs/common';
import { SupabaseModule } from '../../common/db/supabase.module';
import { UsersRepository } from './users.repository';

@Module({
  imports: [SupabaseModule],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
