import { apiClient } from './client';
import type { ApiSuccessBody } from '@/types/api';
import type { KnowledgeScoreDTO } from '@/types/domain';

export async function getMyScores(): Promise<KnowledgeScoreDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<KnowledgeScoreDTO[]>>('/knowledge-scores/me');
  return res.data.data;
}

export async function getMyWeakTopics(): Promise<KnowledgeScoreDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<KnowledgeScoreDTO[]>>(
    '/knowledge-scores/me/weak-topics'
  );
  return res.data.data;
}
