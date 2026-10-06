import { useNavigate } from 'react-router-dom';
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
  const routerNavigate = useNavigate();
  const handleNav = onNavigate ?? ((r) => routerNavigate(`/${r}`));

  const handleSuccess = (user: AuthUser) => {
    if (onSuccessRegister) {
      onSuccessRegister(user);
    }
    handleNav('onboarding');
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

