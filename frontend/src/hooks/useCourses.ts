import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as coursesApi from '@/api/courses';
import type { CourseListParams } from '@/api/courses';

export function useCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: ['courses', params],
    queryFn: () => coursesApi.listCourses(params),
  });
}

export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['courses', courseId],
    queryFn: () => coursesApi.getCourse(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useCreateCourse() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.createCourse,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['courses'] }),
  });
}

export function useUpdateCourse(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Parameters<typeof coursesApi.updateCourse>[1]) =>
      coursesApi.updateCourse(courseId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] });
      queryClient.invalidateQueries({ queryKey: ['courses', courseId] });
    },
  });
}

export function useTopics(courseId: string | undefined) {
  return useQuery({
    queryKey: ['topics', courseId],
    queryFn: () => coursesApi.listTopics(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useCreateTopic(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof coursesApi.createTopic>[1]) =>
      coursesApi.createTopic(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics', courseId] }),
  });
}

export function useDeleteTopic(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.deleteTopic,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['topics', courseId] }),
  });
}

export function useResources(topicId: string | undefined) {
  return useQuery({
    queryKey: ['resources', topicId],
    queryFn: () => coursesApi.listResources(topicId!),
    enabled: Boolean(topicId),
  });
}

export function useCreateLinkResource(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof coursesApi.createLinkResource>[1]) =>
      coursesApi.createLinkResource(topicId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources', topicId] }),
  });
}

export function useUploadResource(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; file: File; onProgress?: (percent: number) => void }) =>
      coursesApi.uploadResource(topicId, input.title, input.file, input.onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources', topicId] }),
  });
}

export function useDeleteResource(topicId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.deleteResource,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources', topicId] }),
  });
}

export function useAssignments(courseId: string | undefined) {
  return useQuery({
    queryKey: ['assignments', courseId],
    queryFn: () => coursesApi.listAssignments(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useCreateAssignment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      title: string;
      description: string;
      dueAt: string;
      file?: File;
      onProgress?: (percent: number) => void;
    }) => coursesApi.createAssignment(courseId, input, input.onProgress),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments', courseId] }),
  });
}

export function useDeleteAssignment(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: coursesApi.deleteAssignment,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['assignments', courseId] }),
  });
}

export function useLearningPaths(courseId: string | undefined) {
  return useQuery({
    queryKey: ['learning-paths', courseId],
    queryFn: () => coursesApi.listLearningPaths(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useCreateLearningPath(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof coursesApi.createLearningPath>[1]) =>
      coursesApi.createLearningPath(courseId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['learning-paths', courseId] }),
  });
}

export function useRoster(courseId: string | undefined) {
  return useQuery({
    queryKey: ['roster', courseId],
    queryFn: () => coursesApi.listRoster(courseId!),
    enabled: Boolean(courseId),
  });
}

export function useEnrollStudent(courseId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (studentId: string) => coursesApi.enrollStudent(courseId, studentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['roster', courseId] }),
  });
}

export function useMyEnrollments() {
  return useQuery({ queryKey: ['my-enrollments'], queryFn: coursesApi.listMyEnrollments });
}

export function useUpdateEnrollmentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { enrollmentId: string; status: 'active' | 'completed' | 'dropped' }) =>
      coursesApi.updateEnrollmentStatus(input.enrollmentId, input.status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-enrollments'] }),
  });
}
