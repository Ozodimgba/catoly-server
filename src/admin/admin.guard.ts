// src/admin/admin.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { AdminService } from './admin.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private adminService: AdminService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'];

    if (!token) {
      throw new UnauthorizedException('Admin token required');
    }

    try {
      const decoded = await this.adminService.verifyToken(token);
      request.admin = decoded;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}