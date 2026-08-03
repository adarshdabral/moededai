import { ForbiddenError } from '@common/errors/AppError';
import { AuthenticatedUser } from '@common/types/express';
import { courseService, CourseService } from '@modules/course/course.service';
import { enrollmentService, EnrollmentService } from '@modules/course/enrollment.service';
import { studentService, StudentService } from '@modules/student/student.service';
import { knowledgeScoreService, KnowledgeScoreService } from '@modules/knowledge-score/knowledgeScore.service';
import { GrowthAnalyticsDTO, StudentComparativeEntryDTO } from './analytics.types';

export class AnalyticsService {
  constructor(
    private readonly courses: CourseService = courseService,
    private readonly enrollments: EnrollmentService = enrollmentService,
    private readonly students: StudentService = studentService,
    private readonly knowledgeScores: KnowledgeScoreService = knowledgeScoreService
  ) {}

  private async buildGrowth(studentId: string): Promise<GrowthAnalyticsDTO> {
    const [scores, timeline, profile] = await Promise.all([
      this.knowledgeScores.listMine(studentId),
      this.knowledgeScores.getHistoryMine(studentId),
      this.students.getByUserId(studentId),
    ]);

    return {
      topicMastery: scores.map((score) => this.knowledgeScores.toDTO(score)),
      progressTimeline: timeline,
      learningStreakDays: profile.learningStreakDays,
    };
  }

  async getMyGrowth(requester: AuthenticatedUser): Promise<GrowthAnalyticsDTO> {
    return this.buildGrowth(requester.id);
  }

  /**
   * Teacher Portal: a teacher may view a student's analytics only if that
   * student is actively enrolled in at least one of the teacher's own
   * courses - never for an arbitrary student ID.
   */
  async getStudentAnalyticsForTeacher(
    teacherId: string,
    studentId: string
  ): Promise<GrowthAnalyticsDTO> {
    const [teacherCourses, studentEnrollments] = await Promise.all([
      this.courses.listMine(teacherId),
      this.enrollments.listMine(studentId),
    ]);

    const teacherCourseIds = new Set(teacherCourses.map((course) => String(course._id)));
    const sharesActiveCourse = studentEnrollments.some(
      (enrollment) =>
        enrollment.status === 'active' && teacherCourseIds.has(String(enrollment.courseId))
    );

    if (!sharesActiveCourse) {
      throw new ForbiddenError('This student is not enrolled in any of your courses.');
    }

    return this.buildGrowth(studentId);
  }

  async getCourseComparative(
    courseId: string,
    requester: AuthenticatedUser
  ): Promise<StudentComparativeEntryDTO[]> {
    await this.courses.ensureCanManageCourse(courseId, requester);
    const activeEnrollments = await this.enrollments.listActiveByCourse(courseId);

    const rows = await Promise.all(
      activeEnrollments.map(async (enrollment) => {
        const studentId = String(enrollment.studentId);
        const scores = await this.knowledgeScores.listMine(studentId);
        const averageScore =
          scores.length === 0
            ? 0
            : Math.round(
                (scores.reduce((sum, s) => sum + s.currentScore, 0) / scores.length) * 100
              ) / 100;
        return { studentId, averageScore, topicsAssessed: scores.length };
      })
    );

    return rows.sort((a, b) => b.averageScore - a.averageScore);
  }
}

export const analyticsService = new AnalyticsService();
