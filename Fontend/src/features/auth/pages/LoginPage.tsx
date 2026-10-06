import { useNavigate } from 'react-router-dom';
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
  const routerNavigate = useNavigate();
  const handleNav = onNavigate ?? ((r) => routerNavigate(`/${r}`));

  const handleSuccess = (user: AuthUser) => {
    if (onSuccessLogin) {
      onSuccessLogin(user);
    }
    handleNav('dashboard');
  };

  return (
    <AuthLayout
      activeRoute="login"
      onNavigate={(r) => handleNav(r)}
    >
      <LoginForm
        onSuccess={handleSuccess}
        onNavigateToRegister={() => handleNav('register')}
        onNavigateToForgotPassword={() => handleNav('forgot-password')}
      />
    </AuthLayout>
  );
};

