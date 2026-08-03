import { Role } from '@common/constants/roles';

export interface UserDTO {
  id: string;
  name: string;
  email: string;
  role: Role;
  anonymousId: string;
  isEmailVerified: boolean;
  isActive: boolean;
  avatarUrl?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  anonymousId: string;
}
