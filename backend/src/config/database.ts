import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(attempt = 1): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI);
    logger.info('MongoDB connected', { host: mongoose.connection.host });
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      logger.error('MongoDB connection failed after maximum retries', { error });
      throw error;
    }
    logger.warn(`MongoDB connection attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms`, {
      error: (error as Error).message,
    });
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectWithRetry(attempt + 1);
  }
}

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error });
  });

  await connectWithRetry();
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
