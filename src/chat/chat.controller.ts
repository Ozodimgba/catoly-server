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
  HttpStatus,
  DefaultValuePipe,
  Query,
  ParseIntPipe,
  NotFoundException,
  Sse,
  Res,
  Req,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { PrivyAuthGuard } from '../auth/privy.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Observable } from 'rxjs';
import { map, catchError, finalize } from 'rxjs/operators';
import { Response as ExpressResponse, Request } from 'express';
import { AuthGuard } from 'src/guard/auth.guard';
import { User } from 'src/user/schema/user.schema';
import { Message } from './schemas/message.schema';
import { Conversation } from './schemas/conversation.schema';
import { AddMessageProps } from './chat.dto';

@Controller('chat')
@UseGuards(AuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post('create-conversations')
  async createConversation(@Req() request: Request) {
    const user = request['user'];
    try {
      // const randomUserId = `user_${Math.floor(Math.random() * 1000000)}`;
      const data = await this.chatService.createConversation(user.id);
      return {
        message: 'Successfully Created conversation',
        data: data.toObject(),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create conversation',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('conversations')
  async getConversations(
    // @GetUser() user: any,
    @Req() request: Request,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    try {
      const user = request['user'];
      console.log(user);

      return await this.chatService.getConversations(user.id, page, limit);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get conversations',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('conversations/:conversationId')
  async getConversation(
    // @GetUser() user: any,
    @Req() request: Request,
    @Param('conversationId') conversationId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    // : Promise<Message[]> {
    try {
      const user = request['user'];
      return await this.chatService.getConversation(
        user.id,
        conversationId,
        page,
        limit,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get conversation',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('conversations/:threadId/messages')
  async sendMessage(
    @Param('threadId', ParseIntPipe) threadId: number, // Parse as number since threadId is numeric
    @Body() body: { content: string },
  ) {
    try {
      // Let service handle the full flow
      // return await this.chatService.handleMessageFlow(threadId, body.content);

      // await this.chatService.addMessage(
      //   threadId,
      //   body.content,
      //   'user'
      // );

      // Get AI response
      const aiResponse = await this.chatService.getAIResponse(
        threadId,
        body.content,
      );
      // console.log(aiResponse);

      // Add AI response
      // return await this.chatService.addMessage(
      //   threadId,
      //   aiResponse,
      //   'assistant'
      // );

      return {
        message: 'Successfully queried data',
        data: aiResponse,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.message || 'Failed to send message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('stream')
  async streamResponse(
    @Body('question') question: string,
    @Query('conversationId') conversation: string,
    @Query('threadId') threadId: string,
    @Res() response: ExpressResponse,
    @Req() request: Request,
  ): Promise<any> {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');
    let AIResponse = '';

    const user = request['user'];

    let newConversation: Conversation;
    let newThreadId: number = Number(threadId);
    let newConversationId: string = conversation;

    if (!conversation) {
      newConversation = await this.chatService.createConversation(user.id);
      newThreadId = newConversation.threadId;
      newConversationId = newConversation['_id'];
    }

    const chatPayload: AddMessageProps = {
      content: question,
      role: 'user',
      conversation: newConversationId,
      userId: user.id,
    };

    await this.chatService.addMessage(chatPayload);

    this.chatService.getStreamingAIResponse(question, newThreadId).subscribe({
      next: (chunk) => {
        AIResponse += chunk;
        response.write(chunk);
      },
      error: (error) => {
        response.end();
      },
      complete: async () => {
        if (AIResponse) {
          response.end(async () => {
            await this.chatService.addMessage({
              content: AIResponse,
              role: 'assistant',
              conversation: newConversationId,
              userId: user.id,
            });
          });
        } else {
          // Alert the failure of the  Model
          console.warn("Content didn't return content");
        }
      },
    });
  }

  @Post('mock-stream')
  async mockStreamResponse(
    @Body('question') question: string,
    @Res() response: ExpressResponse,
  ): Promise<void> {
    response.setHeader('Content-Type', 'text/event-stream');
    response.setHeader('Cache-Control', 'no-cache');
    response.setHeader('Connection', 'keep-alive');

    this.chatService.getMockStreamingResponse(question).subscribe({
      next: (chunk) => {
        response.write(chunk);
      },
      error: (error) => {
        response.end();
      },
      complete: () => {
        response.end();
      },
    });
  }

  @Post('conversations/:threadId/switch')
  async switchThread(
    @GetUser() user: any,
    @Param('threadId') threadId: string,
  ) {
    try {
      return await this.chatService.switchThread(user.sub, threadId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to switch thread',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // @Delete('messages/:id')
  // async deleteMessage(@Param('id') messageId: string, @GetUser() user: any) {
  //   try {
  //     return await this.chatService.deleteMessage(messageId, user.sub);
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to delete message',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Post('messages/:id/react')
  // async reactToMessage(
  //   @Param('id') messageId: string,
  //   @Body() data: { emoji: string },
  //   @GetUser() user: any,
  // ) {
  //   try {
  //     return await this.chatService.addReaction(
  //       messageId,
  //       data.emoji,
  //       user.sub,
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to add reaction',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }

  // @Put('messages/:id')
  // async editMessage(
  //   @Param('id') messageId: string,
  //   @Body() data: { content: string },
  //   @GetUser() user: any,
  // ) {
  //   try {
  //     return await this.chatService.editMessage(
  //       messageId,
  //       data.content,
  //       user.sub,
  //     );
  //   } catch (error) {
  //     throw new HttpException(
  //       error.message || 'Failed to edit message',
  //       error.status || HttpStatus.INTERNAL_SERVER_ERROR,
  //     );
  //   }
  // }
}
