/**
 * Authentication Type Definitions for ZhongWenHub
 * Prepared for eventual Spring Boot REST API integration.
 */

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  agreeTerms?: boolean;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface AuthUser {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string;
  currentHskLevel: number;
  streakDays: number;
  xpPoints: number;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: AuthUser;
}

export interface PasswordRequirements {
  minLength: boolean;     // >= 8 chars
  hasUpperLower: boolean; // has both upper and lower case
  hasNumber: boolean;     // has at least 1 digit
  hasSpecial: boolean;    // has at least 1 special char
}

export type PasswordStrengthLevel = 'empty' | 'weak' | 'fair' | 'good' | 'strong';

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  level: PasswordStrengthLevel;
  label: string;
  requirements: PasswordRequirements;
}
