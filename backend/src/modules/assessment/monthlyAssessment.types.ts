export interface MonthlyAssessmentDTO {
  id: string;
  courseId: string;
  topicId: string;
  scheduledFor: Date;
  windowClosesAt: Date;
  status: string;
  studentCount: number;
}
