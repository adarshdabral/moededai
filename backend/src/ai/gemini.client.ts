import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { AIProviderError } from '@common/errors/AppError';
import { AIClient, GenerateChatReplyOptions } from './ai.types';

const REQUEST_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error('AI provider request timed out')), timeoutMs);
    }),
  ]);
}

/**
 * The single integration point with Google Gemini. Every AI-dependent module
 * (ai-tutor, ai-test, knowledge-score) calls this through the `AIClient`
 * interface only - see docs/ARCHITECTURE.md §7 and CLAUDE.md §3/§19.
 */
export class GeminiClient implements AIClient {
  private client: GoogleGenerativeAI | null = null;

  private getClient(): GoogleGenerativeAI {
    if (!env.GEMINI_API_KEY) {
      throw new AIProviderError(
        'The AI provider is not configured (GEMINI_API_KEY is missing).'
      );
    }
    if (!this.client) {
      this.client = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
    return this.client;
  }

  async generateChatReply(options: GenerateChatReplyOptions): Promise<string> {
    try {
      const model = this.getClient().getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: options.systemInstruction,
      });

      const chat = model.startChat({
        history: options.history.map((turn) => ({
          role: turn.role,
          parts: [{ text: turn.content }],
        })),
      });

      const result = await withTimeout(chat.sendMessage(options.message), REQUEST_TIMEOUT_MS);
      return result.response.text();
    } catch (error) {
      logger.error('Gemini generateChatReply failed', { error: (error as Error).message });
      throw new AIProviderError();
    }
  }

  async generateJSON(prompt: string, systemInstruction?: string): Promise<unknown> {
    try {
      const model = this.getClient().getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction,
        generationConfig: { responseMimeType: 'application/json' },
      });

      const result = await withTimeout(model.generateContent(prompt), REQUEST_TIMEOUT_MS);
      const text = result.response.text();
      return JSON.parse(text);
    } catch (error) {
      logger.error('Gemini generateJSON failed', { error: (error as Error).message });
      throw new AIProviderError();
    }
  }
}
