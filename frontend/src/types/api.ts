/** Mirrors the backend's standard response envelope - see backend CLAUDE.md §6. */
export interface ApiErrorDetail {
  field?: string;
  issue: string;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
    details?: ApiErrorDetail[];
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
}

export interface ApiSuccessBody<T> {
  success: true;
  data: T;
  meta?: { pagination: PaginationMeta };
}

export type Role = 'student' | 'teacher' | 'admin';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  anonymousId: string;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: UserDTO;
  tokens: TokenPair;
}
