import { BaseRepository } from '@database/baseRepository';
import {
  AiTutorConversationDocument,
  AiTutorConversationModel,
  ConversationMessage,
} from './aiTutorConversation.model';

export class AiTutorRepository extends BaseRepository<AiTutorConversationDocument> {
  constructor() {
    super(AiTutorConversationModel);
  }

  async findByStudent(
    studentId: string,
    options: { skip?: number; limit?: number }
  ): Promise<AiTutorConversationDocument[]> {
    return AiTutorConversationModel.find({ studentId })
      .sort({ lastMessageAt: -1 })
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 20)
      .lean<AiTutorConversationDocument[]>()
      .exec();
  }

  async countByStudent(studentId: string): Promise<number> {
    return AiTutorConversationModel.countDocuments({ studentId }).exec();
  }

  async appendMessages(
    conversationId: string,
    messages: ConversationMessage[],
    lastMessageAt: Date,
    title?: string
  ): Promise<AiTutorConversationDocument | null> {
    const update: Record<string, unknown> = {
      $push: { messages: { $each: messages } },
      $set: { lastMessageAt },
    };
    if (title) {
      (update.$set as Record<string, unknown>).title = title;
    }
    return AiTutorConversationModel.findByIdAndUpdate(conversationId, update, {
      new: true,
    }).exec();
  }
}

export const aiTutorRepository = new AiTutorRepository();
