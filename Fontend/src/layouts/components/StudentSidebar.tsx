import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  GraduationCap,
  ClipboardList,
  Languages,
  Dumbbell,
  RotateCcw,
  Sparkles,
  Radio,
  BrainCircuit,
  Layers,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';

export interface StudentSidebarProps {
  onNavigate?: () => void;
  className?: string;
}

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeType?: 'primary' | 'streak' | 'danger' | 'ai';
}

interface NavGroup {
  groupTitle?: string;
  items: NavItem[];
}

export const StudentSidebar: React.FC<StudentSidebarProps> = ({ onNavigate, className = '' }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const isItemActive = (path: string) => {
    if (path === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(path);
  };

  const navGroups: NavGroup[] = [
    {
      items: [
        { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/learning-path', label: 'Lộ trình HSK 1–9', icon: BookOpen },
      ],
    },
    {
      groupTitle: 'Học tập',
      items: [
        { path: '/lesson', label: 'Khóa học (Bài 8)', icon: GraduationCap, badge: 'Đang học', badgeType: 'primary' },
        { path: '/homework', label: 'Bài tập về nhà', icon: ClipboardList },
        { path: '/practice', label: 'Luyện tập tổng hợp', icon: Dumbbell, badge: '12', badgeType: 'danger' },
        { path: '/srs-review', label: 'Ôn tập Flashcard SRS', icon: RotateCcw },
      ],
    },
    {
      groupTitle: 'Từ vựng & Ngữ pháp',
      items: [
        { path: '/vocabulary', label: 'Kho từ vựng HSK', icon: Languages, badge: '18', badgeType: 'streak' },
      ],
    },
    {
      groupTitle: 'Trợ lý AI Thông minh',
      items: [
        { path: '/ai-tutor?mode=chat', label: 'AI Tutor Trò chuyện', icon: Sparkles, badge: 'AI', badgeType: 'ai' },
        { path: '/ai-tutor?mode=live', label: 'Luyện nói AI Live (Kippy)', icon: Radio, badge: 'Live', badgeType: 'ai' },
        { path: '/ai-learning', label: 'Không gian Trí tuệ AI', icon: BrainCircuit },
      ],
    },
    {
      groupTitle: 'Tiện ích & Hệ thống',
      items: [
        { path: '/design-system', label: 'Design System', icon: Layers },
        { path: '/management/admin/dashboard', label: 'Cổng Quản trị', icon: ShieldCheck },
      ],
    },
  ];

  const handleItemClick = (path: string) => {
    navigate(path);
    if (onNavigate) onNavigate();
  };

  return (
    <aside
      className={`student-sidebar-container ${className}`.trim()}
      style={{
        width: '256px',
        height: '100%',
        backgroundColor: '#ffffff',
        borderRight: '1.5px solid #f1f5f9',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        boxSizing: 'border-box',
      }}
    >
      {/* Scrollable Navigation Area */}
      <nav
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '14px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {navGroups.map((group, groupIdx) => (
          <div key={groupIdx} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {group.groupTitle && (
              <p
                style={{
                  margin: 0,
                  padding: '4px 12px 6px 12px',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: '#94a3b8',
                }}
              >
                {group.groupTitle}
              </p>
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isItemActive(item.path.split('?')[0]);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => handleItemClick(item.path)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                    color: active ? 'var(--primary)' : '#475569',
                    fontSize: 'var(--text-xs)',
                    fontWeight: active ? 700 : 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                    width: '100%',
                    textDecoration: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!active) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#475569';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                    <Icon
                      size={17}
                      style={{
                        color: active ? 'var(--primary)' : '#94a3b8',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.label}
                    </span>
                  </div>

                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        fontWeight: 700,
                        backgroundColor:
                          item.badgeType === 'danger'
                            ? 'rgba(239, 68, 68, 0.12)'
                            : item.badgeType === 'streak'
                            ? 'var(--streak-bg)'
                            : item.badgeType === 'ai'
                            ? 'var(--ai-bg)'
                            : 'rgba(67, 56, 202, 0.12)',
                        color:
                          item.badgeType === 'danger'
                            ? 'var(--danger)'
                            : item.badgeType === 'streak'
                            ? 'var(--streak)'
                            : item.badgeType === 'ai'
                            ? 'var(--ai)'
                            : 'var(--primary)',
                        flexShrink: 0,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom HanbeeGo-Inspired Promo Card */}
      <div style={{ padding: '12px' }}>
        <div
          style={{
            borderRadius: 'var(--radius-xl)',
            border: '2px solid #e0e7ff',
            background: 'linear-gradient(180deg, #eef2ff 0%, #ffffff 100%)',
            padding: '14px',
            textAlign: 'center',
          }}
        >
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
              margin: '0 auto 8px auto',
              boxShadow: '0 3px 0 0 #312e81',
            }}
          >
            <Sparkles size={20} />
          </div>
          <p style={{ margin: 0, fontSize: 'var(--text-xs)', fontWeight: 800, color: 'var(--foreground)' }}>
            Học tập không giới hạn
          </p>
          <p style={{ margin: '4px 0 10px 0', fontSize: '11px', color: 'var(--muted)', lineHeight: 1.4 }}>
            Luyện phản xạ nói trực tiếp với AI Tutor & mở khóa lộ trình HSK 1–9.
          </p>
          <button
            type="button"
            onClick={() => handleItemClick('/ai-tutor')}
            className="btn-3d-primary"
            style={{
              width: '100%',
              fontSize: '11px',
              padding: '8px 12px',
              borderRadius: 'var(--radius-md)',
            }}
          >
            <span>Khám phá AI Tutor</span>
            <ChevronRight size={13} />
          </button>
        </div>
      </div>
    </aside>
  );
};
