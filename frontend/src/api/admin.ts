import { apiClient } from './client';
import type { ApiSuccessBody, PaginationMeta, Role, UserDTO } from '@/types/api';
import type { AuditLogDTO, PlatformSettingsDTO, ResolvedIdentityDTO } from '@/types/domain';

export interface ListUsersParams {
  page?: number;
  limit?: number;
  role?: Role;
  isActive?: boolean;
}

export async function listUsers(
  params: ListUsersParams = {}
): Promise<{ items: UserDTO[]; pagination: PaginationMeta }> {
  const res = await apiClient.get<ApiSuccessBody<UserDTO[]>>('/admin/users', { params });
  return { items: res.data.data, pagination: res.data.meta!.pagination };
}

export async function createPrivilegedUser(input: {
  name: string;
  email: string;
  password: string;
  role: 'teacher' | 'admin';
  subjectSpecialization?: string[];
}): Promise<UserDTO> {
  const res = await apiClient.post<ApiSuccessBody<UserDTO>>('/admin/users', input);
  return res.data.data;
}

export async function deactivateUser(userId: string, reason: string): Promise<UserDTO> {
  const res = await apiClient.patch<ApiSuccessBody<UserDTO>>(
    `/admin/users/${userId}/deactivate`,
    { reason }
  );
  return res.data.data;
}

export async function reactivateUser(userId: string, reason: string): Promise<UserDTO> {
  const res = await apiClient.patch<ApiSuccessBody<UserDTO>>(
    `/admin/users/${userId}/reactivate`,
    { reason }
  );
  return res.data.data;
}

export async function resolveIdentity(
  anonymousId: string,
  reason: string
): Promise<ResolvedIdentityDTO> {
  const res = await apiClient.post<ApiSuccessBody<ResolvedIdentityDTO>>(
    '/admin/identity/resolve',
    { anonymousId, reason }
  );
  return res.data.data;
}

export async function listAuditLogs(
  page = 1,
  limit = 20
): Promise<{ items: AuditLogDTO[]; pagination: PaginationMeta }> {
  const res = await apiClient.get<ApiSuccessBody<AuditLogDTO[]>>('/admin/audit-logs', {
    params: { page, limit },
  });
  return { items: res.data.data, pagination: res.data.meta!.pagination };
}

export async function getPlatformSettings(): Promise<PlatformSettingsDTO> {
  const res = await apiClient.get<ApiSuccessBody<PlatformSettingsDTO>>('/admin/settings');
  return res.data.data;
}

export async function updatePlatformSettings(
  updates: Partial<PlatformSettingsDTO>
): Promise<PlatformSettingsDTO> {
  const res = await apiClient.patch<ApiSuccessBody<PlatformSettingsDTO>>(
    '/admin/settings',
    updates
  );
  return res.data.data;
}
