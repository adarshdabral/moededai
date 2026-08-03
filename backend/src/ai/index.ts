import { GeminiClient } from './gemini.client';
import { AIClient } from './ai.types';

export const aiClient: AIClient = new GeminiClient();
export type { AIClient, ChatTurn, GenerateChatReplyOptions } from './ai.types';
