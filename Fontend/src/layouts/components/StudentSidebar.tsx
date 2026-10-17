import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
} from 'lucide-react';
import {
  STUDENT_MAIN_NAV_ITEMS,
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

  const isItemActive = (item: StudentNavItem): boolean => {
    if (item.path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    if (item.activeMatchPaths && item.activeMatchPaths.length > 0) {
      return item.activeMatchPaths.some((prefix) => {
        if (prefix === '/dashboard' || prefix === '/') {
          return pathname === '/dashboard' || pathname === '/';
        }
        return pathname === prefix || pathname.startsWith(prefix);
      });
    }
    return pathname === item.path || (item.path !== '/' && pathname.startsWith(item.path));
  };

  const handleItemClick = (item: StudentNavItem) => {
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
              Học tập
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

      {/* Main 6 Navigation Items */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: isCollapsed ? '14px 8px' : '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
        }}
      >
        {STUDENT_MAIN_NAV_ITEMS.map((item) => {
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
                gap: isCollapsed ? 0 : '12px',
                width: '100%',
                padding: isCollapsed ? '12px 0' : '10px 14px',
                borderRadius: '10px',
                border: active ? '1px solid #c7d2fe' : '1px solid transparent',
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
                    top: '20%',
                    bottom: '20%',
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
                <Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              </span>

              {/* Label & Badge in expanded mode */}
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
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom AI Tutor Quick Card (Compact, HanbeeGo inspiration) */}
      {!isCollapsed ? (
        <div
          style={{
            margin: '12px',
            padding: '12px 14px',
            borderRadius: '12px',
            backgroundColor: '#f8fafc',
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '8px',
                backgroundColor: '#e0e7ff',
                color: '#4338ca',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Sparkles size={14} />
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 700, color: '#1e1b4b' }}>Trợ lý AI Kippy</div>
              <div style={{ fontSize: '10px', color: '#64748b' }}>Luyện nói phản xạ 24/7</div>
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
              border: '1px solid #c7d2fe',
              backgroundColor: '#eef2ff',
              color: '#4338ca',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Luyện giao tiếp ngay</span>
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
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: '#eef2ff',
              border: '1px solid #c7d2fe',
              color: '#4338ca',
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
