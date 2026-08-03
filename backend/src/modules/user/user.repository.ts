import { BaseRepository } from '@database/baseRepository';
import { UserDocument, UserModel } from './user.model';

export class UserRepository extends BaseRepository<UserDocument> {
  constructor() {
    super(UserModel);
  }

  async findByEmail(email: string, includePasswordHash = false): Promise<UserDocument | null> {
    const query = UserModel.findOne({ email: email.toLowerCase() });
    if (includePasswordHash) {
      query.select('+passwordHash');
    }
    return query.exec();
  }

  async findByAnonymousId(anonymousId: string): Promise<UserDocument | null> {
    return UserModel.findOne({ anonymousId }).exec();
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await UserModel.countDocuments({ email: email.toLowerCase() }).exec();
    return count > 0;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await UserModel.updateOne({ _id: userId }, { $set: { lastLoginAt: new Date() } }).exec();
  }
}

export const userRepository = new UserRepository();
