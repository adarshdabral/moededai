export interface ChatTurn {
  role: 'user' | 'model';
  content: string;
}

export interface GenerateChatReplyOptions {
  history: ChatTurn[];
  message: string;
  systemInstruction?: string;
}

/**
 * Provider-agnostic contract every AI-dependent module depends on. Never
 * import `@google/generative-ai` (or any future provider SDK) outside
 * src/ai/ - see docs/ARCHITECTURE.md §7 and CLAUDE.md §3/§19.
 */
export interface AIClient {
  generateChatReply(options: GenerateChatReplyOptions): Promise<string>;
  /** Returns the parsed JSON response, unvalidated - the caller MUST validate
   *  it against a Zod schema before trusting or persisting it (AI output is
   *  untrusted input, exactly like a request body). */
  generateJSON(prompt: string, systemInstruction?: string): Promise<unknown>;
}
