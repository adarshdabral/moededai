import { z } from 'zod';

export const createDoubtSchema = z.object({
  courseId: z.string().min(1),
  topicId: z.string().optional(),
  question: z.string().min(1).max(2000),
});
export type CreateDoubtInput = z.infer<typeof createDoubtSchema>;

export const updateDoubtStatusSchema = z.object({
  status: z.enum(['open', 'answered', 'closed']),
});
export type UpdateDoubtStatusInput = z.infer<typeof updateDoubtStatusSchema>;

export const doubtListQuerySchema = z.object({
  status: z.enum(['open', 'answered', 'closed']).optional(),
});
export type DoubtListQuery = z.infer<typeof doubtListQuerySchema>;

export const createReplySchema = z.object({
  message: z.string().min(1).max(2000),
});
export type CreateReplyInput = z.infer<typeof createReplySchema>;

export const fileAbuseReportSchema = z.object({
  reason: z.string().min(1).max(1000),
});
export type FileAbuseReportInput = z.infer<typeof fileAbuseReportSchema>;

export const createAbuseReportSchema = z
  .object({
    reportedDoubtId: z.string().optional(),
    reportedReplyId: z.string().optional(),
    reason: z.string().min(1).max(1000),
  })
  .refine((data) => Boolean(data.reportedDoubtId) !== Boolean(data.reportedReplyId), {
    message: 'Exactly one of reportedDoubtId or reportedReplyId must be provided.',
  });
export type CreateAbuseReportInput = z.infer<typeof createAbuseReportSchema>;

export const resolveAbuseReportSchema = z.object({
  status: z.enum(['resolved', 'dismissed']),
  resolutionNotes: z.string().max(1000).optional(),
});
export type ResolveAbuseReportInput = z.infer<typeof resolveAbuseReportSchema>;
