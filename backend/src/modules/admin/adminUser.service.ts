import { ConflictError } from '@common/errors/AppError';
import { ROLES } from '@common/constants/roles';
import { hashPassword } from '@common/utils/password';
import { generateAnonymousId } from '@common/utils/anonymousId';
import { userService, UserService } from '@modules/user/user.service';
import { teacherService, TeacherService } from '@modules/teacher/teacher.service';
import { authService, AuthService } from '@modules/auth/auth.service';
import { UserDocument } from '@modules/user/user.model';
import { adminIdentityService, AdminIdentityService } from './adminIdentity.service';
import { auditLogRepository, AuditLogRepository } from './auditLog.repository';
import { CreatePrivilegedUserInput, ListUsersQuery } from './adminUser.validation';

export class AdminUserService {
  constructor(
    private readonly users: UserService = userService,
    private readonly teachers: TeacherService = teacherService,
    private readonly auth: AuthService = authService,
    private readonly identityMap: AdminIdentityService = adminIdentityService,
    private readonly auditLogs: AuditLogRepository = auditLogRepository
  ) {}

  async list(query: ListUsersQuery) {
    const filter: { role?: typeof query.role; isActive?: boolean } = {};
    if (query.role) filter.role = query.role;
    if (query.isActive !== undefined) filter.isActive = query.isActive;

    const { items, total } = await this.users.list(filter, {
      skip: (query.page - 1) * query.limit,
      limit: query.limit,
    });
    return { items, total };
  }

  /**
   * The admin-provisioned flow referenced in docs/ARCHITECTURE.md §8a: the
   * only way (besides the one-time `npm run seed` bootstrap) to create a
   * `teacher` or `admin` account. Never reachable by an unauthenticated or
   * non-admin caller - see CLAUDE.md §19 (role can never come from a
   * self-registering client).
   */
  async createPrivilegedUser(input: CreatePrivilegedUserInput): Promise<UserDocument> {
    const alreadyExists = await this.users.existsByEmail(input.email);
    if (alreadyExists) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const anonymousId = generateAnonymousId();
    const user = await this.users.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      anonymousId,
    });
    await this.identityMap.createMapping(String(user._id), anonymousId);

    if (input.role === ROLES.TEACHER) {
      await this.teachers.createProfile({
        userId: String(user._id),
        subjectSpecialization: input.subjectSpecialization,
      });
    }

    return user;
  }

  async deactivate(userId: string, requestingAdminId: string, reason: string): Promise<UserDocument> {
    const user = await this.users.setActiveStatus(userId, false);
    await this.auth.revokeAllSessionsForUser(userId);
    await this.auditLogs.create({
      actorAdminId: requestingAdminId,
      action: 'ACCOUNT_DEACTIVATED',
      targetType: 'users',
      targetId: userId,
      reason,
    });
    return user;
  }

  async reactivate(userId: string, requestingAdminId: string, reason: string): Promise<UserDocument> {
    const user = await this.users.setActiveStatus(userId, true);
    await this.auditLogs.create({
      actorAdminId: requestingAdminId,
      action: 'ACCOUNT_REACTIVATED',
      targetType: 'users',
      targetId: userId,
      reason,
    });
    return user;
  }
}

export const adminUserService = new AdminUserService();
