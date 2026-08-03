import { useQuery } from '@tanstack/react-query';
import * as knowledgeScoreApi from '@/api/knowledgeScore';

export function useMyScores() {
  return useQuery({ queryKey: ['knowledge-scores', 'me'], queryFn: knowledgeScoreApi.getMyScores });
}

export function useMyWeakTopics() {
  return useQuery({
    queryKey: ['knowledge-scores', 'weak-topics'],
    queryFn: knowledgeScoreApi.getMyWeakTopics,
  });
}
