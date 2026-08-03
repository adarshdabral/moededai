import { apiClient } from './client';
import type { ApiSuccessBody, UserDTO } from '@/types/api';

export async function getMe(): Promise<UserDTO> {
  const res = await apiClient.get<ApiSuccessBody<UserDTO>>('/users/me');
  return res.data.data;
}

export async function updateMe(updates: { name?: string; avatarUrl?: string }): Promise<UserDTO> {
  const res = await apiClient.patch<ApiSuccessBody<UserDTO>>('/users/me', updates);
  return res.data.data;
}

export async function uploadAvatar(file: File): Promise<UserDTO> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiClient.post<ApiSuccessBody<UserDTO>>('/users/me/avatar', formData);
  return res.data.data;
}
