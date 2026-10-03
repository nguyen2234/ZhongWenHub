import { useMemo } from 'react';
import type { PasswordStrengthResult, PasswordStrengthLevel } from '../types/auth.types';

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score: 0,
      level: 'empty',
      label: 'Chưa nhập',
      requirements: {
        minLength: false,
        hasUpperLower: false,
        hasNumber: false,
        hasSpecial: false,
      },
    };
  }

  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasUpperLower = hasUpper && hasLower;
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  let score = 0;
  if (minLength) score++;
  if (hasUpperLower) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;

  let level: PasswordStrengthLevel = 'weak';
  let label = 'Yếu';

  switch (score) {
    case 1:
      level = 'weak';
      label = 'Yếu';
      break;
    case 2:
      level = 'fair';
      label = 'Trung bình';
      break;
    case 3:
      level = 'good';
      label = 'Tốt';
      break;
    case 4:
      level = 'strong';
      label = 'Rất mạnh';
      break;
    default:
      level = 'weak';
      label = 'Yếu';
      break;
  }

  return {
    score,
    level,
    label,
    requirements: {
      minLength,
      hasUpperLower,
      hasNumber,
      hasSpecial,
    },
  };
}

export function usePasswordStrength(password: string): PasswordStrengthResult {
  return useMemo(() => checkPasswordStrength(password), [password]);
}
