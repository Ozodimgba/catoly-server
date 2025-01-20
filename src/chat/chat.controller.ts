// src/chat/chat.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Param, 
  Delete, 
  Put,
  HttpException,
  HttpStatus 
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrivyAuthGuard } from '../auth/privy.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('chat')
@UseGuards(PrivyAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('conversations')
  async createConversation(@GetUser() user: any) {
    try {
      return await this.chatService.createConversation(user.sub);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create conversation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversations')
  async getConversations(@GetUser() user: any) {
    try {
      return await this.chatService.getConversations(user.sub);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get conversations',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('conversations/:threadId')
  async getConversation(
    @GetUser() user: any,
    @Param('threadId') threadId: string
  ) {
    try {
      return await this.chatService.getConversation(user.sub, threadId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get conversation',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('conversations/:threadId/messages')
  async sendMessage(
    @GetUser() user: any,
    @Param('threadId') threadId: string,
    @Body() body: { content: string }
  ) {
    try {
      await this.chatService.addMessage(
        user.sub,
        threadId,
        body.content,
        'user'
      );

      // Get AI response
      const aiResponse = await this.chatService.getAIResponse(threadId, body.content);

      // Add AI response
      return await this.chatService.addMessage(
        user.sub,
        threadId,
        aiResponse,
        'assistant'
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to send message',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('conversations/:threadId/switch')
  async switchThread(
    @GetUser() user: any,
    @Param('threadId') threadId: string
  ) {
    try {
      return await this.chatService.switchThread(user.sub, threadId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to switch thread',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('messages/:id')
  async deleteMessage(
    @Param('id') messageId: string,
    @GetUser() user: any
  ) {
    try {
      return await this.chatService.deleteMessage(messageId, user.sub);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to delete message',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('messages/:id/react')
  async reactToMessage(
    @Param('id') messageId: string,
    @Body() data: { emoji: string },
    @GetUser() user: any
  ) {
    try {
      return await this.chatService.addReaction(messageId, data.emoji, user.sub);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to add reaction',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put('messages/:id')
  async editMessage(
    @Param('id') messageId: string,
    @Body() data: { content: string },
    @GetUser() user: any
  ) {
    try {
      return await this.chatService.editMessage(messageId, data.content, user.sub);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to edit message',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}