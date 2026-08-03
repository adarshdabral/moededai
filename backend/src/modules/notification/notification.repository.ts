import { BaseRepository } from '@database/baseRepository';
import { NotificationDocument, NotificationModel } from './notification.model';

export class NotificationRepository extends BaseRepository<NotificationDocument> {
  constructor() {
    super(NotificationModel);
  }

  async findByUser(
    userId: string,
    options: { skip?: number; limit?: number }
  ): Promise<NotificationDocument[]> {
    return NotificationModel.find({ userId })
      .sort({ isRead: 1, createdAt: -1 })
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 20)
      .lean<NotificationDocument[]>()
      .exec();
  }

  async countByUser(userId: string): Promise<number> {
    return NotificationModel.countDocuments({ userId }).exec();
  }
}

export const notificationRepository = new NotificationRepository();
