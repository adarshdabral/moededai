import { Request, Response } from 'express';
import { sendSuccess } from '@common/utils/apiResponse';
import { notificationService } from './notification.service';
import { ListNotificationsQuery, SendAnnouncementInput } from './notification.validation';

export class NotificationController {
  async listMine(req: Request, res: Response): Promise<void> {
    const query = req.query as unknown as ListNotificationsQuery;
    const { items, pagination } = await notificationService.listMine(req.user!.id, query);
    sendSuccess(res, items.map((n) => notificationService.toDTO(n)), 200, pagination);
  }

  async markRead(req: Request, res: Response): Promise<void> {
    const notification = await notificationService.markRead(req.params.notificationId, req.user!.id);
    sendSuccess(res, notificationService.toDTO(notification));
  }

  async sendAnnouncement(req: Request, res: Response): Promise<void> {
    const { title, body, role } = req.body as SendAnnouncementInput;
    const recipientCount = await notificationService.sendAnnouncement(title, body, role);
    sendSuccess(res, { recipientCount }, 201);
  }
}

export const notificationController = new NotificationController();
