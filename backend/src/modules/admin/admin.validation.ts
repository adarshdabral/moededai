import { z } from 'zod';

export const resolveIdentitySchema = z.object({
  anonymousId: z.string().min(1),
  reason: z.string().min(10).max(1000),
});
export type ResolveIdentityInput = z.infer<typeof resolveIdentitySchema>;

export const listAuditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListAuditLogsQuery = z.infer<typeof listAuditLogsQuerySchema>;
