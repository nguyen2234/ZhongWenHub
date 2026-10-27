import type { UserRole } from '../roles';

export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING_VERIFICATION';

export interface UserDto {
  id: string;
  username: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  roles: UserRole[];
  status: UserStatus;
  createdAt: string; // ISO 8601 UTC
  updatedAt: string | null;
  lastLoginAt: string | null;
}

export interface LoginRequestDto {
  usernameOrEmail: string;
  passwordHash?: string; // Transmitted over TLS
  password?: string;
  rememberMe?: boolean;
}

export interface LoginResponseDto {
  accessToken: string;
  expiresIn: number; // seconds
  tokenType: 'Bearer';
  user: UserDto;
  refreshTokenExpiry?: string;
}

export interface UserClaimsDto {
  sub: string; // User ID
  name: string;
  email: string;
  roles: UserRole[];
  permissions: string[];
  iss: string;
  aud: string;
  exp: number;
}
