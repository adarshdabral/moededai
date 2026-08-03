/** Domain DTOs, mirroring the backend's *.types.ts files 1:1 per module. */

// ---- student / teacher profiles ----
export interface StudentProfileDTO {
  userId: string;
  gradeLevel: string;
  enrolledCourseIds: string[];
  learningStreakDays: number;
  lastActivityAt?: string;
}

export interface TeacherProfileDTO {
  userId: string;
  subjectSpecialization: string[];
  assignedCourseIds: string[];
}

// ---- course module ----
export interface CourseDTO {
  id: string;
  title: string;
  description?: string;
  subject: string;
  gradeLevel: string;
  teacherIds: string[];
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
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
  type: 'document' | 'video' | 'link' | 'upload';
  title: string;
  url: string;
  uploadedBy: string;
}

export interface AssignmentDTO {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueAt: string;
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
  status: 'active' | 'completed' | 'dropped';
  enrolledAt: string;
}

// ---- ai-tutor module ----
export interface ConversationMessageDTO {
  role: 'student' | 'assistant';
  content: string;
  sentAt: string;
}

export interface ConversationSummaryDTO {
  id: string;
  topicId?: string;
  title: string;
  lastMessageAt: string;
  messageCount: number;
}

export interface ConversationDetailDTO extends ConversationSummaryDTO {
  messages: ConversationMessageDTO[];
}

// ---- ai-test module ----
export interface QuestionPublicDTO {
  type: 'mcq' | 'subjective';
  prompt: string;
  options?: string[];
  points: number;
}

export interface AiGeneratedTestDTO {
  id: string;
  topicId: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'adaptive';
  timeLimitMinutes: number;
  questions: QuestionPublicDTO[];
}

export interface AttemptAnswerDTO {
  questionIndex: number;
  response: string;
  isCorrect: boolean;
  pointsAwarded: number;
}

export interface TestAttemptDTO {
  id: string;
  testId: string;
  studentId: string;
  attemptType: 'practice' | 'monthly_assessment';
  score: number;
  weakTopicsIdentified: string[];
  answers: AttemptAnswerDTO[];
  startedAt: string;
  submittedAt?: string;
}

// ---- knowledge-score module ----
export interface KnowledgeScoreDTO {
  topicId: string;
  currentScore: number;
  attemptsCount: number;
  lastUpdatedAt: string;
}

export interface KnowledgeScoreHistoryEntryDTO {
  topicId: string;
  score: number;
  recordedAt: string;
}

// ---- assessment module ----
export interface MonthlyAssessmentDTO {
  id: string;
  courseId: string;
  topicId: string;
  scheduledFor: string;
  windowClosesAt: string;
  status: 'scheduled' | 'open' | 'closed';
  studentCount: number;
}

// ---- analytics module ----
export interface GrowthAnalyticsDTO {
  topicMastery: KnowledgeScoreDTO[];
  progressTimeline: KnowledgeScoreHistoryEntryDTO[];
  learningStreakDays: number;
}

export interface StudentComparativeEntryDTO {
  studentId: string;
  averageScore: number;
  topicsAssessed: number;
}

// ---- doubt module ----
export interface DoubtDTO {
  id: string;
  authorAnonymousId: string;
  courseId: string;
  topicId?: string;
  question: string;
  status: 'open' | 'answered' | 'closed';
  createdAt: string;
}

export interface DoubtReplyDTO {
  id: string;
  doubtId: string;
  authorRole: 'teacher' | 'anonymous_student';
  authorRef: string;
  message: string;
  createdAt: string;
}

export interface AbuseReportDTO {
  id: string;
  reportedDoubtId?: string;
  reportedReplyId?: string;
  reportedByUserId: string;
  reason: string;
  status: 'pending' | 'reviewing' | 'resolved' | 'dismissed';
  resolvedByAdminId?: string;
  resolutionNotes?: string;
}

// ---- admin module ----
export interface ResolvedIdentityDTO {
  userId: string;
  name: string;
  email: string;
  anonymousId: string;
}

export interface AuditLogDTO {
  id: string;
  actorAdminId: string;
  action: string;
  targetType: string;
  targetId: string;
  reason: string;
  createdAt: string;
}

export interface PlatformSettingsDTO {
  maintenanceMode: boolean;
  announcement?: string;
}

// ---- notification module ----
export interface NotificationDTO {
  id: string;
  type: 'test_reminder' | 'score_update' | 'announcement' | 'doubt_reply';
  title: string;
  body: string;
  isRead: boolean;
  deliveredViaEmail: boolean;
  createdAt: string;
}
