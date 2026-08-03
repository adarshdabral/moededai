export interface CourseDTO {
  id: string;
  title: string;
  description?: string;
  subject: string;
  gradeLevel: string;
  teacherIds: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TopicDTO {
  id: string;
  courseId: string;
  title: string;
  order: number;
  learningObjectives: string[];
}

export interface ResourceDTO {
  id: string;
  topicId: string;
  type: string;
  title: string;
  url: string;
  uploadedBy: string;
}

export interface AssignmentDTO {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueAt: Date;
  attachmentUrl?: string;
  createdBy: string;
}

export interface LearningPathDTO {
  id: string;
  courseId: string;
  title: string;
  topicSequence: string[];
}

export interface EnrollmentDTO {
  id: string;
  studentId: string;
  courseId: string;
  status: string;
  enrolledAt: Date;
}
