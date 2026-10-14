import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  ChevronRight,
  ChevronDown,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import {
  STUDENT_NAV_GROUPS,
  type StudentNavItem,
} from '../../config/student-navigation.config';

export interface StudentSidebarProps {
  onNavigate?: () => void;
  className?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  onNavigate,
  className = '',
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  // Manage open/closed state for items with children (e.g. skills)
  const [expandedSubmenus, setExpandedSubmenus] = useState<Record<string, boolean>>({
    skills: true, // Default open for easy discoverability
  });

  const toggleSubmenu = (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedSubmenus((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const isItemActive = (item: StudentNavItem): boolean => {
    if (item.path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (item.children && item.children.length > 0) {
      return item.children.some((child) => pathname.startsWith(child.path));
    }
    return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
  };

  const handleItemClick = (item: StudentNavItem) => {
    if (item.children && item.children.length > 0) {
      if (isCollapsed && onToggleCollapse) {
        onToggleCollapse();
      }
      setExpandedSubmenus((prev) => ({
        ...prev,
        [item.id]: !prev[item.id],
      }));
      // Navigate to first child
      navigate(item.children[0].path);
      if (onNavigate) onNavigate();
      return;
    }
    navigate(item.path);
    if (onNavigate) onNavigate();
  };

  return (
    <aside
      className={`student-sidebar-container ${className}`.trim()}
      style={{
        width: isCollapsed ? '72px' : '256px',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1.5px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
      }}
      aria-label="Thanh điều hướng chính"
    >
      {/* Sidebar Top Collapse Toggle Bar */}
      {onToggleCollapse && (
        <div
          style={{
            padding: isCollapsed ? '12px 0' : '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid #f8fafc',
          }}
        >
          {!isCollapsed && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Menu học tập
            </span>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={isCollapsed ? 'Mở rộng thanh điều hướng' : 'Thu gọn thanh điều hướng'}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
        </div>
      )}

      {/* Main Navigation Scroll Area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '12px 6px' : '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {STUDENT_NAV_GROUPS.map((group) => {
          return (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Group Heading (only in expanded mode) */}
              {!isCollapsed && (
                <div
                  style={{
                    padding: '6px 10px 4px 10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    color: '#94a3b8',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                  }}
                >
                  {group.groupTitle}
                </div>
              )}

              {/* In collapsed mode, render a subtle separator line */}
              {isCollapsed && (
                <div
                  style={{
                    height: '1px',
                    backgroundColor: '#f1f5f9',
                    margin: '4px 8px',
                  }}
                />
              )}

              {/* Group Items */}
              {group.items.map((item) => {
                const active = isItemActive(item);
                const Icon = item.icon;
                const hasChildren = Boolean(item.children && item.children.length > 0);
                const isSubmenuOpen = expandedSubmenus[item.id] ?? false;

                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column' }}>
                    <button
                      type="button"
                      onClick={() => handleItemClick(item)}
                      style={{
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isCollapsed ? 'center' : 'flex-start',
                        gap: isCollapsed ? 0 : '10px',
                        width: '100%',
                        padding: isCollapsed ? '10px 0' : '9px 12px',
                        borderRadius: '10px',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                        backgroundColor: active ? '#eef2ff' : 'transparent',
                        color: active ? '#4338ca' : '#475569',
                        fontWeight: active ? 700 : 500,
                        fontSize: '13px',
                      }}
                      title={isCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                      aria-current={active ? 'page' : undefined}
                    >
                      {/* Active Indicator Bar on the left */}
                      {active && (
                        <div
                          style={{
                            position: 'absolute',
                            left: 0,
                            top: '18%',
                            bottom: '18%',
                            width: '3.5px',
                            borderRadius: '0 4px 4px 0',
                            backgroundColor: '#4338ca',
                          }}
                        />
                      )}

                      {/* Icon */}
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '20px',
                          height: '20px',
                          color: active ? '#4338ca' : '#64748b',
                          flexShrink: 0,
                        }}
                      >
                        <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                      </span>

                      {/* Label & Badges in expanded mode */}
                      {!isCollapsed && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              letterSpacing: '-0.1px',
                            }}
                          >
                            {item.label}
                          </span>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                            {item.badge && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '9999px',
                                  whiteSpace: 'nowrap',
                                  backgroundColor:
                                    item.badgeType === 'danger'
                                      ? '#fee2e2'
                                      : item.badgeType === 'streak'
                                      ? '#ffedd5'
                                      : item.badgeType === 'ai'
                                      ? '#e0e7ff'
                                      : item.badgeType === 'success'
                                      ? '#dcfce7'
                                      : '#f1f5f9',
                                  color:
                                    item.badgeType === 'danger'
                                      ? '#dc2626'
                                      : item.badgeType === 'streak'
                                      ? '#ea580c'
                                      : item.badgeType === 'ai'
                                      ? '#4338ca'
                                      : item.badgeType === 'success'
                                      ? '#16a34a'
                                      : '#475569',
                                }}
                              >
                                {item.badge}
                              </span>
                            )}

                            {hasChildren && (
                              <button
                                type="button"
                                onClick={(e) => toggleSubmenu(item.id, e)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#94a3b8',
                                  cursor: 'pointer',
                                  padding: '2px',
                                }}
                                aria-label="Mở rộng danh mục con"
                              >
                                {isSubmenuOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </button>

                    {/* Submenu for items with children (Expanded mode only) */}
                    {!isCollapsed && hasChildren && isSubmenuOpen && item.children && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          marginLeft: '26px',
                          paddingLeft: '10px',
                          borderLeft: '1.5px solid #e2e8f0',
                          gap: '2px',
                          marginTop: '3px',
                          marginBottom: '3px',
                        }}
                      >
                        {item.children.map((child) => {
                          const childActive = pathname === child.path;
                          const ChildIcon = child.icon;

                          return (
                            <button
                              key={child.id}
                              type="button"
                              onClick={() => {
                                navigate(child.path);
                                if (onNavigate) onNavigate();
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '7px 10px',
                                borderRadius: '8px',
                                border: 'none',
                                background: childActive ? '#f1f5f9' : 'transparent',
                                color: childActive ? '#4338ca' : '#64748b',
                                fontWeight: childActive ? 700 : 500,
                                fontSize: '12px',
                                cursor: 'pointer',
                                textAlign: 'left',
                                transition: 'all 0.15s ease',
                              }}
                            >
                              <ChildIcon size={14} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {child.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Bottom AI Tutor Quick Card (HanbeeGo inspiration) */}
      {!isCollapsed ? (
        <div
          style={{
            margin: '12px',
            padding: '14px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #eef2ff 0%, #fae8ff 100%)',
            border: '1.5px solid #c7d2fe',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '28px',
                height: '28px',
                borderRadius: '8px',
                backgroundColor: '#4338ca',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={15} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e1b4b' }}>Trợ lý Kippy AI</div>
              <div style={{ fontSize: '10px', color: '#6366f1', fontWeight: 600 }}>Sẵn sàng luyện nói 24/7</div>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '11px', color: '#475569', lineHeight: 1.35 }}>
            Luyện giao tiếp phản xạ tiếng Trung với giọng phát âm chuẩn Bắc Kinh.
          </p>
          <button
            type="button"
            onClick={() => {
              navigate('/ai-live');
              if (onNavigate) onNavigate();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: '#4338ca',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(67, 56, 202, 0.25)',
            }}
          >
            <span>Trò chuyện ngay</span>
            <ChevronRight size={13} />
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '12px 0',
            display: 'flex',
            justifyContent: 'center',
            borderTop: '1px solid #f1f5f9',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={() => {
              navigate('/ai-live');
              if (onNavigate) onNavigate();
            }}
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#eef2ff',
              border: '1.5px solid #c7d2fe',
              color: '#4338ca',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Luyện nói AI Live Kippy"
          >
            <Sparkles size={18} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default StudentSidebar;
