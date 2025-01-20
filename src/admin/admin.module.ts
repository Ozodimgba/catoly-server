// src/admin/admin.module.ts
import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { WhitelistModule } from '../whitelist/whitelist.module';
import { ConfigModule } from '@nestjs/config';
import { AdminService } from './admin.service';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [
    WhitelistModule,
    ConfigModule,
    JwtModule.register({}) // Add JwtModule
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminGuard], // Add these providers
})
export class AdminModule {}