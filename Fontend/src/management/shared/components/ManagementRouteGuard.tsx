import React, { useState, useEffect } from 'react';
import { Navigate, useParams, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
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
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
            <ShieldAlert size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
            403 - Không có quyền truy cập
          </h2>
          <p style={{ color: '#64748b', maxWidth: '420px', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
            Tài khoản ({user.email}) với vai trò "{user.role || 'STUDENT'}" không có quyền truy cập vào phân hệ này.
          </p>
          <a
            href="/dashboard"
            className="ds-btn ds-btn-primary"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Quay lại Bảng điều khiển học tập
          </a>
        </div>
      );
    }
  }

  // 4. Permission validation
  if (requiredPermission) {
    if (!managementAuthService.hasPermission(requiredPermission)) {
      return (
        <div
          role="alert"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh',
            padding: '2rem',
            textAlign: 'center',
          }}
        >
          <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
            <ShieldAlert size={48} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem', color: '#1e293b' }}>
            403 - Quyền bị từ chối
          </h2>
          <p style={{ color: '#64748b', maxWidth: '420px', marginBottom: '1.5rem', fontSize: '0.925rem' }}>
            Tài khoản không sở hữu quyền cần thiết ({requiredPermission}) để thao tác trên tính năng này.
          </p>
          <a
            href="/dashboard"
            className="ds-btn ds-btn-primary"
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '0.5rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Quay lại Bảng điều khiển học tập
          </a>
        </div>
      );
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
    userRoles.has('ADMIN') || userRoles.has('CONTENT_MANAGER') ||
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
