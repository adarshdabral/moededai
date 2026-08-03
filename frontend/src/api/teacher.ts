import { apiClient } from './client';
import type { ApiSuccessBody } from '@/types/api';
import type { CourseDTO, GrowthAnalyticsDTO } from '@/types/domain';

export async function getMyClasses(): Promise<CourseDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<CourseDTO[]>>('/teacher/classes');
  return res.data.data;
}

export async function getStudentAnalytics(studentId: string): Promise<GrowthAnalyticsDTO> {
  const res = await apiClient.get<ApiSuccessBody<GrowthAnalyticsDTO>>(
    `/teacher/students/${studentId}/analytics`
  );
  return res.data.data;
}
