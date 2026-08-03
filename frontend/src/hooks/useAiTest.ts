import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as aiTestApi from '@/api/aiTest';

export function useGenerateTest() {
  return useMutation({ mutationFn: aiTestApi.generateTest });
}

export function useTest(testId: string | undefined) {
  return useQuery({
    queryKey: ['test', testId],
    queryFn: () => aiTestApi.getTest(testId!),
    enabled: Boolean(testId),
  });
}

export function useStartAttempt() {
  return useMutation({ mutationFn: aiTestApi.startAttempt });
}

export function useAttempt(attemptId: string | undefined) {
  return useQuery({
    queryKey: ['attempt', attemptId],
    queryFn: () => aiTestApi.getAttempt(attemptId!),
    enabled: Boolean(attemptId),
  });
}

export function useSubmitAttempt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      attemptId: string;
      answers: { questionIndex: number; response: string }[];
    }) => aiTestApi.submitAttempt(input.attemptId, input.answers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-attempts'] });
      queryClient.invalidateQueries({ queryKey: ['knowledge-scores'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMyAttempts(page = 1) {
  return useQuery({
    queryKey: ['my-attempts', page],
    queryFn: () => aiTestApi.listMyAttempts(page),
  });
}
