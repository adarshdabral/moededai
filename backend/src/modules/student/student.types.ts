export interface CreateStudentProfileInput {
  userId: string;
  gradeLevel: string;
}

export interface StudentProfileDTO {
  userId: string;
  gradeLevel: string;
  enrolledCourseIds: string[];
  learningStreakDays: number;
  lastActivityAt?: Date;
}
