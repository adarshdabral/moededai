import { z } from 'zod';

export const gradingResultSchema = z.object({
  pointsAwarded: z.number(),
  feedback: z.string(),
});
export type GradingResult = z.infer<typeof gradingResultSchema>;
