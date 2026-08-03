export interface DoubtDTO {
  id: string;
  authorAnonymousId: string;
  courseId: string;
  topicId?: string;
  question: string;
  status: string;
  createdAt: Date;
}

export interface DoubtReplyDTO {
  id: string;
  doubtId: string;
  authorRole: string;
  authorRef: string;
  message: string;
  createdAt: Date;
}

export interface AbuseReportDTO {
  id: string;
  reportedDoubtId?: string;
  reportedReplyId?: string;
  reportedByUserId: string;
  reason: string;
  status: string;
  resolvedByAdminId?: string;
  resolutionNotes?: string;
}
