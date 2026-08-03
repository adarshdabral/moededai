import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(3).max(150),
  description: z.string().max(2000).optional(),
  subject: z.string().min(1).max(100),
  gradeLevel: z.string().min(1).max(50),
  teacherIds: z.array(z.string()).min(1),
});
export type CreateCourseInput = z.infer<typeof createCourseSchema>;

export const updateCourseSchema = z.object({
  title: z.string().min(3).max(150).optional(),
  description: z.string().max(2000).optional(),
  subject: z.string().min(1).max(100).optional(),
  gradeLevel: z.string().min(1).max(50).optional(),
  teacherIds: z.array(z.string()).min(1).optional(),
  isPublished: z.boolean().optional(),
});
export type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

export const courseListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  subject: z.string().optional(),
  gradeLevel: z.string().optional(),
});
export type CourseListQuery = z.infer<typeof courseListQuerySchema>;

export const createTopicSchema = z.object({
  title: z.string().min(1).max(150),
  order: z.number().int().min(0),
  learningObjectives: z.array(z.string()).optional(),
});
export type CreateTopicInput = z.infer<typeof createTopicSchema>;

export const updateTopicSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  order: z.number().int().min(0).optional(),
  learningObjectives: z.array(z.string()).optional(),
});
export type UpdateTopicInput = z.infer<typeof updateTopicSchema>;

export const createLinkResourceSchema = z.object({
  type: z.enum(['document', 'video', 'link']),
  title: z.string().min(1).max(150),
  url: z.string().url(),
});
export type CreateLinkResourceInput = z.infer<typeof createLinkResourceSchema>;

export const createAssignmentSchema = z.object({
  title: z.string().min(1).max(150),
  description: z.string().min(1).max(5000),
  dueAt: z.coerce.date().refine((date) => date.getTime() > Date.now(), {
    message: 'dueAt must be in the future.',
  }),
});
export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;

export const updateAssignmentSchema = z.object({
  title: z.string().min(1).max(150).optional(),
  description: z.string().min(1).max(5000).optional(),
  dueAt: z.coerce.date().optional(),
});
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;

export const createLearningPathSchema = z.object({
  title: z.string().min(1).max(150),
  topicSequence: z.array(z.string()).min(1),
});
export type CreateLearningPathInput = z.infer<typeof createLearningPathSchema>;

export const createEnrollmentSchema = z.object({
  studentId: z.string().min(1),
});
export type CreateEnrollmentInput = z.infer<typeof createEnrollmentSchema>;

export const updateEnrollmentStatusSchema = z.object({
  status: z.enum(['active', 'completed', 'dropped']),
});
export type UpdateEnrollmentStatusInput = z.infer<typeof updateEnrollmentStatusSchema>;
