import React, { useState, useMemo } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Search,
  ArrowLeft,
  X,
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

  // Filter navigation items by search query if user types in search
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
      case 'TEACHER':
        return 'Giáo viên';
      case 'SUPPORT':
        return 'Hỗ trợ CSKH';
      default:
        return 'Quản trị viên';
    }
  }, [currentRole]);

  return (
    <aside
      className={`management-sidebar ${isCollapsed ? 'collapsed' : 'expanded'} ${isMobileOpen ? 'mobile-open' : ''}`}
      style={{
        width: isCollapsed ? '72px' : '260px',
        backgroundColor: 'var(--surface)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'visible',
      }}
    >
      {/* =====================================================================
          1. STICKY TOP BRAND & ROLE HEADER
          ===================================================================== */}
      <div
        style={{
          height: '62px',
          borderBottom: '1px solid var(--border)',
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
            gap: 'var(--space-3)',
            textDecoration: 'none',
            overflow: 'hidden',
          }}
          title="ZhongWenHub Management Portal"
        >
          {/* Logo Badge */}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: 'var(--font-hanzi)',
              fontWeight: 700,
              fontSize: '18px',
              boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
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
                    fontSize: 'var(--text-sm)',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                    letterSpacing: '-0.2px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '1px 5px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--primary-light)',
                    color: 'var(--primary)',
                    letterSpacing: '0.3px',
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
                }}
              >
                {roleTitle}
              </span>
            </div>
          )}
        </Link>

        {/* Mobile Close Button (only visible on mobile drawer) */}
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
              padding: '6px',
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
          2. QUICK FILTER SEARCH INPUT (Expanded only)
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
              size={14}
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
              placeholder="Tìm nhanh mục..."
              aria-label="Tìm nhanh mục chức năng"
              style={{
                width: '100%',
                height: '32px',
                padding: '0 10px 0 30px',
                fontSize: '12px',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
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
                  fontSize: '12px',
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
          3. SCROLLABLE NAVIGATION BODY (Independent Scroll)
          ===================================================================== */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? 'var(--space-2) 0' : 'var(--space-2) var(--space-2)',
        }}
      >
        {filteredGroups.length === 0 ? (
          <div style={{ padding: 'var(--space-4)', textAlign: 'center', fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            Không tìm thấy mục nào
          </div>
        ) : (
          filteredGroups.map((group, groupIdx) => (
            <div
              key={group.id}
              style={{
                marginBottom: isCollapsed ? 'var(--space-2)' : 'var(--space-3)',
                paddingTop: groupIdx > 0 && isCollapsed ? 'var(--space-2)' : '0',
                borderTop: groupIdx > 0 && isCollapsed ? '1px solid var(--border)' : 'none',
              }}
            >
              {/* Group Title Header */}
              {!isCollapsed ? (
                <div
                  style={{
                    padding: '8px 12px 4px 12px',
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
              ) : null}

              {/* Group Nav Items */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
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
                          margin: isCollapsed ? '2px auto' : '0 4px',
                          width: isCollapsed ? '44px' : 'auto',
                          borderRadius: 'var(--radius-md)',
                          textDecoration: 'none',
                          fontSize: '13px',
                          fontWeight: isActive ? 600 : 500,
                          backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
                          color: isActive ? 'var(--primary)' : 'var(--foreground)',
                          position: 'relative',
                          transition: 'all 0.12s ease',
                        }}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                      >
                        {/* Subtle Active Indicator Bar on Left */}
                        {isActive && !isCollapsed && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: '8px',
                              bottom: '8px',
                              width: '3px',
                              backgroundColor: 'var(--primary)',
                              borderRadius: '0 2px 2px 0',
                            }}
                          />
                        )}

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
                              }}
                            >
                              {item.label}
                            </span>
                          )}
                        </div>

                        {/* Badge counter */}
                        {!isCollapsed && item.badge !== undefined && (
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '1px 6px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: isActive ? 'rgba(67, 56, 202, 0.14)' : 'rgba(239, 68, 68, 0.12)',
                              color: isActive ? 'var(--primary)' : 'var(--danger)',
                              lineHeight: 1.3,
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </NavLink>

                      {/* Floating Tooltip when Collapsed */}
                      {isCollapsed && hoveredItemId === item.id && (
                        <div
                          style={{
                            position: 'absolute',
                            left: '60px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            backgroundColor: '#0f172a',
                            color: '#ffffff',
                            padding: '5px 10px',
                            borderRadius: 'var(--radius-md)',
                            fontSize: '12px',
                            fontWeight: 500,
                            whiteSpace: 'nowrap',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                            zIndex: 100,
                            pointerEvents: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                          }}
                        >
                          <span>{item.label}</span>
                          {item.badge !== undefined && (
                            <span
                              style={{
                                backgroundColor: 'var(--danger)',
                                color: '#fff',
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
      </div>

      {/* =====================================================================
          4. STICKY BOTTOM ACTIONS & COLLAPSE TOGGLE
          ===================================================================== */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: isCollapsed ? 'var(--space-2) var(--space-1)' : 'var(--space-3) var(--space-3)',
          flexShrink: 0,
        }}
      >
        {/* Quick Role Switcher (Simulating multi-role navigation in development) */}
        {!isCollapsed ? (
          <div style={{ marginBottom: 'var(--space-2)' }}>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--muted)', fontWeight: 700, marginBottom: '6px' }}>
              Không gian làm việc:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
              {(['ADMIN', 'TEACHER', 'SUPPORT'] as UserRole[]).map((r) => (
                <Link
                  key={r}
                  to={`/management/${r.toLowerCase()}/dashboard`}
                  onClick={() => onRoleChange && onRoleChange(r)}
                  style={{
                    textAlign: 'center',
                    padding: '4px 0',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '10.5px',
                    fontWeight: currentRole === r ? 700 : 500,
                    backgroundColor: currentRole === r ? 'var(--primary-light)' : 'var(--background)',
                    color: currentRole === r ? 'var(--primary)' : 'var(--muted)',
                    textDecoration: 'none',
                    border: `1px solid ${currentRole === r ? 'var(--primary)' : 'var(--border)'}`,
                    transition: 'all 0.12s ease',
                  }}
                  title={`Chuyển tới ${r} Workspace`}
                >
                  {r === 'ADMIN' ? 'Admin' : r === 'TEACHER' ? 'Teacher' : 'Support'}
                </Link>
              ))}
            </div>
          </div>
        ) : null}

        {/* Back to Student Portal Link */}
        <Link
          to="/dashboard"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            gap: '8px',
            padding: isCollapsed ? '8px 0' : '7px 10px',
            borderRadius: 'var(--radius-md)',
            color: 'var(--muted)',
            textDecoration: 'none',
            fontSize: '12px',
            fontWeight: 500,
            border: '1px solid var(--border)',
            backgroundColor: 'var(--background)',
            marginBottom: '6px',
            transition: 'background-color 0.15s ease',
          }}
          title="Quay lại Cổng học viên (Student Hub)"
        >
          <ArrowLeft size={15} style={{ flexShrink: 0 }} />
          {!isCollapsed && <span>Về Cổng Học Viên</span>}
        </Link>

        {/* Desktop Collapse / Expand Toggle Button */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'}
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
          {!isCollapsed && <span>Thu gọn</span>}
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
            left: -280px;
            top: 0;
            bottom: 0;
            width: 260px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            transition: left 0.25s cubic-bezier(0.16, 1, 0.3, 1) !important;
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
