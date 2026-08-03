export interface NotificationDTO {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  deliveredViaEmail: boolean;
  createdAt: Date;
}
