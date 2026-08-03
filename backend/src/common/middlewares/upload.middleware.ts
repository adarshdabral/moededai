import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { env } from '@config/env';
import { UnprocessableEntityError } from '@common/errors/AppError';

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'video/mp4',
]);

function fileFilter(_req: Request, file: Express.Multer.File, callback: FileFilterCallback): void {
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    callback(new UnprocessableEntityError(`Unsupported file type: ${file.mimetype}`));
    return;
  }
  callback(null, true);
}

/**
 * Buffers the upload in memory (not disk) so StorageClient implementations
 * decide how/where to persist it - keeps Multer decoupled from the storage
 * abstraction in common/storage/.
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter,
});
