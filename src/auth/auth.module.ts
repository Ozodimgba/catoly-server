// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrivyService } from './privy.service';
import { AuthController } from './auth.controller';
import { PrivyAuthGuard } from './privy.guard';

@Module({
  imports: [ConfigModule],
  controllers: [AuthController],
  providers: [PrivyService, PrivyAuthGuard],
  exports: [PrivyService, PrivyAuthGuard],
})
export class AuthModule {}