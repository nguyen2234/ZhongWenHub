import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Users,
  BookOpenCheck,
  ShieldCheck,
  ChevronDown,
  Check,
  ArrowRight,
  Layers,
} from 'lucide-react';
import type { UserRole } from '../../../types/roles';
import { useAuthContext } from '../../../features/auth/context/AuthContext';
import { managementAuthService } from '../services/management-auth.service';
import { adminRolePermissionService } from '../../admin/roles/services/role-permission.service';

export type PortalType = 'STUDENT' | 'TEACHER' | 'CONTENT_MANAGER' | 'ADMIN';

export interface PortalDef {
  id: PortalType;
  name: string;
  shortName: string;
  description: string;
  path: string;
  icon: React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>;
  accentColor: string;
  bgColor: string;
  allowedRoles: UserRole[];
}

export const PORTAL_DEFINITIONS: PortalDef[] = [
  {
    id: 'STUDENT',
    name: 'Cổng Học Viên',
    shortName: 'Học viên',
    description: 'Học bài, luyện từ vựng HSK, làm bài tập & AI Tutor',
    path: '/dashboard',
    icon: GraduationCap,
    accentColor: '#2563eb',
    bgColor: '#eff6ff',
    allowedRoles: ['STUDENT', 'TEACHER', 'CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'TEACHER',
    name: 'Cổng Giáo Viên',
    shortName: 'Giáo viên',
    description: 'Quản lý lớp học, bài tập giao lớp & trợ lý AI',
    path: '/management/teacher/dashboard',
    icon: Users,
    accentColor: '#059669',
    bgColor: '#ecfdf5',
    allowedRoles: ['TEACHER', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'CONTENT_MANAGER',
    name: 'Cổng Quản Lý Học Liệu',
    shortName: 'Học liệu',
    description: 'Kho từ vựng HSK 3.0, giáo trình, bài tập & kiểm duyệt',
    path: '/management/content-manager/dashboard',
    icon: BookOpenCheck,
    accentColor: '#d97706',
    bgColor: '#fffbeb',
    allowedRoles: ['CONTENT_MANAGER', 'ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'ADMIN',
    name: 'Cổng Quản Trị Hệ Thống',
    shortName: 'Quản trị',
    description: 'Quản trị tài khoản, người dùng, phân quyền & vận hành',
    path: '/management/admin/dashboard',
    icon: ShieldCheck,
    accentColor: '#dc2626',
    bgColor: '#fef2f2',
    allowedRoles: ['ADMIN', 'SUPER_ADMIN'],
  },
];

export interface PortalSwitcherProps {
  variant?: 'header' | 'compact' | 'drawer';
  className?: string;
  onPortalChange?: (portal: PortalDef) => void;
}

export const PortalSwitcher: React.FC<PortalSwitcherProps> = ({
  variant = 'header',
  className = '',
  onPortalChange,
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Extract all authenticated user roles from AuthContext
  const userRoles = useMemo(() => {
    const set = new Set<string>();
    if (user?.role) set.add(user.role);
    if (Array.isArray(user?.roles)) {
      user.roles.forEach((r) => set.add(r));
    }
    return set;
  }, [user]);

  const isSuperOrAdmin = userRoles.has('ADMIN') || userRoles.has('SUPER_ADMIN');

  // Filter portals authorized for this user
  const permittedPortals = useMemo(() => {
    if (!isAuthenticated || !user) return [];
    return PORTAL_DEFINITIONS.filter((portal) => {
      if (portal.id === 'STUDENT') return true;
      if (isSuperOrAdmin) return true;
      return portal.allowedRoles.some((r) => userRoles.has(r));
    });
  }, [isAuthenticated, user, isSuperOrAdmin, userRoles]);

  // Detect current active portal based on pathname
  const currentPortal = useMemo<PortalDef>(() => {
    const path = location.pathname;
    if (path.startsWith('/management/teacher')) {
      return PORTAL_DEFINITIONS.find((p) => p.id === 'TEACHER')!;
    }
    if (path.startsWith('/management/content-manager')) {
      return PORTAL_DEFINITIONS.find((p) => p.id === 'CONTENT_MANAGER')!;
    }
    if (path.startsWith('/management/admin')) {
      return PORTAL_DEFINITIONS.find((p) => p.id === 'ADMIN')!;
    }
    return PORTAL_DEFINITIONS.find((p) => p.id === 'STUDENT')!;
  }, [location.pathname]);

  const CurrentIcon = currentPortal.icon;

  const handleSelectPortal = (target: PortalDef) => {
    setIsOpen(false);
    if (onPortalChange) {
      onPortalChange(target);
    }
    if (target.id === currentPortal.id) return;

    // Synchronize management session role safely for multi-role accounts without altering real JWT
    if (target.id !== 'STUDENT') {
      const currentSession = managementAuthService.getSession();
      const targetRole: UserRole = target.id;
      const perms = adminRolePermissionService.getRoleByCode(targetRole === 'ADMIN' ? 'ADMIN' : (targetRole as any))?.permissions || [];

      managementAuthService.setSession({
        id: currentSession?.id || user?.id || 'usr-default',
        name: currentSession?.name || user?.fullName || 'Người dùng',
        email: currentSession?.email || user?.email || '',
        role: targetRole,
        permissions: perms.length > 0 ? perms : (currentSession?.permissions || []),
        avatarUrl: user?.avatarUrl,
      });
    }

    navigate(target.path);
  };

  if (!isAuthenticated || permittedPortals.length === 0) {
    return null;
  }

  // Drawer variant (for mobile sidebars)
  if (variant === 'drawer') {
    return (
      <div className={`portal-switcher-drawer ${className}`} style={{ padding: '8px 0' }}>
        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', padding: '0 8px' }}>
          Chuyển cổng ({permittedPortals.length})
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {permittedPortals.map((p) => {
            const Icon = p.icon;
            const isActive = p.id === currentPortal.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSelectPortal(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: isActive ? `1px solid ${p.accentColor}` : '1px solid transparent',
                  backgroundColor: isActive ? p.bgColor : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    backgroundColor: isActive ? p.accentColor : 'var(--background)',
                    color: isActive ? '#ffffff' : p.accentColor,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Icon size={16} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? 700 : 500, color: 'var(--foreground)' }}>
                    {p.name}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.shortName}
                  </div>
                </div>
                {isActive && <Check size={14} style={{ color: p.accentColor, flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      className={`portal-switcher-root ${className}`}
      style={{ position: 'relative', display: 'inline-block' }}
    >
      {/* Trigger Pill Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-label={`Chuyển cổng. Hiện tại: ${currentPortal.name}`}
        title="Nhấp để chuyển đổi giữa các cổng hệ thống"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '7px',
          height: '34px',
          padding: '0 10px 0 8px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-strong)',
          backgroundColor: 'var(--surface)',
          color: 'var(--foreground)',
          cursor: 'pointer',
          fontSize: '12.5px',
          fontWeight: 600,
          transition: 'all 0.15s ease',
          boxShadow: isOpen ? '0 0 0 2px rgba(230, 0, 18, 0.15)' : 'none',
        }}
      >
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            backgroundColor: currentPortal.bgColor,
            color: currentPortal.accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <CurrentIcon size={13} />
        </div>
        <span style={{ whiteSpace: 'nowrap', maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {currentPortal.name}
        </span>
        {permittedPortals.length > 1 && (
          <ChevronDown
            size={13}
            style={{
              color: 'var(--muted)',
              transition: 'transform 0.18s ease',
              transform: isOpen ? 'rotate(180deg)' : 'none',
            }}
          />
        )}
      </button>

      {/* Popover Dropdown Menu */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '310px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-xl)',
            boxShadow: '0 16px 36px rgba(15, 23, 42, 0.16)',
            padding: '8px',
            zIndex: 100,
            animation: 'portalFadeIn 0.16s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '6px 8px 8px 8px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={13} style={{ color: 'var(--muted)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Chuyển đổi cổng ({permittedPortals.length})
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--primary)',
                backgroundColor: 'var(--primary-light)',
                padding: '1px 6px',
                borderRadius: '4px',
              }}
            >
              RBAC OK
            </span>
          </div>

          {/* List of Permitted Portals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {permittedPortals.map((p) => {
              const Icon = p.icon;
              const isActive = p.id === currentPortal.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleSelectPortal(p)}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    border: isActive ? `1px solid ${p.accentColor}` : '1px solid transparent',
                    backgroundColor: isActive ? p.bgColor : 'transparent',
                    cursor: 'pointer',
                    textAlign: 'left',
                    width: '100%',
                    transition: 'background-color 0.12s ease',
                  }}
                  className="portal-item-btn"
                >
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? p.accentColor : p.bgColor,
                      color: isActive ? '#ffffff' : p.accentColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    <Icon size={16} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '13px',
                          fontWeight: isActive ? 700 : 600,
                          color: 'var(--foreground)',
                        }}
                      >
                        {p.name}
                      </span>
                      {isActive && (
                        <span
                          style={{
                            fontSize: '9.5px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            backgroundColor: p.accentColor,
                            color: '#ffffff',
                          }}
                        >
                          Hiện tại
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '11px',
                        color: 'var(--muted)',
                        marginTop: '2px',
                        lineHeight: 1.35,
                      }}
                    >
                      {p.description}
                    </div>
                  </div>
                  {!isActive && (
                    <ArrowRight
                      size={13}
                      style={{ color: 'var(--muted)', marginTop: '8px', flexShrink: 0 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes portalFadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .portal-item-btn:hover:not(:disabled) {
          background-color: var(--surface-hover) !important;
        }
      `}</style>
    </div>
  );
};
