import {
  AnonymousIdentityMapDocument,
  AnonymousIdentityMapModel,
} from './anonymousIdentityMap.model';

export class AnonymousIdentityMapRepository {
  async create(userId: string, anonymousId: string): Promise<AnonymousIdentityMapDocument> {
    return AnonymousIdentityMapModel.create({ userId, anonymousId });
  }

  async findByAnonymousId(anonymousId: string): Promise<AnonymousIdentityMapDocument | null> {
    return AnonymousIdentityMapModel.findOne({ anonymousId }).exec();
  }

  async existsForUser(userId: string): Promise<boolean> {
    const count = await AnonymousIdentityMapModel.countDocuments({ userId }).exec();
    return count > 0;
  }
}

export const anonymousIdentityMapRepository = new AnonymousIdentityMapRepository();
