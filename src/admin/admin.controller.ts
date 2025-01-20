// src/admin/admin.controller.ts
import { Controller, Post, Body, UseGuards, Get, Ip } from '@nestjs/common';
import { AdminGuard } from './admin.guard';
import { WhitelistService } from '../whitelist/whitelist.service';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
    constructor(
        private whitelistService: WhitelistService,
        private adminService: AdminService
      ) {}

    @UseGuards(AdminGuard)
    @Post('revoke-code')
    async revokeCode(@Body() data: { code: string }) {
        return this.whitelistService.revokeAccessCode(data.code);
    }

    @Post('login') 
    async login(
        @Body() credentials: { username: string; password: string },
        @Ip() ip: string
    ) {
        return this.adminService.validateAdmin(
        credentials.username,
        credentials.password,
        ip
        );
    }

    @UseGuards(AdminGuard)
    @Get('codes')
    async getCodes() {
        return this.whitelistService.getAllCodes();
    }

    @UseGuards(AdminGuard) 
    @Post('generate-codes')
    async generateCodes(
        @Body() data: { amount: number; expiresInDays: number }
    ) {
        return this.whitelistService.generateAccessCodes(
        data.amount,
        data.expiresInDays
        );
    }

    @UseGuards(AdminGuard)
    @Get('verify')
    async verifySession() {
        return { valid: true };
    }
}