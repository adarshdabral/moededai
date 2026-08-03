import { apiClient } from './client';
import type { ApiSuccessBody } from '@/types/api';
import type { MonthlyAssessmentDTO, TestAttemptDTO } from '@/types/domain';

export interface ScheduleAssessmentInput {
  topicId: string;
  scheduledFor: string;
  windowClosesAt: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
  questionCount?: number;
  timeLimitMinutes?: number;
}

export async function scheduleAssessment(
  courseId: string,
  input: ScheduleAssessmentInput
): Promise<MonthlyAssessmentDTO> {
  const res = await apiClient.post<ApiSuccessBody<MonthlyAssessmentDTO>>(
    `/courses/${courseId}/monthly-assessments`,
    input
  );
  return res.data.data;
}

export async function listCourseAssessments(courseId: string): Promise<MonthlyAssessmentDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<MonthlyAssessmentDTO[]>>(
    `/courses/${courseId}/monthly-assessments`
  );
  return res.data.data;
}

export async function getAssessment(assessmentId: string): Promise<MonthlyAssessmentDTO> {
  const res = await apiClient.get<ApiSuccessBody<MonthlyAssessmentDTO>>(
    `/monthly-assessments/${assessmentId}`
  );
  return res.data.data;
}

export async function startMyAssessmentAttempt(assessmentId: string): Promise<TestAttemptDTO> {
  const res = await apiClient.post<ApiSuccessBody<TestAttemptDTO>>(
    `/monthly-assessments/${assessmentId}/attempts`
  );
  return res.data.data;
}
