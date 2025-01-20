// src/auth/privy.guard.ts
import {
    Injectable,
    CanActivate,
    ExecutionContext,
    UnauthorizedException,
  } from '@nestjs/common';
  import { PrivyService } from './privy.service';
  
  @Injectable()
  export class PrivyAuthGuard implements CanActivate {
    constructor(private privyService: PrivyService) {}
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const request = context.switchToHttp().getRequest();
      const token = this.extractTokenFromHeader(request);
      
      if (!token) {
        throw new UnauthorizedException('No token provided');
      }
  
      try {
        // Verify the token
        const verifiedToken = await this.privyService.verifyToken(token);
        
        // Get additional user data if needed
        const userData = await this.privyService.getUserData(verifiedToken.sub);
        
        // Add both token payload and user data to request
        request.user = {
          ...verifiedToken,
          ...userData,
        };
        
        return true;
      } catch (error) {
        console.error('Authentication failed:', error.message);
        throw new UnauthorizedException('Invalid token');
      }
    }
  
    private extractTokenFromHeader(request: any): string | undefined {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }
  }