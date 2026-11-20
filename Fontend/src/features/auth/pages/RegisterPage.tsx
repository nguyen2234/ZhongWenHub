import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { RegisterForm } from '../components/RegisterForm';
import type { AuthUser } from '../types/auth.types';
import type { UserRole } from '../../../types/roles';
import { ROLE_DEFAULT_PATHS } from '../../../types/roles';

export interface RegisterPageProps {
  onSuccessRegister?: (user: AuthUser) => void;
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard' | 'onboarding') => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({
  onSuccessRegister,
  onNavigate,
}) => {
  const routerNavigate = useNavigate();
  const handleNav = onNavigate ?? ((r) => routerNavigate(`/${r}`));

  const handleSuccess = (user: AuthUser) => {
    if (onSuccessRegister) {
      onSuccessRegister(user);
    }
    const role = (user.role || user.roles?.[0] || 'STUDENT') as UserRole;
    const targetPath = ROLE_DEFAULT_PATHS[role] || '/dashboard';
    if (onNavigate && !targetPath.startsWith('/management')) {
      onNavigate('dashboard');
    } else {
      routerNavigate(targetPath);
    }
  };

  return (
    <AuthLayout
      activeRoute="register"
      onNavigate={(r) => handleNav(r)}
    >
      <RegisterForm
        onSuccess={handleSuccess}
        onNavigateToLogin={() => handleNav('login')}
      />
    </AuthLayout>
  );
};

