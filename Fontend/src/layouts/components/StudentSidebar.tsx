import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import {
  HANBEEGO_STUDENT_NAV_GROUPS,
  type StudentNavGroupItem,
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

  // Manage collapsible state for the 4 HanbeeGo groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overview: true,
    courses: true,
    skills: true,
    personal: true,
  });

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const isItemActive = (item: StudentNavGroupItem): boolean => {
    if (item.path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    // Specific check for Learning Path modes (Beginner vs HSK)
    if (pathname === '/learning-path') {
      const isHskMode = location.search.includes('mode=hsk');
      if (item.id === 'beginner') return !isHskMode;
      if (item.id === 'curriculum') return isHskMode;
    }
    if (item.matchPrefixes && item.matchPrefixes.length > 0) {
      return item.matchPrefixes.some((prefix) => {
        if (prefix === '/dashboard' || prefix === '/') {
          return pathname === '/dashboard' || pathname === '/';
        }
        return pathname === prefix || pathname.startsWith(prefix);
      });
    }
    // Handle query params comparison if any
    const cleanItemPath = item.path.split('?')[0];
    return pathname === cleanItemPath || (cleanItemPath !== '/' && pathname.startsWith(cleanItemPath));
  };

  const handleItemClick = (item: StudentNavGroupItem) => {
    navigate(item.path);
    if (onNavigate) onNavigate();
  };

  return (
    <aside
      className={`student-sidebar-container ${className}`.trim()}
      style={{
        width: isCollapsed ? '72px' : '256px',
        height: '100%',
        minHeight: 0,
        backgroundColor: '#ffffff',
        borderRight: '1.5px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        userSelect: 'none',
      }}
      aria-label="Thanh điều hướng học tập"
    >
      {/* Sidebar Top Header & Collapse Toggle */}
      {onToggleCollapse && (
        <div
          style={{
            padding: isCollapsed ? '12px 0' : '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            borderBottom: '1px solid #f8fafc',
          }}
        >
          {!isCollapsed && (
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: '#94a3b8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
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
              width: '30px',
              height: '30px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: '#f8fafc',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          >
            {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>
      )}

      {/* Main Collapsible Groups List with Invisible Scrollbar */}
      <div
        className="student-sidebar-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '12px 6px' : '12px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: isCollapsed ? '12px' : '18px',
        }}
      >
        {HANBEEGO_STUDENT_NAV_GROUPS.map((group) => {
          const isOpen = expandedGroups[group.id] ?? true;

          return (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              {/* Group Header (Expanded mode only) */}
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 10px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    textAlign: 'left',
                    transition: 'color 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = '#475569')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = '#94a3b8')}
                >
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {group.groupTitle}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    {isOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                </button>
              )}

              {/* Separator Line in Collapsed Mode */}
              {isCollapsed && (
                <div
                  style={{
                    height: '1px',
                    backgroundColor: '#f1f5f9',
                    margin: '2px 8px 6px',
                  }}
                />
              )}

              {/* Group Items (render if open or if collapsed) */}
              {(isCollapsed || isOpen) && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {group.items.map((item) => {
                    const active = isItemActive(item);
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
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
                          border: active ? '1px solid #fed7da' : '1px solid transparent',
                          cursor: 'pointer',
                          textAlign: 'left',
                          transition: 'all 0.15s ease',
                          backgroundColor: active ? 'var(--primary-light, #FFF0F1)' : 'transparent',
                          color: active ? 'var(--primary, #E60012)' : '#475569',
                          fontWeight: active ? 700 : 500,
                          fontSize: '13px',
                        }}
                        title={isCollapsed ? `${item.label}${item.badge ? ` (${item.badge})` : ''}` : undefined}
                        aria-current={active ? 'page' : undefined}
                      >
                        {/* Active Red Indicator Bar on Left */}
                        {active && (
                          <div
                            style={{
                              position: 'absolute',
                              left: 0,
                              top: '16%',
                              bottom: '16%',
                              width: '3.5px',
                              borderRadius: '0 4px 4px 0',
                              backgroundColor: 'var(--primary, #E60012)',
                            }}
                          />
                        )}

                        {/* Item Icon */}
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '18px',
                            height: '18px',
                            color: active ? 'var(--primary, #E60012)' : '#64748b',
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={17} strokeWidth={active ? 2.3 : 1.8} />
                        </span>

                        {/* Label & Badges */}
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

                            {item.badge && (
                              <span
                                style={{
                                  fontSize: '10px',
                                  fontWeight: 700,
                                  padding: '2px 7px',
                                  borderRadius: '9999px',
                                  whiteSpace: 'nowrap',
                                  backgroundColor: active ? '#E60012' : '#FFF0F1',
                                  color: active ? '#ffffff' : '#E60012',
                                  letterSpacing: '0.02em',
                                }}
                              >
                                {item.badge}
                              </span>
                            )}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Kippy AI Live Quick Card (Viettel Red Theme) */}
      {!isCollapsed ? (
        <div
          style={{
            margin: '10px 12px 14px',
            padding: '12px 14px',
            borderRadius: '14px',
            backgroundColor: '#FFF0F1',
            border: '1px solid #fed7da',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: 'var(--primary, #E60012)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={14} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#172033' }}>Trợ lý Kippy AI</div>
              <div style={{ fontSize: '10px', color: '#E60012', fontWeight: 600 }}>Luyện giao tiếp 24/7</div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              navigate('/ai-live');
              if (onNavigate) onNavigate();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px',
              borderRadius: '7px',
              border: 'none',
              backgroundColor: 'var(--primary, #E60012)',
              color: '#ffffff',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            <span>Luyện phản xạ ngay</span>
            <ChevronRight size={13} />
          </button>
        </div>
      ) : (
        <div
          style={{
            padding: '10px 0',
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
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#FFF0F1',
              border: '1px solid #fed7da',
              color: 'var(--primary, #E60012)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            title="Luyện nói AI Live Kippy"
          >
            <Sparkles size={16} />
          </button>
        </div>
      )}
    </aside>
  );
};

export default StudentSidebar;
