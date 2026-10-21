import React from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import type { UserRole } from '../../../types/roles';
import { ROLE_DEFAULT_PATHS } from '../../../types/roles';
import { managementAuthService } from '../services/management-auth.service';

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
  const session = managementAuthService.getSession();

  // Role validation (ADMIN always possesses supreme system oversight)
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const isRoleAllowed = session.role === 'ADMIN' || roles.includes(session.role);
    if (!isRoleAllowed) {
      const safePath = ROLE_DEFAULT_PATHS[session.role] || '/dashboard';
      return <Navigate to={safePath} replace />;
    }
  }

  // Permission validation
  if (requiredPermission) {
    if (!managementAuthService.hasPermission(requiredPermission)) {
      const safePath = ROLE_DEFAULT_PATHS[session.role] || '/dashboard';
      return <Navigate to={safePath} replace />;
    }
  }

  return <>{children}</>;
};

/**
 * Safe redirect for legacy admin content routes (/management/admin/hsk-repository, /curriculum, ...)
 * 1. Strictly blocks unauthorized sessions (e.g. STUDENT, SUPPORT) from escalating privilege via direct URLs.
 * 2. Redirects authorized managers/admins safely to the unified Content Manager workspace.
 */
export const AdminLegacyContentRedirect: React.FC<{ targetPath: string }> = ({ targetPath }) => {
  const session = managementAuthService.getSession();
  const location = useLocation();

  if (!managementAuthService.canManageContent()) {
    const safePath = ROLE_DEFAULT_PATHS[session.role] || '/dashboard';
    return <Navigate to={safePath} replace />;
  }

  // Preserve any query strings (e.g., ?hsk=2, ?grammarId=GM-01)
  const fullTarget = location.search ? `${targetPath}${location.search}` : targetPath;
  return <Navigate to={fullTarget} replace />;
};

/**
 * Safe redirect for legacy admin lesson editor route (/management/admin/curriculum/lessons/:lessonId/edit)
 */
export const AdminLegacyLessonEditorRedirect: React.FC = () => {
  const { lessonId = 'les-8' } = useParams<{ lessonId?: string }>();
  const session = managementAuthService.getSession();

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
