import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
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
  showBrandHeader?: boolean;
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({
  onNavigate,
  className = '',
  isCollapsed = false,
  onToggleCollapse,
  showBrandHeader = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Manage collapsible state for the 4 navigation groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    overview: true,
    courses: true,
    skills: true,
    'practice-zone': true,
  });

  // Scroll only the sidebar's own scroll container when route changes if active item is outside view
  useEffect(() => {
    const syncActiveItemScroll = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const activeEl = container.querySelector<HTMLElement>('[aria-current="page"]');
      if (!activeEl) return;

      const containerRect = container.getBoundingClientRect();
      const itemRect = activeEl.getBoundingClientRect();
      if (containerRect.height <= 0 || itemRect.height <= 0) return;

      const padding = 8;
      if (itemRect.top < containerRect.top + padding) {
        const nextTop = Math.max(
          0,
          container.scrollTop - (containerRect.top - itemRect.top + padding)
        );
        if (typeof container.scrollTo === 'function') {
          container.scrollTo({ top: nextTop, behavior: 'auto' });
        } else {
          container.scrollTop = nextTop;
        }
      } else if (itemRect.bottom > containerRect.bottom - padding) {
        const nextTop = container.scrollTop + (itemRect.bottom - containerRect.bottom + padding);
        if (typeof container.scrollTo === 'function') {
          container.scrollTo({ top: nextTop, behavior: 'auto' });
        } else {
          container.scrollTop = nextTop;
        }
      }
    };

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      const rafId = window.requestAnimationFrame(syncActiveItemScroll);
      return () => window.cancelAnimationFrame(rafId);
    }
    syncActiveItemScroll();
    return undefined;
  }, [pathname, location.search, isCollapsed]);

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
        return pathname === prefix || pathname.startsWith(`${prefix}/`);
      });
    }
    // Handle query params comparison if any
    const cleanItemPath = item.path.split('?')[0];
    return pathname === cleanItemPath || (cleanItemPath !== '/' && pathname.startsWith(`${cleanItemPath}/`));
  };

  const handleItemClick = (item: StudentNavGroupItem) => {
    navigate(item.path);
    if (onNavigate) onNavigate();
  };

  return (
    <aside
      className={`student-sidebar-container ${className}`.trim()}
      style={{
        width: isCollapsed ? 'var(--student-sidebar-collapsed-width, 72px)' : 'var(--student-sidebar-width, 256px)',
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
      {/* Unified Brand Header & Collapse Toggle */}
      {(showBrandHeader || onToggleCollapse) && (
        <div
          className="student-sidebar-brand-header"
          style={{
            minHeight: 'var(--app-header-height, 64px)',
            padding: isCollapsed ? '10px 8px' : '0 12px 0 16px',
            display: 'flex',
            flexDirection: isCollapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: isCollapsed ? 'center' : 'space-between',
            gap: isCollapsed ? '8px' : '10px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {showBrandHeader ? (
            <button
              type="button"
              onClick={() => {
                navigate('/dashboard');
                if (onNavigate) onNavigate();
              }}
              title="Về Trang chủ ZhongWenHub"
              aria-label="Về Trang chủ ZhongWenHub"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                flex: isCollapsed ? '0 0 auto' : '1 1 auto',
                minWidth: 0,
                overflow: 'hidden',
                padding: 0,
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, var(--primary) 0%, #e11d48 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  fontFamily: 'var(--font-hanzi)',
                  fontWeight: 700,
                  fontSize: '18px',
                  boxShadow: '0 4px 10px -2px rgba(211, 47, 47, 0.25)',
                  flexShrink: 0,
                }}
              >
                华
              </div>
              {!isCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                  <span
                    style={{
                      fontSize: '15px',
                      fontWeight: 800,
                      color: 'var(--foreground)',
                      lineHeight: 1.15,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    ZhongWenHub
                  </span>
                  <span
                    style={{
                      fontSize: '11px',
                      color: '#64748b',
                      fontWeight: 500,
                      lineHeight: 1.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    Học tiếng Trung dễ dàng
                  </span>
                </div>
              )}
            </button>
          ) : (
            !isCollapsed && (
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
            )
          )}

          {onToggleCollapse && (
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
                flexShrink: 0,
              }}
              title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
            </button>
          )}
        </div>
      )}

      {/* Main Collapsible Groups List with Invisible Scrollbar */}
      <div
        ref={scrollContainerRef}
        className="student-sidebar-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overscrollBehaviorY: 'contain',
          scrollbarGutter: 'stable',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '12px 6px 16px' : '12px 12px 16px',
          display: 'flex',
          flexDirection: 'column',
          gap: isCollapsed ? '10px' : '14px',
        }}
      >
        {HANBEEGO_STUDENT_NAV_GROUPS.map((group) => {
          const isOpen = expandedGroups[group.id] ?? true;

          return (
            <div key={group.id} style={{ display: 'flex', flexDirection: 'column', gap: '3px', flexShrink: 0 }}>
              {/* Group Header (Expanded mode only) */}
              {!isCollapsed && (
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={isOpen}
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
    </aside>
  );
};

export default StudentSidebar;
