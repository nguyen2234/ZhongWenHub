import React, { useState, useMemo, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { ManagementSidebar, ManagementHeader } from '../management/shared/components';
import {
  ADMIN_NAV_GROUPS,
  TEACHER_NAV_GROUPS,
  SUPPORT_NAV_GROUPS,
} from '../management/shared/config/navigation.config';
import type { UserRole } from '../types';

export const ManagementLayout: React.FC = () => {
  const location = useLocation();

  // Determine current role based on URL route
  const currentRole: UserRole = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/teacher')) return 'TEACHER';
    if (path.includes('/support')) return 'SUPPORT';
    return 'ADMIN';
  }, [location.pathname]);

  // Sidebar expanded / collapsed state (persisted or auto-collapsed on tablet)
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 1024 && window.innerWidth < 1280;
    }
    return false;
  });

  // Mobile drawer open state (< 1024px)
  const [isMobileOpen, setIsMobileOpen] = useState(false);


  // Handle window resizing
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navGroups = useMemo(() => {
    switch (currentRole) {
      case 'TEACHER':
        return TEACHER_NAV_GROUPS;
      case 'SUPPORT':
        return SUPPORT_NAV_GROUPS;
      default:
        return ADMIN_NAV_GROUPS;
    }
  }, [currentRole]);

  return (
    <div
      className="management-layout-root"
      style={{
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        width: '100%',
        position: 'relative',
      }}
    >
      {/* Mobile Backdrop Overlay (< 1024px) */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(2px)',
            zIndex: 49,
            transition: 'opacity 0.2s ease',
          }}
        />
      )}

      {/* Shared Management Sidebar */}
      <ManagementSidebar
        currentRole={currentRole}
        groups={navGroups}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
        isMobileOpen={isMobileOpen}
        onMobileClose={() => setIsMobileOpen(false)}
      />

      {/* Main Management Workspace */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          minWidth: 0,
          backgroundColor: 'var(--background)',
        }}
      >
        {/* Top Minimal Header */}
        <ManagementHeader
          currentRole={currentRole}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed((prev) => !prev)}
          onMobileToggle={() => setIsMobileOpen((prev) => !prev)}
        />

        {/* Content Viewport with Breathing Room */}
        <main
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: 'clamp(20px, 3vw, 32px)',
            maxWidth: '1600px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default ManagementLayout;
