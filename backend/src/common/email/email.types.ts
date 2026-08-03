export interface EmailMessage {
  to: string;
  subject: string;
  body: string;
}

/**
 * Provider-agnostic contract for sending email. Auth (verification, password
 * reset) and the notification module both depend on this interface, never on
 * a concrete provider - mirrors the AI client pattern in src/ai/. Swapping to
 * a real provider (SES, SendGrid, etc.) means implementing this interface and
 * changing the single factory in email/index.ts - no call site changes.
 */
export interface EmailClient {
  send(message: EmailMessage): Promise<void>;
}
