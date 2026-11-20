import { useNavigate, useLocation } from 'react-router-dom';
import { AuthLayout } from '../components/AuthLayout';
import { LoginForm } from '../components/LoginForm';
import type { AuthUser } from '../types/auth.types';
import type { UserRole } from '../../../types/roles';
import { ROLE_DEFAULT_PATHS } from '../../../types/roles';

export interface LoginPageProps {
  onSuccessLogin?: (user: AuthUser) => void;
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard' | 'onboarding') => void;
}

/**
 * Safely resolves the redirect target URL after login:
 * - Preserves deep-link pathname, query params (?key=val), and hash (#id).
 * - Blocks open redirect vulnerabilities (external hosts, protocol tricks, //, /\).
 * - Prevents auth redirect loops (/login, /register, etc.).
 * - Strictly enforces role boundaries (e.g. Student cannot access /management/admin).
 */
export function getSafeRedirectTarget(fromLocation: unknown, role: UserRole): string {
  const defaultPath = ROLE_DEFAULT_PATHS[role] || '/dashboard';
  if (!fromLocation) return defaultPath;

  let pathname = '';
  let search = '';
  let hash = '';

  if (typeof fromLocation === 'string') {
    pathname = fromLocation;
  } else if (typeof fromLocation === 'object' && fromLocation !== null) {
    const loc = fromLocation as { pathname?: string; search?: string; hash?: string };
    pathname = loc.pathname || '';
    search = loc.search || '';
    hash = loc.hash || '';
  }

  // 1. Must be a valid relative path starting with single '/'
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//') || pathname.startsWith('/\\')) {
    return defaultPath;
  }

  // 2. Open redirect / protocol injection protection
  if (pathname.includes(':') || pathname.includes('\\')) {
    return defaultPath;
  }

  // 3. Avoid auth loop routes
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password', '/onboarding'];
  if (authRoutes.some((route) => pathname.startsWith(route))) {
    return defaultPath;
  }

  // 4. Role-based target validation
  if (role === 'STUDENT') {
    // Student can never access any management route
    if (pathname.startsWith('/management')) {
      return defaultPath;
    }
  } else if (role === 'TEACHER') {
    // Teacher cannot access admin, content-manager, or support consoles
    if (
      pathname.startsWith('/management/admin') ||
      pathname.startsWith('/management/content-manager') ||
      pathname.startsWith('/management/support')
    ) {
      return defaultPath;
    }
  } else if (role === 'SUPPORT') {
    // Support cannot access admin, teacher, or content-manager consoles
    if (
      pathname.startsWith('/management/admin') ||
      pathname.startsWith('/management/teacher') ||
      pathname.startsWith('/management/content-manager')
    ) {
      return defaultPath;
    }
  } else if (role === 'CONTENT_MANAGER') {
    // Content Manager cannot access admin, teacher, or support consoles
    if (
      pathname.startsWith('/management/admin') ||
      pathname.startsWith('/management/teacher') ||
      pathname.startsWith('/management/support')
    ) {
      return defaultPath;
    }
  }

  return `${pathname}${search}${hash}`;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccessLogin,
  onNavigate,
}) => {
  const routerNavigate = useNavigate();
  const location = useLocation();

  const handleSuccess = (user: AuthUser) => {
    if (onSuccessLogin) {
      onSuccessLogin(user);
    }
    const role = (user.role || user.roles?.[0] || 'STUDENT') as UserRole;
    const targetPath = getSafeRedirectTarget((location.state as any)?.from, role);

    if (onNavigate && !targetPath.startsWith('/management') && !targetPath.includes('?') && !targetPath.includes('#')) {
      onNavigate(targetPath === '/dashboard' ? 'dashboard' : (targetPath.replace(/^\//, '') as any));
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

