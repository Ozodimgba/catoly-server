// src/chat/chat.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ClientSession, Model, Types } from 'mongoose';
import {
  AIThread,
  Conversation,
  ConversationDocument,
} from './schemas/conversation.schema';
import { HttpService } from '@nestjs/axios';
import { catchError, firstValueFrom, map, Observable } from 'rxjs';
import axios, { AxiosResponse } from 'axios';
import { User } from 'src/user/schema/user.schema';
import { AddMessageProps } from './chat.dto';
import {
  Message,
  MessageDocument,
  MessageType,
} from './schemas/message.schema';
import { ObjectId } from 'typeorm';
import { ChatEvent } from './chat.type';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ChatService {
  logger = new Logger(ChatService.name);
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name) private messageModel: Model<MessageDocument>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(AIThread.name) private aiThreadModel: Model<AIThread>,
    private configService: ConfigService,

    private readonly httpService: HttpService,
  ) {}

  async createConversation(userId: string): Promise<ConversationDocument> {
    try {
      // const session = await this.conversationModel.db.startSession();
      const threadCount = await this.getNewThreadId();

      const conversation = new this.conversationModel({
        userId,
        threadId: threadCount.threadCount,
      });

      console.log(conversation);

      await conversation.save();
      // await session.commitTransaction()
      return conversation;
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  async getConversations(userId: string, page = 1, limit = 20) {
    try {
      // return this.conversationModel.find()
      return this.conversationModel
        .find({ userId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('lastMessage', 'content')
        .exec();
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  async getConversation(
    userId: string,
    conversationId: string,
    page = 1,
    limit = 20,
  ) {
    // const conversation = await this.conversationModel
    //   .findOne({ userId, conversationId })
    //   .exec();
    try {
      const messages = await this.messageModel
        // .find({ userId: '6792d0075149ce750e57aada' })
        // .find({ userId, conversation: conversationId })
        // .find({ conversation: conversationId, userId })
        // .find({ userId,  })
        .find({ conversation: conversationId, userId })
        .sort({ createdAt: 'asc' })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('userId')
        .exec();

      if (!conversationId) {
        throw new NotFoundException('Conversation not found');
      }

      // Calculate skip for pagination
      // const skip = (page - 1) * limit;

      // Get paginated messages
      // const messages = conversation.messages
      //   .slice(skip, skip + limit)
      //   .sort(
      //     (a, b) =>
      //       new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      //   );

      return {
        // ...conversation.toObject(),
        message: 'Successfully fetched messages',
        messages,
        // hasMore: skip + limit < conversation.messages.length,
        // total: conversation.messages.length,
      };
    } catch (error) {
      throw error;
    }
  }

  async addMessage({ content, role, conversation, userId }: AddMessageProps) {
    // const message = {
    //   content,
    //   role,
    //   userId,
    //   timestamp: new Date(),
    //   reactions: [],
    // };
    const message = new this.messageModel({
      userId,
      conversation,
      content: content,
      type: MessageType.TEXT,
      role,
    });

    // const updatedConversation = await this.conversationModel.findOneAndUpdate(
    //   { threadId },
    //   {
    //     $push: { messages: message },
    //     $set: {
    //       lastMessage: content,
    //       lastMessageAt: new Date(),
    //     },
    //   },
    //   { new: true },
    // );

    const convo = await this.conversationModel.findByIdAndUpdate(conversation, {
      lastMessage: message._id,
    });

    if (!convo) {
      throw new NotFoundException('Conversation not found');
    }

    await message.save();

    return convo;
  }

  // private lastThreadId = 0;
  // private async createAIThread(): Promise<number> {
  //   try {
  //     const response = await axios.post('http://52.26.233.41/agent', {
  //       question: 'Start a new conversation',
  //       thread_id: 0,
  //     });

  //     this.lastThreadId += 1;

  //     console.log('Generated threadId:', this.lastThreadId);
  //     return this.lastThreadId;
  //   } catch (error) {
  //     throw new Error(`Failed to create AI thread: ${error.message}`);
  //   }
  // }

  async getNewThreadId(): Promise<AIThread> {
    try {
      const thread = await this.aiThreadModel.find({ name: 'default' });
      let newThread;
      if (!thread.length) {
        newThread = new this.aiThreadModel({ threadCount: 1, name: 'default' });
        return await newThread.save();
      }

      newThread = await this.aiThreadModel.findOneAndUpdate(
        { name: 'default' },
        { $inc: { threadCount: 1 } },
        { new: true },
      );

      return await newThread.save();
      // await session.commitTransaction();
    } catch (error) {
      throw error;
    }
  }

  // async getAIResponse(threadId: number, question: string) {
  //   try {
  //     const response = await axios.post('http://52.26.233.41/agent', {
  //       question,
  //       thread_id: threadId
  //     });

  //     return response.data.result[1].TransactionExplorer.messages[0].content;
  //   } catch (error) {
  //     throw new Error(`Failed to get AI response: ${error.message}`);
  //   }
  // }

  // private async createAIThread(): Promise<string> {
  //   try {
  //     const response = await fetch('http://52.26.233.41/agent', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json'
  //       },
  //       body: JSON.stringify({
  //         question: "Start a new conversation",
  //         thread_id: 0
  //       })
  //     });

  //     if (!response.ok) {
  //       throw new Error('AI service response was not ok');
  //     }

  //     const data = await response.json();
  //     return data.threadId;
  //   } catch (error) {
  //     throw new Error(`Failed to create AI thread: ${error.message}`);
  //   }
  // }

  async switchThread(userId: string, threadId: string) {
    await this.conversationModel.updateMany({ userId }, { isActive: false });

    const conversation = await this.conversationModel.findOneAndUpdate(
      { userId, threadId },
      { isActive: true },
      { new: true },
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async getAIResponse(threadId: number, question: string) {
    try {
      // return this.httpService.post('http://52.26.233.41/agent', {
      // // const response = this.httpService.post('http://52.26.233.41/agent', {
      //   headers: {
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({
      //     question,
      //     thread_id: threadId
      //   })
      // })
      // .pipe(
      //   map((response: AxiosResponse) => response.data),
      //   catchError((error) => {
      //     throw new Error(`Failed to fetch data: ${error.message}`);
      //   })
      // )

      const response = await firstValueFrom(
        this.httpService
          .post(
            // 'https://chat.catoly.ai/agent/agent',
            // 'https://catolyai-app-6tqpm.ondigitalocean.app/agent',
            'http://52.26.233.41/agent',
            {
              // const response = this.httpService.post('http://52.26.233.41/agent', {
              question,
              thread_id: threadId || 3,
              // body: JSON.stringify({
              //   // thread_id: threadId
              // })
            },
            {
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )
          .pipe(map((response: AxiosResponse) => response.data)),
      );
      return response;

      // if (!response.ok) {
      //   throw new Error('AI service response was not ok');
      // }

      // const data = await response.json();
      // return data.result[1].TransactionExplorer.messages[0].content;
    } catch (error) {
      console.log(error);

      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }
  
  getStreamingAIResponse(question: string, thread_id: number): Observable<any> {
    return new Observable((subscriber) => {
      let streamedContent = "";
      const AiBaseUrl = this.configService.get<string>('AI_AGENT_BASEURL');
      
      // Complete buffer for reconstructing split messages
      let rawBuffer = "";

      const processedTools = new Set<string>();
  
      const MESSAGE_TYPES = {
        TOOL: 'Tool :',
        TOLY: 'Toly :'
      };
      
      const IDENTIFIER_LENGTH = 6; // Both identifiers are 6 chars long
      
      const findNextMessageStart = (currentPos: number): number => {
        let nextPos = Infinity;
        
        Object.values(MESSAGE_TYPES).forEach(identifier => {
          const pos = rawBuffer.indexOf(identifier, currentPos + IDENTIFIER_LENGTH);
          if (pos >= 0 && pos < nextPos) {
            nextPos = pos;
          }
        });
        
        return nextPos;
      };
      
      // Extract message content from the buffer
      const extractMessageContent = (startPos: number): { content: string, nextMsgStart: number } => {
        const nextMsgStart = findNextMessageStart(startPos);
        
        const content = nextMsgStart !== Infinity 
          ? rawBuffer.substring(startPos + IDENTIFIER_LENGTH, nextMsgStart)
          : rawBuffer.substring(startPos + IDENTIFIER_LENGTH);
          
        return { content, nextMsgStart };
      };
      
      const processToolMessage = (content: string, isEnd: boolean): boolean => {
        try {
          const jsonStr = content.trim();
          const toolData = JSON.parse(jsonStr);
          
          // Create a unique key for this tool to prevent duplicates
          const toolKey = `${toolData.tool_name}-${JSON.stringify(toolData.additional_kwargs)}`;
          
          if (!processedTools.has(toolKey)) {
            processedTools.add(toolKey);
            subscriber.next(
              `data: ${JSON.stringify({
                type: 'tool',
                payload: toolData,
              })}\n\n`,
            );
          }
          return true;
        } catch (error) {
          if (isEnd) {
            this.logger.error('Failed to parse tool message at end:', error);
            return true; // Consider processed if we're at the end
          }
          return false; // Not processed, might be incomplete
        }
      };
      
      const processTolyMessage = (content: string, isEnd: boolean): boolean => {
        try {
          const parsedData = JSON.parse(content);
          
          if (parsedData.event === 'on_chat_model_stream' && 
              parsedData.metadata?.langgraph_node === 'Toly') {
            
            const msgContent = parsedData.data.chunk?.content;
            
            if (msgContent) {
              streamedContent += msgContent;
              subscriber.next(`data: ${msgContent}\n\n`);
            }
          }
          return true;
        } catch (error) {
          if (isEnd) {
            this.logger.error('Failed to parse Toly message at end:', error, { content });
            return true; // Consider processed if we're at the end
          }
          return false; // Not processed, might be incomplete
        }
      };
      
      const processMessages = (
        identifier: string, 
        processor: (content: string, isEnd: boolean) => boolean, 
        isEnd = false
      ) => {
        while (true) {
          const msgStart = rawBuffer.indexOf(identifier);
          if (msgStart === -1) break; // No more messages of this type
          
          const { content, nextMsgStart } = extractMessageContent(msgStart);
          
          // If we don't have a complete message and not at the end, wait for more data
          if (nextMsgStart === Infinity && !isEnd) {
            break;
          }
          
          const processed = processor(content, isEnd);
          
          // Update the buffer if processed or at end
          if (processed) {
            rawBuffer = nextMsgStart !== Infinity 
              ? rawBuffer.substring(nextMsgStart)
              : '';
          } else if (!isEnd) {
            // If not processed and not at end, wait for more data
            break;
          } else {
            // At end but failed to process, still remove from buffer
            rawBuffer = nextMsgStart !== Infinity 
              ? rawBuffer.substring(nextMsgStart)
              : '';
          }
        }
      };
      

      const processBufferedData = (isEnd = false) => {
        // NOTE processMessage should always be processed first Abeg
        processMessages(MESSAGE_TYPES.TOOL, processToolMessage, isEnd);
        
        processMessages(MESSAGE_TYPES.TOLY, processTolyMessage, isEnd);
      };
      

      this.httpService
        .axiosRef({
          method: 'POST',
          url: `${AiBaseUrl}/agent`,
          data: { question, thread_id },
          headers: { 'Content-Type': 'application/json' },
          responseType: 'stream',
        })
        .then((response) => {

          response.data.on('data', (chunk: Buffer) => {
            try {
              const text = chunk.toString('utf-8');
              this.logger.debug(`Raw chunk: ${text}`);
              rawBuffer += text;
              processBufferedData();
            } catch (error) {
              this.logger.error('Stream processing error:', error);
            }
          });
  
          response.data.on('end', () => {
            // Process any remaining data from incomplete chunks
            processBufferedData(true);
            
            this.logger.log("Complete content", streamedContent);
            
            subscriber.next({
              type: 'content',
              payload: null,
              completeContent: streamedContent
            });
            
            subscriber.complete();
          });
  
          response.data.on('error', (error) => {
            this.logger.error('Stream error:', error);
            subscriber.error(error);
          });
        })
        .catch((error) => {
          this.logger.error('Request error:', error);
          subscriber.error(error);
        });
  
      return () => {
        console.log('Cleaning up stream subscription');
      };
    });
  }
  

  getMockStreamingResponse(question: string): Observable<string> {
    const mockResponses = {
      default:
        "I apologize, but I don't have enough context to provide a specific answer.",
      greeting: 'Hello! How can I assist you today?',
      help: 'I can help you with various tasks. What would you like to know?',
      code: "Here's an example code:\n```typescript\nconst hello = () => {\n  console.log('Hello world');\n}\n```",
    };

    return new Observable((subscriber) => {
      const words = (
        mockResponses[question.toLowerCase()] || mockResponses.default
      ).split(' ');

      let currentIndex = 0;

      const interval = setInterval(() => {
        if (currentIndex < words.length) {
          subscriber.next(words[currentIndex] + ' ');
          currentIndex++;
        } else {
          clearInterval(interval);
          subscriber.complete();
        }
      }, 200);

      return () => clearInterval(interval);
    });
  }

  // async deleteMessage(messageId: string, userId: string) {
  //   const message = await this.messageModel.findById(messageId);

  //   if (!message) {
  //     throw new NotFoundException('Message not found');
  //   }

  //   if (message.userId !== userId) {
  //     throw new UnauthorizedException('Not authorized to delete this message');
  //   }

  //   await message.deleteOne();

  //   // Update conversation's lastMessage if needed
  //   const conversation = await this.conversationModel.findOne({
  //     'messages._id': messageId,
  //   });

  //   if (conversation) {
  //     const messages = conversation.messages.filter(
  //       (m) => m._id.toString() !== messageId,
  //     );
  //     const lastMessage = messages[messages.length - 1];

  //     await this.conversationModel.updateOne(
  //       { _id: conversation._id },
  //       {
  //         messages,
  //         lastMessage: lastMessage?.content || '',
  //         lastMessageAt: lastMessage?.timestamp || new Date(),
  //       },
  //     );
  //   }

  //   return { success: true };
  // }

  // async addReaction(messageId: string, emoji: string, userId: string) {
  //   const message = await this.messageModel.findById(messageId);

  //   if (!message) {
  //     throw new NotFoundException('Message not found');
  //   }

  //   const reactionIndex = message.reactions.findIndex((r) => r.emoji === emoji);

  //   if (reactionIndex > -1) {
  //     const reaction = message.reactions[reactionIndex];
  //     const userIndex = reaction.users.indexOf(userId);

  //     if (userIndex > -1) {
  //       reaction.users.splice(userIndex, 1);
  //       reaction.count--;
  //       if (reaction.count === 0) {
  //         message.reactions.splice(reactionIndex, 1);
  //       }
  //     } else {
  //       reaction.users.push(userId);
  //       reaction.count++;
  //     }
  //   } else {
  //     message.reactions.push({
  //       emoji,
  //       count: 1,
  //       users: [userId],
  //     });
  //   }

  //   await message.save();
  //   return message;
  // }

  // async handleMessageFlow(threadId: number, content: string) {
  //   // 1. Get conversation to verify it exists and get userId
  //   const conversation = await this.conversationModel.findOne({ threadId });
  //   if (!conversation) {
  //     throw new NotFoundException('Conversation not found');
  //   }

  //   // 2. Save user message
  //   await this.addMessage(threadId, content, 'user', conversation.userId);

  //   try {
  //     // 3. Get AI response
  //     const aiResponse = await this.getAIResponse(threadId, content);

  //     // 4. Save AI response
  //     return await this.addMessage(
  //       threadId,
  //       aiResponse,
  //       'assistant',
  //       conversation.userId,
  //     );
  //   } catch (error) {
  //     throw new Error(`Failed to process message: ${error.message}`);
  //   }
  // }

  // async editMessage(messageId: string, content: string, userId: string) {
  //   const message = await this.messageModel.findById(messageId);

  //   if (!message) {
  //     throw new NotFoundException('Message not found');
  //   }

  //   if (message.userId !== userId) {
  //     throw new UnauthorizedException('Not authorized to edit this message');
  //   }

  //   if (message.role !== 'user') {
  //     throw new UnauthorizedException('Cannot edit AI responses');
  //   }

  //   message.content = content;
  //   message.editedAt = new Date();
  //   await message.save();

  //   return message;
  // }
}
