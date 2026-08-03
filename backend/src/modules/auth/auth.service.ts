import { randomBytes } from 'crypto';
import { ConflictError, UnauthorizedError, ValidationError } from '@common/errors/AppError';
import { comparePassword, hashPassword } from '@common/utils/password';
import { generateAnonymousId } from '@common/utils/anonymousId';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '@common/utils/jwt';
import { ROLES, Role } from '@common/constants/roles';
import { emailClient } from '@common/email';
import { logger } from '@config/logger';
import { userService, UserService } from '@modules/user/user.service';
import { studentService, StudentService } from '@modules/student/student.service';
import { adminIdentityService, AdminIdentityService } from '@modules/admin/adminIdentity.service';
import { authRepository, AuthRepository } from './auth.repository';
import { AuthResult, TokenPair } from './auth.types';
import { LoginInput, RegisterInput, ResetPasswordInput } from './auth.validation';

const EMAIL_VERIFICATION_TTL_MS = 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export class AuthService {
  constructor(
    private readonly users: UserService = userService,
    private readonly students: StudentService = studentService,
    private readonly identityMap: AdminIdentityService = adminIdentityService,
    private readonly repository: AuthRepository = authRepository
  ) {}

  private async issueTokenPair(userId: string, role: Role): Promise<TokenPair> {
    const accessToken = signAccessToken({ sub: userId, role });
    const refreshToken = signRefreshToken({ sub: userId });
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
    await this.repository.saveRefreshToken(userId, refreshToken, expiresAt);
    return { accessToken, refreshToken };
  }

  async register(input: RegisterInput): Promise<AuthResult> {
    const alreadyExists = await this.users.existsByEmail(input.email);
    if (alreadyExists) {
      throw new ConflictError('An account with this email already exists.');
    }

    const passwordHash = await hashPassword(input.password);
    const anonymousId = generateAnonymousId();

    // Registration always creates a `student` account. Teacher/admin accounts
    // are provisioned only by an existing admin (Phase 8 admin module) or the
    // bootstrap seed script - the client can never request an elevated role.
    const user = await this.users.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: ROLES.STUDENT,
      anonymousId,
    });

    await this.students.createProfile({
      userId: String(user._id),
      gradeLevel: input.gradeLevel,
    });

    // Not wrapped in a DB transaction with the user insert (no replica-set
    // requirement introduced for this alone) - acceptable simplification;
    // see docs/ROADMAP.md Phase 7 scope notes. A backfill script exists for
    // any user ever created without a mapping (src/database/backfillIdentityMap.ts).
    await this.identityMap.createMapping(String(user._id), anonymousId);

    await this.sendEmailVerification(String(user._id), user.email);

    const tokens = await this.issueTokenPair(String(user._id), user.role);
    return { user: this.users.toDTO(user), tokens };
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await this.users.getByEmail(input.email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password.');
    }
    if (!user.isActive) {
      throw new UnauthorizedError('This account has been deactivated.');
    }

    const passwordMatches = await comparePassword(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedError('Invalid email or password.');
    }

    await this.users.recordLogin(String(user._id));
    const tokens = await this.issueTokenPair(String(user._id), user.role);
    return { user: this.users.toDTO(user), tokens };
  }

  async refresh(rawRefreshToken: string): Promise<TokenPair> {
    const payload = verifyRefreshToken(rawRefreshToken);
    const active = await this.repository.findActiveRefreshToken(rawRefreshToken);
    if (!active || String(active.userId) !== payload.sub) {
      throw new UnauthorizedError('Invalid or expired refresh token.');
    }

    const user = await this.users.getById(payload.sub);
    await this.repository.revokeRefreshToken(rawRefreshToken);
    return this.issueTokenPair(String(user._id), user.role);
  }

  async logout(rawRefreshToken: string): Promise<void> {
    await this.repository.revokeRefreshToken(rawRefreshToken);
  }

  async sendEmailVerification(userId: string, email: string): Promise<void> {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + EMAIL_VERIFICATION_TTL_MS);
    await this.repository.saveVerificationToken(userId, 'email_verification', token, expiresAt);
    await emailClient.send({
      to: email,
      subject: 'Verify your ModEd.ai email address',
      body: `Your email verification token is: ${token} (expires in 24 hours).`,
    });
  }

  async verifyEmail(rawToken: string): Promise<void> {
    const record = await this.repository.findActiveVerificationToken(
      rawToken,
      'email_verification'
    );
    if (!record) {
      throw new ValidationError('This verification link is invalid or has expired.');
    }
    await this.users.markEmailVerified(String(record.userId));
    await this.repository.markVerificationTokenUsed(String(record._id));
  }

  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.users.getByEmail(email);
    // Always return successfully to the caller regardless of whether the
    // account exists, to avoid leaking which emails are registered.
    if (!user) {
      logger.info('Password reset requested for unknown email', { email });
      return;
    }

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS);
    await this.repository.saveVerificationToken(String(user._id), 'password_reset', token, expiresAt);
    await emailClient.send({
      to: user.email,
      subject: 'Reset your ModEd.ai password',
      body: `Your password reset token is: ${token} (expires in 1 hour).`,
    });
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const record = await this.repository.findActiveVerificationToken(input.token, 'password_reset');
    if (!record) {
      throw new ValidationError('This password reset link is invalid or has expired.');
    }

    const passwordHash = await hashPassword(input.newPassword);
    await this.users.setPasswordHash(String(record.userId), passwordHash);
    await this.repository.markVerificationTokenUsed(String(record._id));
    // Force re-authentication everywhere after a password reset.
    await this.repository.revokeAllRefreshTokensForUser(String(record.userId));
  }

  /** Used by AdminUserService when deactivating an account - forces logout everywhere. */
  async revokeAllSessionsForUser(userId: string): Promise<void> {
    await this.repository.revokeAllRefreshTokensForUser(userId);
  }
}

export const authService = new AuthService();
