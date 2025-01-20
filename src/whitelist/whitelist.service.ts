// src/whitelist/whitelist.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThrottlerException } from '@nestjs/throttler';
import * as crypto from 'crypto';
import { 
  WhitelistedUser, 
  WhitelistedUserDocument,
  AccessCode,
  AccessCodeDocument 
} from './schemas/whitelist.schema';

@Injectable()
export class WhitelistService {
  constructor(
    @InjectModel(WhitelistedUser.name) 
    private whitelistedUserModel: Model<WhitelistedUserDocument>,
    @InjectModel(AccessCode.name) 
    private accessCodeModel: Model<AccessCodeDocument>
  ) {}

  async generateAccessCodes(amount: number, expiresInDays: number) {
    const codes: AccessCode[] = [];
    
    for (let i = 0; i < amount; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
      
      const accessCode = new this.accessCodeModel({
        code,
        expiresAt,
      });
      
      codes.push(await accessCode.save());
    }

    return codes;
  }

  async getAllCodes() {
    return this.accessCodeModel.find().sort({ createdAt: -1 }).exec();
  }

  async validateAccessCode(code: string, userId: string) {
    // Check if user is already whitelisted
    const existingWhitelist = await this.whitelistedUserModel.findOne({
      privyUserId: userId
    }).exec();

    if (existingWhitelist) {
      return { isWhitelisted: true };
    }

    // Get access code
    const accessCode = await this.accessCodeModel.findOne({
      code,
      isUsed: false
    }).exec();

    if (!accessCode) {
      throw new UnauthorizedException('Invalid access code');
    }

    // Check if code is expired
    if (accessCode.expiresAt < new Date()) {
      throw new UnauthorizedException('Access code has expired');
    }

    // Check rate limiting
    if (accessCode.attempts >= 3) {
      throw new ThrottlerException('Too many attempts for this code');
    }

    // Mark code as used and create whitelist entry
    accessCode.isUsed = true;
    accessCode.usedBy = userId;
    await accessCode.save();

    const whitelistedUser = new this.whitelistedUserModel({
      privyUserId: userId,
      accessCode: code
    });
    await whitelistedUser.save();

    return { isWhitelisted: true };
  }

  async revokeAccessCode(code: string) {
    const accessCode = await this.accessCodeModel.findOne({ code }).exec();

    if (!accessCode) {
      throw new UnauthorizedException('Code not found');
    }

    // If code was used, remove whitelist entry
    if (accessCode.usedBy) {
      await this.whitelistedUserModel.deleteOne({
        privyUserId: accessCode.usedBy
      }).exec();
    }

    await this.accessCodeModel.deleteOne({ code }).exec();
    return { message: 'Code revoked successfully' };
  }

  async isWhitelisted(userId: string) {
    const whitelistedUser = await this.whitelistedUserModel.findOne({
      privyUserId: userId
    }).exec();
    return !!whitelistedUser;
  }

  async incrementAttempts(code: string) {
    await this.accessCodeModel.updateOne(
      { code },
      { $inc: { attempts: 1 } }
    ).exec();
  }
}