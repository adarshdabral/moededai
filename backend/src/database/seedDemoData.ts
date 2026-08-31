/**
 * Idempotent demo-data script: creates one default teacher account, one
 * default student account, and a sample published course (with topics, and
 * the student enrolled) so the frontend has real content to show without
 * any manual setup. Run via `npm run seed:demo`.
 *
 * Dev/demo convenience only - never run this against a production database.
 * Every step reuses the same services the real API endpoints use (no
 * business logic is duplicated or bypassed); the only thing that couldn't
 * go through HTTP is the teacher/student role assignment, for the same
 * reason `seed.ts` bypasses AuthService.register for the admin account.
 */
import { connectDatabase, disconnectDatabase } from '@config/database';
import { logger } from '@config/logger';
import { env } from '@config/env';
import { ROLES } from '@common/constants/roles';
import { hashPassword } from '@common/utils/password';
import { generateAnonymousId } from '@common/utils/anonymousId';
import { userService } from '@modules/user/user.service';
import { adminIdentityService } from '@modules/admin/adminIdentity.service';
import { studentService } from '@modules/student/student.service';
import { teacherService } from '@modules/teacher/teacher.service';
import { courseService } from '@modules/course/course.service';
import { courseRepository } from '@modules/course/course.repository';
import { topicService } from '@modules/course/topic.service';
import { topicRepository } from '@modules/course/topic.repository';
import { enrollmentService } from '@modules/course/enrollment.service';
import type { UserDocument } from '@modules/user/user.model';

const DEMO_TEACHER = {
  name: env.DEMO_TEACHER_NAME,
  email: env.DEMO_TEACHER_EMAIL,
  password: env.DEMO_TEACHER_PASSWORD,
  subject: 'Mathematics',
};
const DEMO_STUDENT = {
  name: env.DEMO_STUDENT_NAME,
  email: env.DEMO_STUDENT_EMAIL,
  password: env.DEMO_STUDENT_PASSWORD,
  gradeLevel: 'Grade 9',
};
const DEMO_COURSE = { title: 'Algebra I', subject: 'Mathematics', gradeLevel: 'Grade 9' };
const DEMO_TOPICS = [
  {
    title: 'Linear Equations',
    order: 1,
    learningObjectives: [
      'Solve one-variable linear equations',
      'Graph a linear equation on a coordinate plane',
    ],
  },
  {
    title: 'Quadratic Equations',
    order: 2,
    learningObjectives: ['Factor a quadratic expression', 'Apply the quadratic formula'],
  },
];

async function getOrCreateUser(
  email: string,
  name: string,
  password: string,
  role: (typeof ROLES)[keyof typeof ROLES]
): Promise<{ user: UserDocument; wasCreated: boolean }> {
  const existing = await userService.getByEmail(email);
  if (existing) return { user: existing, wasCreated: false };

  const passwordHash = await hashPassword(password);
  const anonymousId = generateAnonymousId();
  const user = await userService.createUser({ name, email, passwordHash, role, anonymousId });
  await userService.markEmailVerified(String(user._id));
  await adminIdentityService.createMapping(String(user._id), anonymousId);
  return { user, wasCreated: true };
}

async function seedDemoData(): Promise<void> {
  const { user: teacher, wasCreated: teacherCreated } = await getOrCreateUser(
    DEMO_TEACHER.email,
    DEMO_TEACHER.name,
    DEMO_TEACHER.password,
    ROLES.TEACHER
  );
  if (teacherCreated) {
    await teacherService.createProfile({
      userId: String(teacher._id),
      subjectSpecialization: [DEMO_TEACHER.subject],
    });
    logger.info('Demo teacher created', { email: teacher.email });
  } else {
    logger.info('Demo teacher already exists - skipped', { email: teacher.email });
  }

  const { user: student, wasCreated: studentCreated } = await getOrCreateUser(
    DEMO_STUDENT.email,
    DEMO_STUDENT.name,
    DEMO_STUDENT.password,
    ROLES.STUDENT
  );
  if (studentCreated) {
    await studentService.createProfile({
      userId: String(student._id),
      gradeLevel: DEMO_STUDENT.gradeLevel,
    });
    logger.info('Demo student created', { email: student.email });
  } else {
    logger.info('Demo student already exists - skipped', { email: student.email });
  }

  const teacherRequester = { id: String(teacher._id), role: ROLES.TEACHER };

  let course = await courseRepository.findOne({
    title: DEMO_COURSE.title,
    teacherIds: teacher._id,
  });
  if (!course) {
    course = await courseService.createCourse(teacherRequester, {
      ...DEMO_COURSE,
      teacherIds: [String(teacher._id)],
    });
    await courseService.update(String(course._id), teacherRequester, { isPublished: true });
    logger.info('Demo course created', { title: course.title });
  } else {
    logger.info('Demo course already exists - skipped', { title: course.title });
  }

  const existingTopics = await topicRepository.findByCourse(String(course._id));
  if (existingTopics.length === 0) {
    for (const topic of DEMO_TOPICS) {
      await topicService.create(String(course._id), teacherRequester, topic);
    }
    logger.info('Demo topics created', { count: DEMO_TOPICS.length });
  } else {
    logger.info('Demo topics already exist - skipped', { count: existingTopics.length });
  }

  try {
    await enrollmentService.enroll(String(course._id), teacherRequester, {
      studentId: String(student._id),
    });
    logger.info('Demo student enrolled in demo course');
  } catch (error) {
    logger.info('Demo enrollment already exists or failed - skipped', {
      message: (error as Error).message,
    });
  }

  logger.info('Demo data seed complete - see DEMO_TEACHER_PASSWORD/DEMO_STUDENT_PASSWORD in .env for credentials', {
    teacherEmail: DEMO_TEACHER.email,
    studentEmail: DEMO_STUDENT.email,
  });
}

async function run(): Promise<void> {
  await connectDatabase();
  try {
    await seedDemoData();
  } finally {
    await disconnectDatabase();
  }
}

run().catch((error) => {
  logger.error('Demo data seeding failed', { error });
  process.exit(1);
});
