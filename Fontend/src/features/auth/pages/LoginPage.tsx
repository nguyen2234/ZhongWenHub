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

export interface LocationStateWithFrom {
  from?: {
    pathname?: string;
    search?: string;
    hash?: string;
  } | string;
}

export type UserRoleOrProfile = UserRole | AuthUser | (UserRole | string)[];

/**
 * Safely resolves the redirect target URL after login:
 * - Preserves deep-link pathname, query params (?key=val), and hash (#id).
 * - Blocks open redirect vulnerabilities (external hosts, protocol tricks, //, /\, backslashes, encoded exploits).
 * - Prevents auth redirect loops (/login, /register, etc.).
 * - Strictly enforces role boundaries with segment-aware path matching and multi-role user support.
 */
export function getSafeRedirectTarget(fromLocation: unknown, userOrRole: UserRoleOrProfile): string {
  // 1. Resolve authoritative roles
  const userRoles = new Set<string>();
  let primaryRole: UserRole = 'STUDENT';

  if (typeof userOrRole === 'string') {
    userRoles.add(userOrRole);
    primaryRole = userOrRole as UserRole;
  } else if (Array.isArray(userOrRole)) {
    userOrRole.forEach((r) => userRoles.add(r));
    primaryRole = (userOrRole[0] as UserRole) || 'STUDENT';
  } else if (typeof userOrRole === 'object' && userOrRole !== null) {
    const user = userOrRole as AuthUser;
    if (user.role) {
      userRoles.add(user.role);
      primaryRole = user.role as UserRole;
    }
    if (Array.isArray(user.roles)) {
      user.roles.forEach((r) => userRoles.add(r));
      if (!user.role && user.roles.length > 0) {
        primaryRole = user.roles[0] as UserRole;
      }
    }
  }

  const defaultPath = ROLE_DEFAULT_PATHS[primaryRole] || '/dashboard';
  if (!fromLocation) return defaultPath;

  let rawString = '';
  let search = '';
  let hash = '';

  if (typeof fromLocation === 'string') {
    rawString = fromLocation;
  } else if (typeof fromLocation === 'object' && fromLocation !== null) {
    const loc = fromLocation as { pathname?: string; search?: string; hash?: string };
    rawString = loc.pathname || '';
    search = loc.search || '';
    hash = loc.hash || '';
  }

  if (!rawString) return defaultPath;

  // Reject absolute URLs, scheme indicators, protocol-relative '//', or backslashes immediately
  if (
    rawString.includes('://') ||
    rawString.startsWith('//') ||
    rawString.startsWith('/\\') ||
    rawString.includes('\\')
  ) {
    return defaultPath;
  }

  // Check for encoded traversal (%2e%2e) or control characters in the raw input
  if (/%2e%2e/i.test(rawString) || rawString.includes('..') || /[\x00-\x1f\x7f]/.test(rawString)) {
    return defaultPath;
  }

  let pathname = '';
  try {
    const parsed = new URL(rawString, 'http://localhost');
    // Ensure origin was NOT overridden by an absolute or weird URL
    if (parsed.origin !== 'http://localhost') {
      return defaultPath;
    }
    pathname = parsed.pathname;
    if (!search && parsed.search) search = parsed.search;
    if (!hash && parsed.hash) hash = parsed.hash;
  } catch {
    return defaultPath;
  }

  // Must start with single slash and cannot start with //
  if (!pathname || !pathname.startsWith('/') || pathname.startsWith('//')) {
    return defaultPath;
  }

  // Decode URI component to check decoded tokens
  let decodedPath = pathname;
  try {
    decodedPath = decodeURIComponent(pathname);
  } catch {
    return defaultPath;
  }

  // Block directory traversal (..), protocol schemes (http:, javascript:), backslashes, or control characters
  if (
    decodedPath.includes('..') ||
    decodedPath.includes(':') ||
    decodedPath.includes('\\') ||
    /[\x00-\x1f\x7f]/.test(decodedPath)
  ) {
    return defaultPath;
  }

  // Split path into clean segment tokens for exact route matching
  const segments = decodedPath.split('/').filter(Boolean);
  if (segments.length === 0) {
    return defaultPath;
  }

  // 3. Avoid auth loop routes
  const authRoutes = ['login', 'register', 'forgot-password', 'reset-password', 'onboarding'];
  if (authRoutes.includes(segments[0])) {
    return defaultPath;
  }

  // 4. Role-based target validation using segment analysis and multi-role checking
  const isSuperOrAdmin = userRoles.has('ADMIN');

  if (segments[0] === 'management') {
    const portal = segments[1];
    if (!portal || portal === 'admin') {
      // Management root or Admin portal requires ADMIN role
      if (!isSuperOrAdmin) return defaultPath;
    } else if (portal === 'teacher') {
      // Teacher portal requires TEACHER or ADMIN
      if (!isSuperOrAdmin && !userRoles.has('TEACHER')) return defaultPath;
    } else if (portal === 'content-manager' || portal === 'videos') {
      // Content Manager portal requires CONTENT_MANAGER or ADMIN
      if (!isSuperOrAdmin && !userRoles.has('CONTENT_MANAGER')) return defaultPath;
    } else if (portal === 'support') {
      // Support portal requires SUPPORT or ADMIN
      if (!isSuperOrAdmin && !userRoles.has('SUPPORT')) return defaultPath;
    } else {
      // Any other unknown or nested management route requires ADMIN
      if (!isSuperOrAdmin) return defaultPath;
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
    const state = location.state as LocationStateWithFrom | null;
    const targetPath = getSafeRedirectTarget(state?.from, user);

    if (onNavigate && !targetPath.startsWith('/management') && !targetPath.includes('?') && !targetPath.includes('#')) {
      const cleanPath = targetPath === '/dashboard' ? 'dashboard' : targetPath.replace(/^\//, '');
      if (['login', 'register', 'forgot-password', 'dashboard', 'onboarding'].includes(cleanPath)) {
        onNavigate(cleanPath as 'login' | 'register' | 'forgot-password' | 'dashboard' | 'onboarding');
        return;
      }
    }
    routerNavigate(targetPath);
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

