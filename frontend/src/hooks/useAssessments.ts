import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as assessmentsApi from '@/api/assessments';

export function useCourseAssessments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['assessments', courseId],
    queryFn: () => assessmentsApi.listCourseAssessments(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useAssessment(assessmentId: string | undefined) {
  return useQuery({
    queryKey: ['assessments', 'detail', assessmentId],
    queryFn: () => assessmentsApi.getAssessment(assessmentId!),
    enabled: Boolean(assessmentId),
    refetchInterval: 30_000,
  });
}

export function useScheduleAssessment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: assessmentsApi.ScheduleAssessmentInput) =>
      assessmentsApi.scheduleAssessment(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assessments', courseId] }),
  });
}

export function useStartAssessmentAttempt() {
  return useMutation({ mutationFn: assessmentsApi.startMyAssessmentAttempt });
}
