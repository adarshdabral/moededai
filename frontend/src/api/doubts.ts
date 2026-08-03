import { apiClient } from './client';
import type { ApiSuccessBody, PaginationMeta } from '@/types/api';
import type { AbuseReportDTO, DoubtDTO, DoubtReplyDTO } from '@/types/domain';

export async function postDoubt(input: {
  courseId: string;
  topicId?: string;
  question: string;
}): Promise<DoubtDTO> {
  const res = await apiClient.post<ApiSuccessBody<DoubtDTO>>('/doubts', input);
  return res.data.data;
}

export async function listCourseDoubts(
  courseId: string,
  status?: 'open' | 'answered' | 'closed'
): Promise<DoubtDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<DoubtDTO[]>>(`/courses/${courseId}/doubts`, {
    params: status ? { status } : undefined,
  });
  return res.data.data;
}

export async function listMyDoubts(): Promise<DoubtDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<DoubtDTO[]>>('/doubts/me');
  return res.data.data;
}

export async function getDoubt(doubtId: string): Promise<DoubtDTO> {
  const res = await apiClient.get<ApiSuccessBody<DoubtDTO>>(`/doubts/${doubtId}`);
  return res.data.data;
}

export async function updateDoubtStatus(
  doubtId: string,
  status: 'open' | 'answered' | 'closed'
): Promise<DoubtDTO> {
  const res = await apiClient.patch<ApiSuccessBody<DoubtDTO>>(`/doubts/${doubtId}/status`, {
    status,
  });
  return res.data.data;
}

export async function listReplies(doubtId: string): Promise<DoubtReplyDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<DoubtReplyDTO[]>>(`/doubts/${doubtId}/replies`);
  return res.data.data;
}

export async function postReply(doubtId: string, message: string): Promise<DoubtReplyDTO> {
  const res = await apiClient.post<ApiSuccessBody<DoubtReplyDTO>>(
    `/doubts/${doubtId}/replies`,
    { message }
  );
  return res.data.data;
}

export async function reportDoubt(doubtId: string, reason: string): Promise<AbuseReportDTO> {
  const res = await apiClient.post<ApiSuccessBody<AbuseReportDTO>>(`/doubts/${doubtId}/report`, {
    reason,
  });
  return res.data.data;
}

export async function reportReply(replyId: string, reason: string): Promise<AbuseReportDTO> {
  const res = await apiClient.post<ApiSuccessBody<AbuseReportDTO>>(`/replies/${replyId}/report`, {
    reason,
  });
  return res.data.data;
}

export async function listAbuseReports(
  page = 1,
  limit = 20
): Promise<{ items: AbuseReportDTO[]; pagination: PaginationMeta }> {
  const res = await apiClient.get<ApiSuccessBody<AbuseReportDTO[]>>('/admin/reports', {
    params: { page, limit },
  });
  return { items: res.data.data, pagination: res.data.meta!.pagination };
}

export async function resolveAbuseReport(
  reportId: string,
  input: { status: 'resolved' | 'dismissed'; resolutionNotes?: string }
): Promise<AbuseReportDTO> {
  const res = await apiClient.patch<ApiSuccessBody<AbuseReportDTO>>(
    `/admin/reports/${reportId}/resolve`,
    input
  );
  return res.data.data;
}
