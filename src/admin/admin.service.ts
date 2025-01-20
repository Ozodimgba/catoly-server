// src/admin/admin.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ThrottlerException } from '@nestjs/throttler';

@Injectable()
export class AdminService {
  private loginAttempts: Map<string, { count: number; firstAttempt: Date }> = new Map();

  constructor(private jwtService: JwtService) {}

  private checkRateLimit(ip: string) {
    const now = new Date();
    const attempt = this.loginAttempts.get(ip);

    if (attempt) {
      // Reset after 15 minutes
      if (now.getTime() - attempt.firstAttempt.getTime() > 15 * 60 * 1000) {
        this.loginAttempts.set(ip, { count: 1, firstAttempt: now });
        return;
      }

      if (attempt.count >= 5) {
        throw new ThrottlerException('Too many login attempts. Try again in 15 minutes.');
      }

      this.loginAttempts.set(ip, {
        count: attempt.count + 1,
        firstAttempt: attempt.firstAttempt
      });
    } else {
      this.loginAttempts.set(ip, { count: 1, firstAttempt: now });
    }
  }

  async validateAdmin(username: string, password: string, ip: string) {
    this.checkRateLimit(ip);

    if (username !== process.env.ADMIN_USERNAME) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      password,
      process.env.ADMIN_PASSWORD_HASH!
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token with expiration
    const token = this.jwtService.sign(
      { username, role: 'admin' },
      {
        expiresIn: '1h',
        secret: process.env.ADMIN_JWT_SECRET
      }
    );

    return { token };
  }

  async verifyToken(token: string) {
    try {
      const decoded = this.jwtService.verify(token, {
        secret: process.env.ADMIN_JWT_SECRET
      });
      return decoded;
    } catch {
      throw new UnauthorizedException('Invalid admin token');
    }
  }
}