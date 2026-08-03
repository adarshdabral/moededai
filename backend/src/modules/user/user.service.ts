import { NotFoundError } from '@common/errors/AppError';
import { Role } from '@common/constants/roles';
import { userRepository, UserRepository } from './user.repository';
import { UserDocument } from './user.model';
import { CreateUserInput, UserDTO } from './user.types';

export class UserService {
  constructor(private readonly repository: UserRepository = userRepository) {}

  toDTO(user: UserDocument): UserDTO {
    return {
      id: String(user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      anonymousId: user.anonymousId,
      isEmailVerified: user.isEmailVerified,
      isActive: user.isActive,
      avatarUrl: user.avatarUrl,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /** Used only by AuthService.register - never called with a client-supplied role. */
  async createUser(input: CreateUserInput): Promise<UserDocument> {
    return this.repository.create(input);
  }

  async getById(userId: string): Promise<UserDocument> {
    const user = await this.repository.findById(userId);
    if (!user) throw new NotFoundError('User');
    return user;
  }

  async getByEmail(email: string, includePasswordHash = false): Promise<UserDocument | null> {
    return this.repository.findByEmail(email, includePasswordHash);
  }

  async existsByEmail(email: string): Promise<boolean> {
    return this.repository.existsByEmail(email);
  }

  async updateProfile(
    userId: string,
    updates: { name?: string; avatarUrl?: string }
  ): Promise<UserDocument> {
    const updated = await this.repository.updateById(userId, { $set: updates });
    if (!updated) throw new NotFoundError('User');
    return updated;
  }

  async markEmailVerified(userId: string): Promise<void> {
    await this.repository.updateById(userId, { $set: { isEmailVerified: true } });
  }

  async setPasswordHash(userId: string, passwordHash: string): Promise<void> {
    await this.repository.updateById(userId, { $set: { passwordHash } });
  }

  async setActiveStatus(userId: string, isActive: boolean): Promise<UserDocument> {
    const updated = await this.repository.updateById(userId, { $set: { isActive } });
    if (!updated) throw new NotFoundError('User');
    return updated;
  }

  async recordLogin(userId: string): Promise<void> {
    await this.repository.updateLastLogin(userId);
  }

  /** Used by AdminUserService (cross-module) for the Admin Portal's user list. */
  async list(
    filter: { role?: Role; isActive?: boolean },
    options: { skip?: number; limit?: number }
  ): Promise<{ items: UserDocument[]; total: number }> {
    const [items, total] = await Promise.all([
      this.repository.find(filter, { ...options, sort: { createdAt: -1 } }),
      this.repository.count(filter),
    ]);
    return { items, total };
  }

  /** Used by NotificationService for admin announcement broadcasts. */
  async listAllActive(filter: { role?: Role }): Promise<UserDocument[]> {
    return this.repository.find({ ...filter, isActive: true });
  }
}

export const userService = new UserService();
