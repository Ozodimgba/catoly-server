// src/chat/schemas/conversation.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type MessageDocument = Message & Document;
export type ConversationDocument = Conversation & Document;

interface Reaction {
  emoji: string;
  count: number;
  users: string[];
}

@Schema()
class ReactionSchema {
  @Prop({ required: true })
  emoji: string;

  @Prop({ required: true, default: 1 })
  count: number;

  @Prop([String])
  users: string[];
}

@Schema({ timestamps: true })
export class Message {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true, enum: ['user', 'assistant'] })
  role: 'user' | 'assistant';

  @Prop({ required: true })
  userId: string;

  @Prop({ default: Date.now })
  timestamp: Date;

  @Prop({ type: Date })
  editedAt?: Date;

  @Prop({ type: [ReactionSchema], default: [] })
  reactions: Reaction[];
}

@Schema({ timestamps: true })
export class Conversation {
  @Prop({ type: Types.ObjectId, auto: true })
  _id: Types.ObjectId;

  @Prop({ required: true })
  userId: string;  // Privy user ID

  @Prop({ required: true })
  threadId: string;  // AI thread ID

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [Message] })
  messages: Message[];

  @Prop()
  lastMessage: string;

  @Prop({ default: Date.now })
  lastMessageAt: Date;
}

export const MessageSchema = SchemaFactory.createForClass(Message);
export const ConversationSchema = SchemaFactory.createForClass(Conversation);