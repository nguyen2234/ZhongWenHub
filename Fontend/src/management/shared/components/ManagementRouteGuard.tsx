import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import type { UserRole } from '../../../types/roles';
// ROLE_DEFAULT_PATHS
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

  // Extract authoritative roles strictly from AuthContext JWT user
  const userRoles = new Set<string>();
  if (user?.role) userRoles.add(user.role);
  if (Array.isArray(user?.roles)) {
    user.roles.forEach((r) => userRoles.add(r));
  }
  const isSuperOrAdmin = userRoles.has('ADMIN');

  // Synchronize active management portal view in an effect (never during render)
  useEffect(() => {
    if (isLoading || !isAuthenticated || !user || !session) return;
    const path = location.pathname;
    let targetPortalRole: UserRole | undefined;
    if (path.startsWith('/management/teacher') && (userRoles.has('TEACHER') || isSuperOrAdmin)) {
      targetPortalRole = 'TEACHER';
    } else if (path.startsWith('/management/content-manager') && (userRoles.has('CONTENT_MANAGER') || isSuperOrAdmin)) {
      targetPortalRole = 'CONTENT_MANAGER';
    } else if (path.startsWith('/management/support') && (userRoles.has('SUPPORT') || isSuperOrAdmin)) {
      targetPortalRole = 'SUPPORT';
    } else if (path.startsWith('/management/admin') && isSuperOrAdmin) {
      targetPortalRole = 'ADMIN';
    }

    if (targetPortalRole && session.role !== targetPortalRole) {
      managementAuthService.setSession({
        ...session,
        role: targetPortalRole,
      });
    }
  }, [isLoading, isAuthenticated, user, session, location.pathname, isSuperOrAdmin]);

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

  // 3. Strict RBAC validation
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isRoleAllowed =
      isSuperOrAdmin ||
      roles.some((r) => userRoles.has(r));

    if (!isRoleAllowed) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  // 4. Permission validation
  if (requiredPermission) {
    if (!managementAuthService.hasPermission(requiredPermission)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Safe redirect for legacy admin content routes
 */
export const AdminLegacyContentRedirect: React.FC<{ targetPath: string }> = ({ targetPath }) => {
  const location = useLocation();
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles = new Set<string>();
  if (user.role) userRoles.add(user.role);
  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => userRoles.add(r));
  }
  const canManage =
    userRoles.has('ADMIN') ||
        userRoles.has('CONTENT_MANAGER') ||
    managementAuthService.canManageContent();

  if (!canManage) {
    return <Navigate to="/dashboard" replace />;
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
  const { user, isAuthenticated, isLoading } = useAuthContext();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRoles = new Set<string>();
  if (user.role) userRoles.add(user.role);
  if (Array.isArray(user.roles)) {
    user.roles.forEach((r) => userRoles.add(r));
  }
  const canManage =
    userRoles.has('ADMIN') ||
        userRoles.has('CONTENT_MANAGER') ||
    managementAuthService.canManageContent();

  if (!canManage) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Navigate
      to={`/management/content-manager/curriculum/lessons/${lessonId}/edit`}
      replace
    />
  );
};
