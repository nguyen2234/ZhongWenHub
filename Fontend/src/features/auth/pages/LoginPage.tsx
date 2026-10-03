import React from 'react';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { AuthUser } from '../types/auth.types';

export interface LoginPageProps {
  onSuccessLogin?: (user: AuthUser) => void;
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard' | 'onboarding') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccessLogin,
  onNavigate,
}) => {
  const handleSuccess = (user: AuthUser) => {
    if (onSuccessLogin) {
      onSuccessLogin(user);
    }
    if (onNavigate) {
      onNavigate('dashboard');
    }
  };

  return (
    <AuthLayout
      activeRoute="login"
      onNavigate={(r) => onNavigate && onNavigate(r)}
    >
      <LoginForm
        onSuccess={handleSuccess}
        onNavigateToRegister={() => onNavigate && onNavigate('register')}
        onNavigateToForgotPassword={() => onNavigate && onNavigate('forgot-password')}
      />
    </AuthLayout>
  );
};
