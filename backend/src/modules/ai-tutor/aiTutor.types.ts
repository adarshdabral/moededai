export interface ConversationMessageDTO {
  role: 'student' | 'assistant';
  content: string;
  sentAt: Date;
}

export interface ConversationSummaryDTO {
  id: string;
  topicId?: string;
  title: string;
  lastMessageAt: Date;
  messageCount: number;
}

export interface ConversationDetailDTO extends ConversationSummaryDTO {
  messages: ConversationMessageDTO[];
}
