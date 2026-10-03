import React from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import type { AuthUser } from '../types/auth.types';

export interface RegisterPageProps {
  onSuccessRegister?: (user: AuthUser) => void;
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard' | 'onboarding') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccessRegister,
  onNavigate,
}) => {
  const handleSuccess = (user: AuthUser) => {
    if (onSuccessRegister) {
      onSuccessRegister(user);
    }
    if (onNavigate) {
      onNavigate('onboarding');
    }
  };

  return (
    <AuthLayout
      activeRoute="register"
      onNavigate={(r) => onNavigate && onNavigate(r)}
    >
      <RegisterForm
        onSuccess={handleSuccess}
        onNavigateToLogin={() => onNavigate && onNavigate('login')}
      />
    </AuthLayout>
  );
};
