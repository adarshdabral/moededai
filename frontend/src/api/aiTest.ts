import { apiClient } from './client';
import type { ApiSuccessBody, PaginationMeta } from '@/types/api';
import type { AiGeneratedTestDTO, TestAttemptDTO } from '@/types/domain';

export interface GenerateTestInput {
  topicId: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'adaptive';
  questionCount?: number;
  timeLimitMinutes?: number;
}

export async function generateTest(input: GenerateTestInput): Promise<AiGeneratedTestDTO> {
  const res = await apiClient.post<ApiSuccessBody<AiGeneratedTestDTO>>('/ai-test/generate', input);
  return res.data.data;
}

export async function getTest(testId: string): Promise<AiGeneratedTestDTO> {
  const res = await apiClient.get<ApiSuccessBody<AiGeneratedTestDTO>>(`/ai-test/${testId}`);
  return res.data.data;
}

export async function startAttempt(testId: string): Promise<TestAttemptDTO> {
  const res = await apiClient.post<ApiSuccessBody<TestAttemptDTO>>('/test-attempts', { testId });
  return res.data.data;
}

export async function submitAttempt(
  attemptId: string,
  answers: { questionIndex: number; response: string }[]
): Promise<TestAttemptDTO> {
  const res = await apiClient.patch<ApiSuccessBody<TestAttemptDTO>>(
    `/test-attempts/${attemptId}/submit`,
    { answers }
  );
  return res.data.data;
}

export async function getAttempt(attemptId: string): Promise<TestAttemptDTO> {
  const res = await apiClient.get<ApiSuccessBody<TestAttemptDTO>>(`/test-attempts/${attemptId}`);
  return res.data.data;
}

export async function listMyAttempts(
  page = 1,
  limit = 20
): Promise<{ items: TestAttemptDTO[]; pagination: PaginationMeta }> {
  const res = await apiClient.get<ApiSuccessBody<TestAttemptDTO[]>>('/test-attempts', {
    params: { page, limit },
  });
  return { items: res.data.data, pagination: res.data.meta!.pagination };
}
