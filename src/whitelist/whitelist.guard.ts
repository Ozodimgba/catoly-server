// src/whitelist/whitelist.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WhitelistService } from './whitelist.service';

@Injectable()
export class WhitelistGuard implements CanActivate {
  constructor(private whitelistService: WhitelistService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return this.whitelistService.isWhitelisted(user.sub);
  }
}