import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as doubtsApi from '@/api/doubts';

export function useMyDoubts() {
  return useQuery({ queryKey: ['doubts', 'mine'], queryFn: doubtsApi.listMyDoubts });
}

export function useCourseDoubts(courseId: string | undefined, status?: 'open' | 'answered' | 'closed') {
  return useQuery({
    queryKey: ['doubts', 'course', courseId, status],
    queryFn: () => doubtsApi.listCourseDoubts(courseId!, status),
    enabled: Boolean(courseId),
  });
}

export function useDoubt(doubtId: string | undefined) {
  return useQuery({
    queryKey: ['doubts', 'detail', doubtId],
    queryFn: () => doubtsApi.getDoubt(doubtId!),
    enabled: Boolean(doubtId),
  });
}

export function usePostDoubt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: doubtsApi.postDoubt,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doubts', 'mine'] }),
  });
}

export function useUpdateDoubtStatus(doubtId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: 'open' | 'answered' | 'closed') =>
      doubtsApi.updateDoubtStatus(doubtId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doubts', 'detail', doubtId] });
      queryClient.invalidateQueries({ queryKey: ['doubts', 'course'] });
    },
  });
}

export function useReplies(doubtId: string | undefined) {
  return useQuery({
    queryKey: ['doubts', 'replies', doubtId],
    queryFn: () => doubtsApi.listReplies(doubtId!),
    enabled: Boolean(doubtId),
  });
}

export function usePostReply(doubtId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (message: string) => doubtsApi.postReply(doubtId, message),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['doubts', 'replies', doubtId] }),
  });
}

export function useReportDoubt() {
  return useMutation({
    mutationFn: (input: { doubtId: string; reason: string }) =>
      doubtsApi.reportDoubt(input.doubtId, input.reason),
  });
}

export function useReportReply() {
  return useMutation({
    mutationFn: (input: { replyId: string; reason: string }) =>
      doubtsApi.reportReply(input.replyId, input.reason),
  });
}

export function useAbuseReports(page = 1) {
  return useQuery({
    queryKey: ['abuse-reports', page],
    queryFn: () => doubtsApi.listAbuseReports(page),
  });
}

export function useResolveAbuseReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      reportId: string;
      status: 'resolved' | 'dismissed';
      resolutionNotes?: string;
    }) => doubtsApi.resolveAbuseReport(input.reportId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['abuse-reports'] }),
  });
}
