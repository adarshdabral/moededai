import { ForbiddenError, NotFoundError } from '@common/errors/AppError';
import { buildPaginationMeta, PaginationQuery, toSkipLimit } from '@common/utils/pagination';
import { emailClient } from '@common/email';
import { userService, UserService } from '@modules/user/user.service';
import { Role } from '@common/constants/roles';
import { notificationRepository, NotificationRepository } from './notification.repository';
import { NotificationDocument, NotificationType } from './notification.model';
import { NotificationDTO } from './notification.types';

export class NotificationService {
  constructor(
    private readonly repository: NotificationRepository = notificationRepository,
    private readonly users: UserService = userService
  ) {}

  toDTO(notification: NotificationDocument): NotificationDTO {
    return {
      id: String(notification._id),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      isRead: notification.isRead,
      deliveredViaEmail: notification.deliveredViaEmail,
      createdAt: notification.createdAt,
    };
  }

  /**
   * Called from the owning service after the triggering event (test
   * submission, assessment window opening, admin announcement) - never
   * called speculatively, and never coupling an unrelated module into this
   * one. See CLAUDE.md §9 (progress tracking) / docs/ROADMAP.md Phase 9.
   */
  async notify(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    sendEmail = false
  ): Promise<NotificationDocument> {
    let deliveredViaEmail = false;

    if (sendEmail) {
      const user = await this.users.getById(userId);
      await emailClient.send({ to: user.email, subject: title, body });
      deliveredViaEmail = true;
    }

    return this.repository.create({
      userId: userId as unknown as NotificationDocument['userId'],
      type,
      title,
      body,
      isRead: false,
      deliveredViaEmail,
    });
  }

  async listMine(userId: string, query: { page: number; limit: number }) {
    const { skip, limit } = toSkipLimit(query as PaginationQuery);
    const [items, total] = await Promise.all([
      this.repository.findByUser(userId, { skip, limit }),
      this.repository.countByUser(userId),
    ]);
    return { items, pagination: buildPaginationMeta(query as PaginationQuery, total) };
  }

  /** Admin-triggered broadcast - see NotificationController/routes for the admin-only guard. */
  async sendAnnouncement(title: string, body: string, role?: Role): Promise<number> {
    const recipients = await this.users.listAllActive(role ? { role } : {});
    await Promise.all(
      recipients.map((user) =>
        this.repository.create({
          userId: String(user._id) as unknown as NotificationDocument['userId'],
          type: 'announcement',
          title,
          body,
          isRead: false,
          deliveredViaEmail: false,
        })
      )
    );
    return recipients.length;
  }

  async markRead(notificationId: string, userId: string): Promise<NotificationDocument> {
    const notification = await this.repository.findById(notificationId);
    if (!notification) throw new NotFoundError('Notification');
    if (String(notification.userId) !== userId) {
      throw new ForbiddenError('This notification does not belong to you.');
    }

    const updated = await this.repository.updateById(notificationId, {
      $set: { isRead: true },
    });
    if (!updated) throw new NotFoundError('Notification');
    return updated;
  }
}

export const notificationService = new NotificationService();
