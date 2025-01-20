// src/chat/chat.service.ts
import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { 
  Conversation, 
  ConversationDocument,
  Message,
  MessageDocument 
} from './schemas/conversation.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(Conversation.name)
    private conversationModel: Model<ConversationDocument>,
    @InjectModel(Message.name)
    private messageModel: Model<MessageDocument>
  ) {}

  async createConversation(userId: string): Promise<ConversationDocument> {
    try {
      const threadId = await this.createAIThread();
      
      const conversation = new this.conversationModel({
        userId,
        threadId,
        messages: [],
        isActive: true,
        lastMessage: "",
        lastMessageAt: new Date()
      });

      return conversation.save();
    } catch (error) {
      throw new Error(`Failed to create conversation: ${error.message}`);
    }
  }

  async getConversations(userId: string) {
    try {
      return this.conversationModel
        .find({ userId })
        .sort({ lastMessageAt: -1 })
        .exec();
    } catch (error) {
      throw new Error(`Failed to get conversations: ${error.message}`);
    }
  }

  async getConversation(userId: string, threadId: string) {
    const conversation = await this.conversationModel
      .findOne({ userId, threadId })
      .exec();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async addMessage(
    userId: string, 
    threadId: string, 
    content: string, 
    role: 'user' | 'assistant'
  ) {
    const message = new this.messageModel({
      content,
      role,
      userId,
      timestamp: new Date(),
      reactions: []
    });

    const savedMessage = await message.save();

    const updatedConversation = await this.conversationModel.findOneAndUpdate(
      { userId, threadId },
      {
        $push: { messages: savedMessage },
        $set: { 
          lastMessage: content,
          lastMessageAt: new Date()
        }
      },
      { new: true }
    );

    if (!updatedConversation) {
      throw new NotFoundException('Conversation not found');
    }

    return updatedConversation;
  }

  private async createAIThread(): Promise<string> {
    try {
      const response = await fetch('http://52.26.233.41/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question: "Start a new conversation",
          thread_id: 0
        })
      });

      if (!response.ok) {
        throw new Error('AI service response was not ok');
      }

      const data = await response.json();
      return data.threadId;
    } catch (error) {
      throw new Error(`Failed to create AI thread: ${error.message}`);
    }
  }

  async switchThread(userId: string, threadId: string) {
    await this.conversationModel.updateMany(
      { userId },
      { isActive: false }
    );

    const conversation = await this.conversationModel.findOneAndUpdate(
      { userId, threadId },
      { isActive: true },
      { new: true }
    );

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    return conversation;
  }

  async getAIResponse(threadId: string, question: string) {
    try {
      const response = await fetch('http://52.26.233.41/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question,
          thread_id: threadId
        })
      });

      if (!response.ok) {
        throw new Error('AI service response was not ok');
      }

      const data = await response.json();
      return data.result[1].TransactionExplorer.messages[0].content;
    } catch (error) {
      throw new Error(`Failed to get AI response: ${error.message}`);
    }
  }

  async deleteMessage(messageId: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new UnauthorizedException('Not authorized to delete this message');
    }

    await message.deleteOne();

    // Update conversation's lastMessage if needed
    const conversation = await this.conversationModel.findOne({
      'messages._id': messageId
    });

    if (conversation) {
      const messages = conversation.messages.filter(m => m._id.toString() !== messageId);
      const lastMessage = messages[messages.length - 1];
      
      await this.conversationModel.updateOne(
        { _id: conversation._id },
        { 
          messages,
          lastMessage: lastMessage?.content || '',
          lastMessageAt: lastMessage?.timestamp || new Date()
        }
      );
    }

    return { success: true };
  }

  async addReaction(messageId: string, emoji: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    const reactionIndex = message.reactions.findIndex(r => r.emoji === emoji);
    
    if (reactionIndex > -1) {
      const reaction = message.reactions[reactionIndex];
      const userIndex = reaction.users.indexOf(userId);
      
      if (userIndex > -1) {
        reaction.users.splice(userIndex, 1);
        reaction.count--;
        if (reaction.count === 0) {
          message.reactions.splice(reactionIndex, 1);
        }
      } else {
        reaction.users.push(userId);
        reaction.count++;
      }
    } else {
      message.reactions.push({
        emoji,
        count: 1,
        users: [userId]
      });
    }

    await message.save();
    return message;
  }

  async editMessage(messageId: string, content: string, userId: string) {
    const message = await this.messageModel.findById(messageId);
    
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    if (message.userId !== userId) {
      throw new UnauthorizedException('Not authorized to edit this message');
    }

    if (message.role !== 'user') {
      throw new UnauthorizedException('Cannot edit AI responses');
    }

    message.content = content;
    message.editedAt = new Date();
    await message.save();

    return message;
  }
}