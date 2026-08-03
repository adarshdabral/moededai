import { logger } from '@config/logger';
import { EmailClient, EmailMessage } from './email.types';

/**
 * Development-safe EmailClient implementation: writes the full message to the
 * application logger instead of dispatching over SMTP/a provider API. This is
 * a real, working implementation (not a stub) - it lets a developer read a
 * verification/reset link straight out of the logs without any external
 * dependency. Production deployments swap EMAIL_PROVIDER for a real
 * implementation of the same interface.
 */
export class ConsoleEmailClient implements EmailClient {
  async send(message: EmailMessage): Promise<void> {
    logger.info('Email dispatched (console provider)', {
      to: message.to,
      subject: message.subject,
      body: message.body,
    });
    return Promise.resolve();
  }
}
