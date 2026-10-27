import React, { useState, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  X,
  ExternalLink,
} from 'lucide-react';
import type { ManagementNavGroup } from '../types';
import type { UserRole } from '../../../types';

export interface ManagementSidebarProps {
  currentRole: UserRole;
  groups: ManagementNavGroup[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onRoleChange?: (role: UserRole) => void;
}

export const ManagementSidebar: React.FC<ManagementSidebarProps> = ({
  currentRole,
  groups,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen = false,
  onMobileClose,
  onRoleChange,
}) => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredItemId, setHoveredItemId] = useState<string | null>(null);

  // Filter navigation items by quick search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => item.label.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [groups, searchQuery]);

  const roleTitle = useMemo(() => {
    switch (currentRole) {
      case 'CONTENT_MANAGER':
        return 'Quản lý học liệu & Kiểm duyệt';
      case 'TEACHER':
        return 'Giáo viên & Đào tạo';
      case 'SUPPORT':
        return 'Hỗ trợ CSKH';
      default:
        return 'Quản trị viên Hệ thống';
    }
  }, [currentRole]);

  return (
    <aside
      className={`management-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: isCollapsed ? 'var(--management-sidebar-collapsed-width)' : 'var(--management-sidebar-width)',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border-strong)',
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        maxHeight: '100dvh',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-sidebar)',
        transition: 'width 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        boxShadow: 'none',
      }}
    >
      {/* =====================================================================
          1. BRAND & CONSOLE HEADER
          ===================================================================== */}
      <div
        style={{
          height: '64px',
          borderBottom: '1px solid var(--border-strong)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'space-between',
          padding: isCollapsed ? '0' : '0 var(--space-4)',
          backgroundColor: 'var(--surface)',
          flexShrink: 0,
        }}
      >
        <Link
          to={`/management/${currentRole.toLowerCase()}/dashboard`}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
            overflow: 'hidden',
          }}
          title="ZhongWenHub Admin Console"
        >
          {/* Brand Seal Icon (Viettel Red #E60012) */}
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-hanzi)',
              fontWeight: 800,
              fontSize: '19px',
              boxShadow: '0 3px 10px rgba(230, 0, 18, 0.25)',
              flexShrink: 0,
            }}
          >
            华
          </div>

          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '14.5px',
                    fontWeight: 800,
                    color: 'var(--foreground)',
                    letterSpacing: '-0.3px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
                </span>
                <span
                  style={{
                    fontSize: '9.5px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    letterSpacing: '0.4px',
                    textTransform: 'uppercase',
                  }}
                >
                  {currentRole}
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontWeight: 500,
                }}
              >
                {roleTitle}
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button */}
        {isMobileOpen && onMobileClose && (
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Đóng thanh điều hướng"
            className="mobile-close-btn"
            style={{
              display: 'none',
              background: 'none',
              border: 'none',
              padding: '8px',
              color: 'var(--muted)',
              cursor: 'pointer',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* =====================================================================
          2. QUICK SEARCH FILTER (Expanded only)
          ===================================================================== */}
      {!isCollapsed && (
        <div style={{ padding: 'var(--space-3) var(--space-4) var(--space-1) var(--space-4)', flexShrink: 0 }}>
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Search
              size={13}
              style={{
                position: 'absolute',
                left: '10px',
                color: 'var(--muted)',
                pointerEvents: 'none',
              }}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm nhanh menu..."
              aria-label="Tìm nhanh mục chức năng"
              style={{
                width: '100%',
                height: '32px',
                padding: '0 24px 0 28px',
                fontSize: '12px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--foreground)',
                outline: 'none',
                transition: 'border-color 0.15s ease',
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  fontSize: '11px',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                  padding: '2px 4px',
                }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          3. NAVIGATION ITEMS WITH GROUP HEADERS
          ===================================================================== */}
      <nav
        className="management-sidebar-nav"
        aria-label="Admin Navigation"
        style={{
          flex: 1,
          minHeight: 0,
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? 'var(--space-2) 0 var(--space-4)' : 'var(--space-2) var(--space-3) var(--space-4)',
        }}
      >
        {filteredGroups.length === 0 ? (
          <div
            style={{
              padding: 'var(--space-4)',
              textAlign: 'center',
              fontSize: 'var(--text-xs)',
              color: 'var(--muted)',
            }}
          >
            Không tìm thấy mục nào
          </div>
        ) : (
          filteredGroups.map((group, groupIdx) => (
            <div
              key={group.id}
              style={{
                marginBottom: isCollapsed ? 'var(--space-3)' : 'var(--space-4)',
                paddingTop: groupIdx > 0 && isCollapsed ? 'var(--space-2)' : '0',
                borderTop: groupIdx > 0 && isCollapsed ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Group Title */}
              {!isCollapsed && (
                <div
                  style={{
                    padding: '6px 10px 4px 10px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    color: 'var(--muted)',
                    userSelect: 'none',
                  }}
                >
                  {group.title}
                </div>
              )}

              {/* Items List */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                {group.items.map((item) => {
                  const isActive =
                    item.path === `/management/${currentRole.toLowerCase()}/dashboard`
                      ? location.pathname === item.path
                      : location.pathname.startsWith(item.path);

                  return (
                    <div
                      key={item.id}
                      style={{ position: 'relative' }}
                      onMouseEnter={() => setHoveredItemId(item.id)}
                      onMouseLeave={() => setHoveredItemId(null)}
                    >
                      <NavLink
                        to={item.path}
                        onClick={onMobileClose}
                        title={isCollapsed ? item.label : undefined}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: isCollapsed ? 'center' : 'space-between',
                          gap: '10px',
                          height: '38px',
                          padding: isCollapsed ? '0' : '0 12px',
                          margin: isCollapsed ? '2px auto' : '0',
                          width: isCollapsed ? '44px' : '100%',
                          borderRadius: 'var(--radius-md)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          backgroundColor: isActive ? 'var(--secondary)' : 'transparent',
                          color: 'var(--foreground)',
                          position: 'relative',
                          transition: 'background-color 0.12s ease, color 0.12s ease',
                          minHeight: '38px',
                        }}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: isActive ? 'var(--primary)' : 'var(--muted)',
                              flexShrink: 0,
                            }}
                          >
                            {item.icon}
                          </span>
                          {!isCollapsed && (
                            <span
                              style={{
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                fontSize: '13px',
                              }}
                            >
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Badge Indicator */}
                        {!isCollapsed && item.badge !== undefined && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: typeof item.badge === 'number' ? '1px 6px' : '1px 5px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor:
                                typeof item.badge === 'number'
                                  ? 'rgba(230, 0, 18, 0.12)'
                                  : 'var(--primary-light)',
                              color: 'var(--primary)',
                              lineHeight: 1.3,
                              letterSpacing: '0.2px',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>

                      {/* Tooltip for Collapsed Mode */}
                      {isCollapsed && hoveredItemId === item.id && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '64px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            padding: '6px 12px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '12px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
                            zIndex: 100,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                          }}
                        >
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              style={{
                                backgroundColor: 'var(--primary)',
                                color: '#ffffff',
                                fontSize: '10px',
                                fontWeight: 700,
                                padding: '1px 5px',
                                borderRadius: 'var(--radius-full)',
                              }}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </nav>

      {/* =====================================================================
          4. FOOTER: WORKSPACE SWITCHER & COLLAPSE TOGGLE
          ===================================================================== */}
      <div
        style={{
          borderTop: '1px solid var(--border-strong)',
          backgroundColor: 'var(--surface)',
          padding: isCollapsed ? 'var(--space-2) var(--space-1)' : 'var(--space-3) var(--space-3)',
          flexShrink: 0,
        }}
      >
        {/* Workspace Quick Switcher */}
        {!isCollapsed && (
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <div
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                color: 'var(--muted)',
                fontWeight: 700,
                marginBottom: '6px',
                letterSpacing: '0.4px',
              }}
            >
              Không gian quản trị:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px' }}>
              {(['ADMIN', 'CONTENT_MANAGER', 'TEACHER', 'SUPPORT'] as UserRole[]).map((r) => (
                <Link
                  key={r}
                  to={r === 'CONTENT_MANAGER' ? '/management/content-manager/dashboard' : `/management/${r.toLowerCase()}/dashboard`}
                  onClick={() => {
                    if (onRoleChange) onRoleChange(r);
                    if (onMobileClose) onMobileClose();
                  }}
                  style={{
                    textAlign: 'center',
                    padding: '5px 0',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '11px',
                    fontWeight: currentRole === r ? 700 : 500,
                    backgroundColor: currentRole === r ? 'var(--primary-light)' : 'var(--background)',
                    color: currentRole === r ? 'var(--primary)' : 'var(--muted)',
                    textDecoration: 'none',
                    border: `1px solid ${currentRole === r ? 'rgba(230, 0, 18, 0.4)' : 'var(--border-strong)'}`,
                    transition: 'all 0.12s ease',
                  }}
                  title={`Chuyển tới ${r} Workspace`}
                >
                  {r === 'ADMIN' ? 'Admin' : r === 'CONTENT_MANAGER' ? 'Content' : r === 'TEACHER' ? 'Teacher' : 'Support'}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back to Student Portal */}
        <Link
          to="/dashboard"
          onClick={onMobileClose}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: '8px',
            padding: isCollapsed ? '8px 0' : '7px 10px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--foreground)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--background)',
            marginBottom: '6px',
            transition: 'background-color 0.15s ease',
          }}
          title="Quay lại Cổng Học Viên"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowLeft size={14} style={{ flexShrink: 0, color: 'var(--muted)' }} />
            {!isCollapsed && <span>Cổng Học Viên</span>}
          </div>
          {!isCollapsed && <ExternalLink size={12} style={{ color: 'var(--muted)' }} />}
        </Link>

        {/* Collapse / Expand Toggle */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            width: '100%',
            height: '32px',
            padding: isCollapsed ? '0' : '0 10px',
            background: 'none',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            color: 'var(--muted)',
            fontSize: '11.5px',
            cursor: 'pointer',
            transition: 'background-color 0.12s ease',
          }}
          className="collapse-toggle-btn"
        >
          {!isCollapsed && <span>Thu gọn sidebar</span>}
          {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      <style>{`
        .nav-item:hover:not(.active) {
          background-color: var(--surface-hover) !important;
          color: var(--foreground) !important;
        }
        .collapse-toggle-btn:hover {
          background-color: var(--surface-hover);
          color: var(--foreground) !important;
        }
        @media (max-width: 1023px) {
          .management-sidebar {
            position: fixed !important;
            left: -320px;
            top: 0;
            bottom: 0;
            height: 100dvh !important;
            max-height: 100dvh !important;
            width: min(300px, 85vw) !important;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            transition: left 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
            z-index: var(--z-drawer) !important;
          }
          .management-sidebar.mobile-open {
            left: 0 !important;
          }
          .mobile-close-btn {
            display: block !important;
          }
        }
      `}</style>
    </aside>
  );
};

export default ManagementSidebar;
