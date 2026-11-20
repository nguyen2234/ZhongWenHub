import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import type { UserRole } from '../../../types/roles';

export interface AuthenticatedRouteGuardProps {
  requiredRole?: UserRole | UserRole[];
  children?: React.ReactNode;
}

/**
 * Route guard that requires an active, authenticated user session.
 * 
 * - Shows a minimalist neutral loading state while session restoration is pending.
 * - Redirects unauthenticated guests to /login with original location preserved in state.from.
 * - Optionally enforces RBAC role requirements if specified.
 */
export const AuthenticatedRouteGuard: React.FC<AuthenticatedRouteGuardProps> = ({
  requiredRole,
  children,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthContext();

  // 1. Session restoration / token verification in flight
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--background, #f8fafc)',
          color: 'var(--text-secondary, #64748b)',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        <span>Đang kiểm tra phiên đăng nhập...</span>
      </div>
    );
  }

  // 2. Unauthenticated: Redirect to login preserving target deep link (prevent redirect loop if on /login)
  if (!isAuthenticated || !user) {
    if (location.pathname === '/login') {
      return null;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Optional RBAC role requirement check
  if (requiredRole) {
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRoles = new Set<string>();
    if (user.role) userRoles.add(user.role);
    if (Array.isArray(user.roles)) {
      user.roles.forEach((r) => userRoles.add(r));
    }

    const hasPermission = userRoles.has('ADMIN') || allowedRoles.some((r) => userRoles.has(r));
    if (!hasPermission) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '24px',
            textAlign: 'center',
            color: 'var(--text-primary, #0f172a)',
          }}
        >
          <h2 style={{ fontSize: '18px', fontWeight: 600, marginBottom: '8px' }}>
            Không có quyền truy cập
          </h2>
          <p style={{ color: 'var(--text-secondary, #64748b)', fontSize: '14px' }}>
            Tài khoản của bạn không được phân quyền để truy cập chức năng này.
          </p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default AuthenticatedRouteGuard;
