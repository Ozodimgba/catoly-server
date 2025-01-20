// src/auth/privy.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as jwt from 'jsonwebtoken';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class PrivyService {
  private readonly jwksClient;

  constructor(private configService: ConfigService) {
    // Initialize JWKS client
    this.jwksClient = jwksClient({
      jwksUri: this.configService.get<string>('PRIVY_JWKS_URL'),
      cache: true,
      rateLimit: true,
    });
  }

  async verifyToken(token: string): Promise<any> {
    try {
      // Decode token without verification to get kid (key id)
      const decoded = jwt.decode(token, { complete: true });
      if (!decoded || !decoded.header.kid) {
        throw new UnauthorizedException('Invalid token format');
      }

      // Get the public key from Privy's JWKS endpoint
      const key = await this.jwksClient.getSigningKey(decoded.header.kid);
      const publicKey = key.getPublicKey();

      // Verify the token
      const verified = jwt.verify(token, publicKey, {
        algorithms: ['ES256'],
        audience: this.configService.get<string>('PRIVY_APP_ID'),
        issuer: 'privy.io'
      });

      console.log('Token verified for user:', verified.sub);
      return verified;

    } catch (error) {
      console.error('Token verification failed:', error.message);
      throw new UnauthorizedException('Invalid token');
    }
  }

  // Method to make authenticated requests to Privy's API
  async getUserData(userId: string): Promise<any> {
    try {
      const response = await axios.get(
        `https://auth.privy.io/api/v1/users/${userId}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('PRIVY_APP_SECRET')}`
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user data:', error.message);
      throw error;
    }
  }
}