import { env } from '@config/env';
import { EmailClient } from './email.types';
import { ConsoleEmailClient } from './console-email.client';

function createEmailClient(): EmailClient {
  switch (env.EMAIL_PROVIDER) {
    case 'console':
    default:
      return new ConsoleEmailClient();
  }
}

export const emailClient: EmailClient = createEmailClient();
export type { EmailClient, EmailMessage } from './email.types';
