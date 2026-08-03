import { z } from 'zod';

export const scheduleMonthlyAssessmentSchema = z
  .object({
    topicId: z.string().min(1),
    scheduledFor: z.coerce.date(),
    windowClosesAt: z.coerce.date(),
    difficulty: z.enum(['easy', 'medium', 'hard', 'adaptive']).default('adaptive'),
    questionCount: z.number().int().min(1).max(20).default(5),
    timeLimitMinutes: z.number().int().min(1).max(180).default(30),
  })
  .refine((data) => data.windowClosesAt.getTime() > data.scheduledFor.getTime(), {
    message: 'windowClosesAt must be after scheduledFor.',
    path: ['windowClosesAt'],
  });
export type ScheduleMonthlyAssessmentInput = z.infer<typeof scheduleMonthlyAssessmentSchema>;
