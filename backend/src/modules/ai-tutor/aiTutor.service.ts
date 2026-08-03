import { ForbiddenError, NotFoundError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { buildPaginationMeta, PaginationQuery, toSkipLimit } from '@common/utils/pagination';
import { aiClient } from '@ai/index';
import { ChatTurn } from '@ai/ai.types';
import { buildTutorSystemInstruction } from '@ai/prompts/tutor.prompts';
import { topicService, TopicService } from '@modules/course/topic.service';
import { aiTutorRepository, AiTutorRepository } from './aiTutor.repository';
import { AiTutorConversationDocument } from './aiTutorConversation.model';
import { ConversationDetailDTO, ConversationSummaryDTO } from './aiTutor.types';
import { ListConversationsQuery, StartConversationInput } from './aiTutor.validation';

const MAX_MESSAGES_PER_CONVERSATION = 50;
const TITLE_MAX_LENGTH = 60;

export class AiTutorService {
  constructor(
    private readonly repository: AiTutorRepository = aiTutorRepository,
    private readonly topics: TopicService = topicService
  ) {}

  toSummaryDTO(conversation: AiTutorConversationDocument): ConversationSummaryDTO {
    return {
      id: String(conversation._id),
      topicId: conversation.topicId ? String(conversation.topicId) : undefined,
      title: conversation.title,
      lastMessageAt: conversation.lastMessageAt,
      messageCount: conversation.messages.length,
    };
  }

  toDetailDTO(conversation: AiTutorConversationDocument): ConversationDetailDTO {
    return {
      ...this.toSummaryDTO(conversation),
      messages: conversation.messages,
    };
  }

  async start(
    requester: AuthenticatedUser,
    input: StartConversationInput
  ): Promise<AiTutorConversationDocument> {
    if (input.topicId) {
      await this.topics.getById(input.topicId);
    }
    return this.repository.create({
      studentId: requester.id as unknown as AiTutorConversationDocument['studentId'],
      topicId: input.topicId as unknown as AiTutorConversationDocument['topicId'],
      title: 'New conversation',
      messages: [],
      lastMessageAt: new Date(),
    });
  }

  private async getOwned(
    conversationId: string,
    requester: AuthenticatedUser
  ): Promise<AiTutorConversationDocument> {
    const conversation = await this.repository.findById(conversationId);
    if (!conversation) throw new NotFoundError('Conversation');
    if (String(conversation.studentId) !== requester.id) {
      throw new ForbiddenError('This conversation does not belong to you.');
    }
    return conversation;
  }

  async sendMessage(
    conversationId: string,
    requester: AuthenticatedUser,
    message: string
  ): Promise<AiTutorConversationDocument> {
    let conversation = await this.getOwned(conversationId, requester);

    // Beyond the cap, continue in a fresh conversation document rather than
    // growing one document unbounded - see docs/DATABASE.md §10.
    if (conversation.messages.length >= MAX_MESSAGES_PER_CONVERSATION) {
      conversation = await this.repository.create({
        studentId: conversation.studentId,
        topicId: conversation.topicId,
        title: conversation.title,
        messages: [],
        lastMessageAt: new Date(),
      });
    }

    const isFirstMessage = conversation.messages.length === 0;
    const topic = conversation.topicId ? await this.topics.getById(String(conversation.topicId)) : undefined;
    const systemInstruction = buildTutorSystemInstruction({
      topicTitle: topic?.title,
      learningObjectives: topic?.learningObjectives,
    });

    const history: ChatTurn[] = conversation.messages.map((entry) => ({
      role: entry.role === 'student' ? 'user' : 'model',
      content: entry.content,
    }));

    const reply = await aiClient.generateChatReply({ history, message, systemInstruction });

    const now = new Date();
    const title = isFirstMessage ? message.slice(0, TITLE_MAX_LENGTH) : undefined;
    const updated = await this.repository.appendMessages(
      String(conversation._id),
      [
        { role: 'student', content: message, sentAt: now },
        { role: 'assistant', content: reply, sentAt: now },
      ],
      now,
      title
    );

    if (!updated) throw new NotFoundError('Conversation');
    return updated;
  }

  async getById(conversationId: string, requester: AuthenticatedUser): Promise<AiTutorConversationDocument> {
    return this.getOwned(conversationId, requester);
  }

  async listMine(requester: AuthenticatedUser, query: ListConversationsQuery) {
    const { skip, limit } = toSkipLimit(query);
    const [items, total] = await Promise.all([
      this.repository.findByStudent(requester.id, { skip, limit }),
      this.repository.countByStudent(requester.id),
    ]);
    return { items, pagination: buildPaginationMeta(query as unknown as PaginationQuery, total) };
  }
}

export const aiTutorService = new AiTutorService();
