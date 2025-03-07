// src/chat/chat.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { 
  AIThread,
  AIThreadSchema,
  Conversation, 
  ConversationSchema,
} from './schemas/conversation.schema';
import { AuthModule } from '../auth/auth.module';
import { HttpModule } from '@nestjs/axios';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { Message, MessageSchema } from './schemas/message.schema';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Conversation.name, schema: ConversationSchema },
      { name: Message.name, schema: MessageSchema },
      { name: User.name, schema: UserSchema },
      { name: AIThread.name, schema: AIThreadSchema }
    ]),
    AuthModule,
    HttpModule,
    ConfigModule
  ],
  controllers: [ChatController],
  providers: [ChatService],
  exports: [ChatService]
})
export class ChatModule {}

