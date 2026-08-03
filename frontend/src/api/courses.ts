import { apiClient } from './client';
import type { ApiSuccessBody, PaginationMeta } from '@/types/api';
import type {
  AssignmentDTO,
  CourseDTO,
  EnrollmentDTO,
  LearningPathDTO,
  ResourceDTO,
  TopicDTO,
} from '@/types/domain';

export interface CourseListParams {
  page?: number;
  limit?: number;
  subject?: string;
  gradeLevel?: string;
}

export async function listCourses(
  params: CourseListParams = {}
): Promise<{ items: CourseDTO[]; pagination: PaginationMeta }> {
  const res = await apiClient.get<ApiSuccessBody<CourseDTO[]>>('/courses', { params });
  return { items: res.data.data, pagination: res.data.meta!.pagination };
}

export async function getCourse(courseId: string): Promise<CourseDTO> {
  const res = await apiClient.get<ApiSuccessBody<CourseDTO>>(`/courses/${courseId}`);
  return res.data.data;
}

export interface CreateCourseInput {
  title: string;
  description?: string;
  subject: string;
  gradeLevel: string;
  teacherIds: string[];
}

export async function createCourse(input: CreateCourseInput): Promise<CourseDTO> {
  const res = await apiClient.post<ApiSuccessBody<CourseDTO>>('/courses', input);
  return res.data.data;
}

export async function updateCourse(
  courseId: string,
  updates: Partial<CreateCourseInput> & { isPublished?: boolean }
): Promise<CourseDTO> {
  const res = await apiClient.patch<ApiSuccessBody<CourseDTO>>(`/courses/${courseId}`, updates);
  return res.data.data;
}

export async function listTopics(courseId: string): Promise<TopicDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<TopicDTO[]>>(`/courses/${courseId}/topics`);
  return res.data.data;
}

export async function createTopic(
  courseId: string,
  input: { title: string; order: number; learningObjectives?: string[] }
): Promise<TopicDTO> {
  const res = await apiClient.post<ApiSuccessBody<TopicDTO>>(
    `/courses/${courseId}/topics`,
    input
  );
  return res.data.data;
}

export async function updateTopic(
  topicId: string,
  updates: { title?: string; order?: number; learningObjectives?: string[] }
): Promise<TopicDTO> {
  const res = await apiClient.patch<ApiSuccessBody<TopicDTO>>(`/topics/${topicId}`, updates);
  return res.data.data;
}

export async function deleteTopic(topicId: string): Promise<void> {
  await apiClient.delete(`/topics/${topicId}`);
}

export async function listResources(topicId: string): Promise<ResourceDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<ResourceDTO[]>>(`/topics/${topicId}/resources`);
  return res.data.data;
}

export async function createLinkResource(
  topicId: string,
  input: { type: 'document' | 'video' | 'link'; title: string; url: string }
): Promise<ResourceDTO> {
  const res = await apiClient.post<ApiSuccessBody<ResourceDTO>>(
    `/topics/${topicId}/resources`,
    input
  );
  return res.data.data;
}

export async function uploadResource(
  topicId: string,
  title: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<ResourceDTO> {
  const formData = new FormData();
  formData.append('title', title);
  formData.append('file', file);
  const res = await apiClient.post<ApiSuccessBody<ResourceDTO>>(
    `/topics/${topicId}/resources/upload`,
    formData,
    {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    }
  );
  return res.data.data;
}

export async function deleteResource(resourceId: string): Promise<void> {
  await apiClient.delete(`/resources/${resourceId}`);
}

export async function listAssignments(courseId: string): Promise<AssignmentDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<AssignmentDTO[]>>(
    `/courses/${courseId}/assignments`
  );
  return res.data.data;
}

export async function createAssignment(
  courseId: string,
  input: { title: string; description: string; dueAt: string; file?: File },
  onProgress?: (percent: number) => void
): Promise<AssignmentDTO> {
  const formData = new FormData();
  formData.append('title', input.title);
  formData.append('description', input.description);
  formData.append('dueAt', input.dueAt);
  if (input.file) formData.append('file', input.file);

  const res = await apiClient.post<ApiSuccessBody<AssignmentDTO>>(
    `/courses/${courseId}/assignments`,
    formData,
    {
      onUploadProgress: (event) => {
        if (event.total) onProgress?.(Math.round((event.loaded / event.total) * 100));
      },
    }
  );
  return res.data.data;
}

export async function deleteAssignment(assignmentId: string): Promise<void> {
  await apiClient.delete(`/assignments/${assignmentId}`);
}

export async function listLearningPaths(courseId: string): Promise<LearningPathDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<LearningPathDTO[]>>(
    `/courses/${courseId}/learning-paths`
  );
  return res.data.data;
}

export async function createLearningPath(
  courseId: string,
  input: { title: string; topicSequence: string[] }
): Promise<LearningPathDTO> {
  const res = await apiClient.post<ApiSuccessBody<LearningPathDTO>>(
    `/courses/${courseId}/learning-paths`,
    input
  );
  return res.data.data;
}

export async function enrollStudent(courseId: string, studentId: string): Promise<EnrollmentDTO> {
  const res = await apiClient.post<ApiSuccessBody<EnrollmentDTO>>(
    `/courses/${courseId}/enrollments`,
    { studentId }
  );
  return res.data.data;
}

export async function listRoster(courseId: string): Promise<EnrollmentDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<EnrollmentDTO[]>>(
    `/courses/${courseId}/enrollments`
  );
  return res.data.data;
}

export async function listMyEnrollments(): Promise<EnrollmentDTO[]> {
  const res = await apiClient.get<ApiSuccessBody<EnrollmentDTO[]>>('/enrollments/me');
  return res.data.data;
}

export async function updateEnrollmentStatus(
  enrollmentId: string,
  status: 'active' | 'completed' | 'dropped'
): Promise<EnrollmentDTO> {
  const res = await apiClient.patch<ApiSuccessBody<EnrollmentDTO>>(
    `/enrollments/${enrollmentId}`,
    { status }
  );
  return res.data.data;
}
