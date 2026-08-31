import mongoose from 'mongoose';
import { env, isProduction } from './env';
import { logger } from './logger';

mongoose.set('strictQuery', true);

const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

async function connectWithRetry(uri: string, attempt = 1): Promise<void> {
  try {
    await mongoose.connect(uri);
  } catch (error) {
    if (attempt >= MAX_RETRIES) {
      throw error;
    }
    logger.warn(`MongoDB connection attempt ${attempt} failed, retrying in ${RETRY_DELAY_MS}ms`, {
      error: (error as Error).message,
    });
    await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
    return connectWithRetry(uri, attempt + 1);
  }
}

export async function connectDatabase(): Promise<void> {
  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB connection error', { error });
  });

  const canFallback = !isProduction && env.MONGO_URI_FALLBACK !== env.MONGO_URI;

  try {
    await connectWithRetry(env.MONGO_URI);
    logger.info('MongoDB connected', { host: mongoose.connection.host });
  } catch (primaryError) {
    if (!canFallback) {
      logger.error('MongoDB connection failed after maximum retries', { error: primaryError });
      throw primaryError;
    }

    logger.warn('Primary MongoDB unreachable after maximum retries, falling back to local instance', {
      error: (primaryError as Error).message,
      fallbackUri: env.MONGO_URI_FALLBACK,
    });

    try {
      await connectWithRetry(env.MONGO_URI_FALLBACK);
      logger.info('MongoDB connected (fallback)', { host: mongoose.connection.host });
    } catch (fallbackError) {
      logger.error('MongoDB connection failed on both primary and fallback URIs', {
        error: fallbackError,
      });
      throw fallbackError;
    }
  }
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}

export function isDatabaseConnected(): boolean {
  return mongoose.connection.readyState === 1;
}
