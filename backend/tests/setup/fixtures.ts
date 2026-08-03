import { hashPassword } from '../../src/common/utils/password';
import { generateAnonymousId } from '../../src/common/utils/anonymousId';
import { signAccessToken } from '../../src/common/utils/jwt';
import { Role } from '../../src/common/constants/roles';
import { userService } from '../../src/modules/user/user.service';
import { studentService } from '../../src/modules/student/student.service';
import { teacherService } from '../../src/modules/teacher/teacher.service';
import { courseService } from '../../src/modules/course/course.service';
import { topicService } from '../../src/modules/course/topic.service';
import { adminIdentityService } from '../../src/modules/admin/adminIdentity.service';

let counter = 0;

/**
 * Test-only fixture: creates a user of any role directly through the service
 * layer (bypassing HTTP, since teacher/admin accounts have no public
 * self-registration endpoint by design - see docs/ARCHITECTURE.md §8a) and
 * returns a ready-to-use access token.
 */
export async function createUserFixture(role: Role, emailPrefix = 'fixture') {
  counter += 1;
  const email = `${emailPrefix}${counter}@example.com`;
  const passwordHash = await hashPassword('FixturePassword123');

  const anonymousId = generateAnonymousId();
  const user = await userService.createUser({
    name: `${role} ${counter}`,
    email,
    passwordHash,
    role,
    anonymousId,
  });
  await adminIdentityService.createMapping(String(user._id), anonymousId);

  if (role === 'student') {
    await studentService.createProfile({ userId: String(user._id), gradeLevel: 'Grade 9' });
  }
  if (role === 'teacher') {
    await teacherService.createProfile({ userId: String(user._id) });
  }

  const accessToken = signAccessToken({ sub: String(user._id), role });
  return { user, accessToken };
}

/**
 * Test-only fixture: creates a teacher, a published course owned by them, and
 * one topic within it, all directly through the service layer.
 */
export async function createTopicFixture(titleOverrides?: { topicTitle?: string }) {
  const teacher = await createUserFixture('teacher', 'topicowner');
  const course = await courseService.createCourse(
    { id: String(teacher.user._id), role: 'teacher' },
    {
      title: 'Fixture Course',
      subject: 'Mathematics',
      gradeLevel: 'Grade 9',
      teacherIds: [String(teacher.user._id)],
    }
  );
  const topic = await topicService.create(String(course._id), { id: String(teacher.user._id), role: 'teacher' }, {
    title: titleOverrides?.topicTitle ?? 'Fractions',
    order: 1,
    learningObjectives: ['Understand numerators and denominators'],
  });
  return { teacher, course, topic };
}
