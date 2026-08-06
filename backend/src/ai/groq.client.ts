import Groq from 'groq-sdk';
import { env } from '@config/env';
import { logger } from '@config/logger';
import { AIProviderError } from '@common/errors/AppError';
import { AIClient, ChatTurn, GenerateChatReplyOptions } from './ai.types';

const REQUEST_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      setTimeout(() => reject(new Error('AI provider request timed out')), timeoutMs);
    }),
  ]);
}

function toGroqRole(role: ChatTurn['role']): 'user' | 'assistant' {
  return role === 'model' ? 'assistant' : 'user';
}

/**
 * The single integration point with Groq. Every AI-dependent module
 * (ai-tutor, ai-test, knowledge-score) calls this through the `AIClient`
 * interface only - see docs/ARCHITECTURE.md §7 and CLAUDE.md §3/§19.
 */
export class GroqClient implements AIClient {
  private client: Groq | null = null;

  private getClient(): Groq {
    if (!env.GROQ_API_KEY) {
      throw new AIProviderError('The AI provider is not configured (GROQ_API_KEY is missing).');
    }
    if (!this.client) {
      this.client = new Groq({ apiKey: env.GROQ_API_KEY, timeout: REQUEST_TIMEOUT_MS });
    }
    return this.client;
  }

  async generateChatReply(options: GenerateChatReplyOptions): Promise<string> {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        ...(options.systemInstruction
          ? [{ role: 'system' as const, content: options.systemInstruction }]
          : []),
        ...options.history.map((turn) => ({
          role: toGroqRole(turn.role),
          content: turn.content,
        })),
        { role: 'user' as const, content: options.message },
      ];

      const completion = await withTimeout(
        this.getClient().chat.completions.create({ model: env.GROQ_MODEL, messages }),
        REQUEST_TIMEOUT_MS
      );

      const reply = completion.choices[0]?.message.content;
      if (!reply) throw new Error('Groq returned an empty chat reply.');
      return reply;
    } catch (error) {
      logger.error('Groq generateChatReply failed', { error: (error as Error).message });
      throw new AIProviderError();
    }
  }

  async generateJSON(prompt: string, systemInstruction?: string): Promise<unknown> {
    try {
      const messages: Groq.Chat.ChatCompletionMessageParam[] = [
        ...(systemInstruction ? [{ role: 'system' as const, content: systemInstruction }] : []),
        { role: 'user' as const, content: prompt },
      ];

      const completion = await withTimeout(
        this.getClient().chat.completions.create({
          model: env.GROQ_MODEL,
          messages,
          response_format: { type: 'json_object' },
        }),
        REQUEST_TIMEOUT_MS
      );

      const text = completion.choices[0]?.message.content;
      if (!text) throw new Error('Groq returned an empty JSON response.');
      return JSON.parse(text);
    } catch (error) {
      logger.error('Groq generateJSON failed', { error: (error as Error).message });
      throw new AIProviderError();
    }
  }
}
