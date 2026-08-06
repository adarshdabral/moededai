import { GroqClient } from './groq.client';
import { AIClient } from './ai.types';

export const aiClient: AIClient = new GroqClient();
export type { AIClient, ChatTurn, GenerateChatReplyOptions } from './ai.types';
