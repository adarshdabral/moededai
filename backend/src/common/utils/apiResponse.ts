import { Response } from 'express';
import { ErrorCode } from '@common/errors/errorCodes';
import { ErrorDetail } from '@common/errors/AppError';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

interface SuccessBody<T> {
  success: true;
  data: T;
  meta?: { pagination?: PaginationMeta };
}

interface ErrorBody {
  success: false;
  error: {
    code: ErrorCode | string;
    message: string;
    details?: ErrorDetail[];
  };
}

/** The one and only response shape every endpoint in the system returns. See CLAUDE.md §6. */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode = 200,
  pagination?: PaginationMeta
): Response<SuccessBody<T>> {
  const body: SuccessBody<T> = { success: true, data };
  if (pagination) {
    body.meta = { pagination };
  }
  return res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  statusCode: number,
  code: ErrorCode | string,
  message: string,
  details?: ErrorDetail[]
): Response<ErrorBody> {
  const body: ErrorBody = { success: false, error: { code, message, details } };
  return res.status(statusCode).json(body);
}
