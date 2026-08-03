import { z } from 'zod';

export const DEFAULT_PAGE_LIMIT = 20;
export const MAX_PAGE_LIMIT = 100;

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(MAX_PAGE_LIMIT).default(DEFAULT_PAGE_LIMIT),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export function toSkipLimit(query: PaginationQuery): { skip: number; limit: number } {
  return { skip: (query.page - 1) * query.limit, limit: query.limit };
}

export function buildPaginationMeta(query: PaginationQuery, total: number) {
  return { page: query.page, limit: query.limit, total };
}
