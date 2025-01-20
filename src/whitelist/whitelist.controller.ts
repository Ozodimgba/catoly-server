// src/whitelist/whitelist.controller.ts
import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';
import { PrivyAuthGuard } from '../auth/privy.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('whitelist')
export class WhitelistController {
  constructor(private whitelistService: WhitelistService) {}

  @Post('validate-code')
  @UseGuards(PrivyAuthGuard)
  async validateCode(
    @Body('code') code: string,
    @GetUser() user: any
  ) {
    return this.whitelistService.validateAccessCode(code, user.sub);
  }

  @Post('check-status')
  @UseGuards(PrivyAuthGuard)
  async checkWhitelistStatus(@GetUser() user: any) {
    return {
      isWhitelisted: await this.whitelistService.isWhitelisted(user.sub)
    };
  }
}