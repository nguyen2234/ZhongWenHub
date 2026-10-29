import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { AuthUser } from '../types/auth.types';
import type { UserRole } from '../../../types/roles';
import { ROLE_DEFAULT_PATHS } from '../../../types/roles';

export interface LoginPageProps {
  onSuccessLogin?: (user: AuthUser) => void;
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard' | 'onboarding') => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccessLogin,
  onNavigate,
}) => {
  const routerNavigate = useNavigate();

  const handleSuccess = (user: AuthUser) => {
    if (onSuccessLogin) {
      onSuccessLogin(user);
    }
    const role = (user.role || user.roles?.[0] || 'STUDENT') as UserRole;
    const targetPath = ROLE_DEFAULT_PATHS[role] || '/dashboard';
    if (onNavigate && !targetPath.startsWith('/management')) {
      onNavigate('dashboard');
    } else {
      routerNavigate(targetPath);
    }
  };

  const handleNav = onNavigate ?? ((r) => routerNavigate(`/${r}`));

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

