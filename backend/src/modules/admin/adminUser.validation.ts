import { z } from 'zod';

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  role: z.enum(['student', 'teacher', 'admin']).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const createPrivilegedUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  role: z.enum(['teacher', 'admin']),
  subjectSpecialization: z.array(z.string()).optional(),
});
export type CreatePrivilegedUserInput = z.infer<typeof createPrivilegedUserSchema>;

export const deactivationReasonSchema = z.object({
  reason: z.string().min(10).max(1000),
});
export type DeactivationReasonInput = z.infer<typeof deactivationReasonSchema>;

export const updatePlatformSettingsSchema = z.object({
  maintenanceMode: z.boolean().optional(),
  announcement: z.string().max(500).optional(),
});
export type UpdatePlatformSettingsInput = z.infer<typeof updatePlatformSettingsSchema>;
