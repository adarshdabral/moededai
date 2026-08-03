import { apiClient } from './client';
import type { ApiSuccessBody, PaginationMeta, Role } from '@/types/api';
import type { NotificationDTO } from '@/types/domain';

export async function listNotifications(
  page = 1,
  limit = 20
): Promise<{ items: NotificationDTO[]; pagination: PaginationMeta }> {
  const res = await apiClient.get<ApiSuccessBody<NotificationDTO[]>>('/notifications', {
    params: { page, limit },
  });
  return { items: res.data.data, pagination: res.data.meta!.pagination };
}

export async function markNotificationRead(notificationId: string): Promise<NotificationDTO> {
  const res = await apiClient.patch<ApiSuccessBody<NotificationDTO>>(
    `/notifications/${notificationId}/read`
  );
  return res.data.data;
}

export async function sendAnnouncement(input: {
  title: string;
  body: string;
  role?: Role;
}): Promise<{ recipientCount: number }> {
  const res = await apiClient.post<ApiSuccessBody<{ recipientCount: number }>>(
    '/notifications/announce',
    input
  );
  return res.data.data;
}
