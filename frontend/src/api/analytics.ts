import { apiClient } from './client';
import type { ApiSuccessBody } from '@/types/api';
import type { GrowthAnalyticsDTO, StudentComparativeEntryDTO } from '@/types/domain';

export async function getMyGrowth(): Promise<GrowthAnalyticsDTO> {
  const res = await apiClient.get<ApiSuccessBody<GrowthAnalyticsDTO>>('/analytics/me/growth');
  return res.data.data;
}

export async function getCourseComparative(
  courseId: string
): Promise<StudentComparativeEntryDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<StudentComparativeEntryDTO[]>>(
    `/analytics/courses/${courseId}/comparative`
  );
  return res.data.data;
}
