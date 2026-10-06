import type { RouteObject } from 'react-router-dom';
import {
  LoginPage,
  RegisterPage,
  ForgotPasswordPage,
  OnboardingPage,
} from '../../features/auth';
import { AuthLayout } from '../../layouts/AuthLayout';

export const authRoutes: RouteObject[] = [
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/onboarding', element: <OnboardingPage /> },
    ],
  },
];
