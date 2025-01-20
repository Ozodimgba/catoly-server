// src/auth/auth.controller.ts
import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { PrivyAuthGuard } from './privy.guard';
import { GetUser } from './decorators/get-user.decorator';
import { PrivyUser } from './types/privy.types';

@Controller('auth')
export class AuthController {
  constructor() {}

  // Test endpoint to verify auth is working
  @Get('me')
  @UseGuards(PrivyAuthGuard)
  getProfile(@GetUser() user: PrivyUser) {
    return {
      userId: user.sub,
      message: 'Authentication successful'
    };
  }
}