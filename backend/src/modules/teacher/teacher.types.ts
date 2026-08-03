export interface CreateTeacherProfileInput {
  userId: string;
  subjectSpecialization?: string[];
}

export interface TeacherProfileDTO {
  userId: string;
  subjectSpecialization: string[];
  assignedCourseIds: string[];
}
