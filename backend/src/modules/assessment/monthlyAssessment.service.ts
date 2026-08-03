import { NotFoundError, ValidationError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { courseService, CourseService } from '@modules/course/course.service';
import { topicService, TopicService } from '@modules/course/topic.service';
import { enrollmentService, EnrollmentService } from '@modules/course/enrollment.service';
import { aiTestService, AiTestService } from '@modules/ai-test/aiTest.service';
import { testAttemptService, TestAttemptService } from '@modules/ai-test/testAttempt.service';
import { aiGeneratedTestRepository, AiGeneratedTestRepository } from '@modules/ai-test/aiGeneratedTest.repository';
import { AiGeneratedTestDocument } from '@modules/ai-test/aiGeneratedTest.model';
import { TestAttemptDocument } from '@modules/ai-test/testAttempt.model';
import { notificationService, NotificationService } from '@modules/notification/notification.service';
import {
  monthlyAssessmentRepository,
  MonthlyAssessmentRepository,
} from './monthlyAssessment.repository';
import { MonthlyAssessmentDocument } from './monthlyAssessment.model';
import { MonthlyAssessmentDTO } from './monthlyAssessment.types';
import { ScheduleMonthlyAssessmentInput } from './monthlyAssessment.validation';

export class MonthlyAssessmentService {
  constructor(
    private readonly repository: MonthlyAssessmentRepository = monthlyAssessmentRepository,
    private readonly courses: CourseService = courseService,
    private readonly topics: TopicService = topicService,
    private readonly enrollments: EnrollmentService = enrollmentService,
    private readonly aiTests: AiTestService = aiTestService,
    private readonly attempts: TestAttemptService = testAttemptService,
    private readonly testRepository: AiGeneratedTestRepository = aiGeneratedTestRepository,
    private readonly notifications: NotificationService = notificationService
  ) {}

  toDTO(assessment: MonthlyAssessmentDocument): MonthlyAssessmentDTO {
    return {
      id: String(assessment._id),
      courseId: String(assessment.courseId),
      topicId: String(assessment.topicId),
      scheduledFor: assessment.scheduledFor,
      windowClosesAt: assessment.windowClosesAt,
      status: assessment.status,
      studentCount: assessment.generatedTestIds.length,
    };
  }

  /**
   * Schedules a monthly assessment and immediately generates one personalized
   * AI test per currently-active enrolled student, reusing AiTestService
   * (cross-module, via its public service interface only).
   */
  async schedule(
    courseId: string,
    requester: AuthenticatedUser,
    input: ScheduleMonthlyAssessmentInput
  ): Promise<MonthlyAssessmentDocument> {
    await this.courses.ensureCanManageCourse(courseId, requester);

    const topic = await this.topics.getById(input.topicId);
    if (String(topic.courseId) !== courseId) {
      throw new ValidationError('The topic must belong to the specified course.');
    }

    const activeEnrollments = await this.enrollments.listActiveByCourse(courseId);
    if (activeEnrollments.length === 0) {
      throw new ValidationError('Cannot schedule a monthly assessment with no active students.');
    }

    const generatedTestIds: string[] = [];
    for (const enrollment of activeEnrollments) {
      const studentId = String(enrollment.studentId);
      const test = await this.aiTests.generate(
        { id: studentId, role: 'student' },
        {
          topicId: input.topicId,
          difficulty: input.difficulty,
          questionCount: input.questionCount,
          timeLimitMinutes: input.timeLimitMinutes,
        }
      );
      generatedTestIds.push(String(test._id));
    }

    return this.repository.create({
      courseId: courseId as unknown as MonthlyAssessmentDocument['courseId'],
      topicId: input.topicId as unknown as MonthlyAssessmentDocument['topicId'],
      scheduledFor: input.scheduledFor,
      windowClosesAt: input.windowClosesAt,
      generatedTestIds: generatedTestIds as unknown as MonthlyAssessmentDocument['generatedTestIds'],
      status: 'scheduled',
    });
  }

  async listByCourse(
    courseId: string,
    requester: AuthenticatedUser
  ): Promise<MonthlyAssessmentDocument[]> {
    await this.courses.ensureCanManageCourse(courseId, requester);
    return this.repository.findByCourse(courseId);
  }

  async getById(assessmentId: string): Promise<MonthlyAssessmentDocument> {
    const assessment = await this.repository.findById(assessmentId);
    if (!assessment) throw new NotFoundError('Monthly assessment');
    return assessment;
  }

  private async getMyTest(
    assessment: MonthlyAssessmentDocument,
    requester: AuthenticatedUser
  ): Promise<AiGeneratedTestDocument> {
    if (assessment.status !== 'open') {
      throw new ValidationError('This monthly assessment is not currently open.');
    }
    const candidates = await Promise.all(
      assessment.generatedTestIds.map((id) => this.testRepository.findById(String(id)))
    );
    const mine = candidates.find(
      (test) => test && String(test.generatedFor) === requester.id
    );
    if (!mine) {
      throw new NotFoundError('Your assessment test');
    }
    return mine;
  }

  async startMyAttempt(
    assessmentId: string,
    requester: AuthenticatedUser
  ): Promise<TestAttemptDocument> {
    const assessment = await this.getById(assessmentId);
    const test = await this.getMyTest(assessment, requester);
    return this.attempts.startForMonthlyAssessment(requester, String(test._id), assessmentId);
  }

  /** Opens assessments whose scheduledFor has passed, and closes ones past windowClosesAt. */
  async runScheduler(now: Date = new Date()): Promise<{ opened: number; closed: number }> {
    const dueToOpen = await this.repository.findDueToOpen(now);
    for (const assessment of dueToOpen) {
      await this.repository.updateById(String(assessment._id), { $set: { status: 'open' } });
      await this.notifyStudentsAssessmentIsOpen(assessment);
    }

    const dueToClose = await this.repository.findDueToClose(now);
    for (const assessment of dueToClose) {
      await this.repository.updateById(String(assessment._id), { $set: { status: 'closed' } });
    }

    return { opened: dueToOpen.length, closed: dueToClose.length };
  }

  private async notifyStudentsAssessmentIsOpen(assessment: MonthlyAssessmentDocument): Promise<void> {
    const tests = await Promise.all(
      assessment.generatedTestIds.map((id) => this.testRepository.findById(String(id)))
    );
    const topic = await this.topics.getById(String(assessment.topicId));

    await Promise.all(
      tests
        .filter((test): test is AiGeneratedTestDocument => Boolean(test?.generatedFor))
        .map((test) =>
          this.notifications.notify(
            String(test.generatedFor),
            'test_reminder',
            'Monthly assessment now open',
            `Your monthly assessment for "${topic.title}" is now open. Complete it before the window closes.`
          )
        )
    );
  }
}

export const monthlyAssessmentService = new MonthlyAssessmentService();
