import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import type { UserRole } from '../../../types/roles';
import { ROLE_DEFAULT_PATHS } from '../../../types/roles';
import { managementAuthService } from '../services/management-auth.service';
import { useAuthContext } from '../../../features/auth/context/AuthContext';

export interface ManagementRouteGuardProps {
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string;
  children: React.ReactNode;
}

export const ManagementRouteGuard: React.FC<ManagementRouteGuardProps> = ({
  requiredRole,
  requiredPermission,
  children,
}) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthContext();
  const [session, setSession] = useState(() => managementAuthService.getSession());

  useEffect(() => {
    return managementAuthService.subscribe((updated) => setSession(updated));
  }, []);

  // 1. Wait until initial session restoration finishes
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          backgroundColor: 'var(--background, #f8fafc)',
          color: '#64748b',
          fontSize: '14px',
          fontWeight: 600,
        }}
      >
        <span>Đang kiểm tra quyền truy cập...</span>
      </div>
    );
  }

  // 2. Unauthenticated check: Redirect to Login
  if (!isAuthenticated || !user || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Role validation (SUPER_ADMIN and ADMIN have top-level access)
  const currentRole = session.role;
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isRoleAllowed =
      currentRole === 'SUPER_ADMIN' ||
      currentRole === 'ADMIN' ||
      roles.includes(currentRole);

    if (!isRoleAllowed) {
      const safePath = ROLE_DEFAULT_PATHS[currentRole] || '/dashboard';
      return <Navigate to={safePath} replace />;
    }
  }

  // 4. Permission validation
  if (requiredPermission) {
    if (!managementAuthService.hasPermission(requiredPermission)) {
      const safePath = ROLE_DEFAULT_PATHS[currentRole] || '/dashboard';
      return <Navigate to={safePath} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Safe redirect for legacy admin content routes
 */
export const AdminLegacyContentRedirect: React.FC<{ targetPath: string }> = ({ targetPath }) => {
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthContext();
  const session = managementAuthService.getSession();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!managementAuthService.canManageContent()) {
    const safePath = ROLE_DEFAULT_PATHS[session.role] || '/dashboard';
    return <Navigate to={safePath} replace />;
  }

  const fullTarget = location.search ? `${targetPath}${location.search}` : targetPath;
  return <Navigate to={fullTarget} replace />;
};

/**
 * Safe redirect for legacy admin lesson editor route
 */
export const AdminLegacyLessonEditorRedirect: React.FC = () => {
  const { lessonId = 'les-8' } = useParams<{ lessonId?: string }>();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuthContext();
  const session = managementAuthService.getSession();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!managementAuthService.canManageContent()) {
    const safePath = ROLE_DEFAULT_PATHS[session.role] || '/dashboard';
    return <Navigate to={safePath} replace />;
  }

  return (
    <Navigate
      to={`/management/content-manager/curriculum/lessons/${lessonId}/edit`}
      replace
    />
  );
};
