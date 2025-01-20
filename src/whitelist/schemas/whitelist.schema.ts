// src/whitelist/schemas/whitelist.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WhitelistedUserDocument = HydratedDocument<WhitelistedUser>;
export type AccessCodeDocument = HydratedDocument<AccessCode>;

@Schema()
export class WhitelistedUser {
  @Prop({ required: true })
  privyUserId: string;

  @Prop({ required: true })
  accessCode: string;

  @Prop({ default: Date.now })
  whitelistedAt: Date;
}

@Schema()
export class AccessCode {
  @Prop({ required: true, unique: true })
  code: string;

  @Prop({ default: false })
  isUsed: boolean;

  @Prop()
  usedBy: string;

  @Prop({ required: true })
  expiresAt: Date;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: 0 })
  attempts: number;
}

export const WhitelistedUserSchema = SchemaFactory.createForClass(WhitelistedUser);
export const AccessCodeSchema = SchemaFactory.createForClass(AccessCode);