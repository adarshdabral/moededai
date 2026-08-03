import { apiClient } from './client';
import type { ApiSuccessBody, AuthResult, TokenPair } from '@/types/api';

export interface RegisterInput {
  name: string;
  email: string;
  password: string;
  gradeLevel: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  const res = await apiClient.post<ApiSuccessBody<AuthResult>>('/auth/register', input);
  return res.data.data;
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const res = await apiClient.post<ApiSuccessBody<AuthResult>>('/auth/login', input);
  return res.data.data;
}

export async function refresh(refreshToken: string): Promise<TokenPair> {
  const res = await apiClient.post<ApiSuccessBody<TokenPair>>('/auth/refresh', { refreshToken });
  return res.data.data;
}

export async function logout(refreshToken: string): Promise<void> {
  await apiClient.post('/auth/logout', { refreshToken });
}

export async function verifyEmail(token: string): Promise<void> {
  await apiClient.post('/auth/verify-email', { token });
}

export async function requestPasswordReset(email: string): Promise<void> {
  await apiClient.post('/auth/request-password-reset', { email });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, newPassword });
}
