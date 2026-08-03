import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;

export const sendAnnouncementSchema = z.object({
  title: z.string().min(1).max(150),
  body: z.string().min(1).max(1000),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
});
export type SendAnnouncementInput = z.infer<typeof sendAnnouncementSchema>;
