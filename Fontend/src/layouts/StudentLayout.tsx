import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Flame,
  LayoutDashboard,
  Layers,
  BookOpen,
  GraduationCap,
  Languages,
  Dumbbell,
  ShieldCheck,
  ClipboardList,
  BrainCircuit,
  Sparkles,
  Menu,
  X,
  MoreHorizontal,
  ChevronDown,
} from 'lucide-react';
import { HSKLevel, XPIndicator } from '../design-system';

export const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUtilityMenuOpen, setIsUtilityMenuOpen] = useState(false);

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(tabPath);
  };

  const getPageTitle = () => {
    if (pathname.startsWith('/ai-tutor')) return 'Không gian AI Tutor Chuyên nghiệp';
    if (pathname.startsWith('/ai-learning')) return 'Không gian Trí tuệ Nhân tạo AI';
    if (pathname.startsWith('/homework')) return 'Bài tập & Bài kiểm tra';
    if (pathname.startsWith('/vocabulary')) return 'Kho từ vựng & Spaced Repetition';
    if (pathname.startsWith('/learning-path')) return 'Lộ trình HSK';
    if (pathname.startsWith('/practice')) return 'Trung tâm Luyện tập';
    if (pathname.startsWith('/design-system')) return 'Design System Showcase';
    return 'Dashboard Trải nghiệm học';
  };

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/homework', label: 'Bài tập', icon: ClipboardList },
    { path: '/practice', label: 'Luyện tập', icon: Dumbbell, badge: '12', badgeType: 'danger' as const },
    { path: '/vocabulary', label: 'Kho từ vựng', icon: Languages, badge: '18', badgeType: 'streak' as const },
    { path: '/learning-path', label: 'Lộ trình HSK', icon: BookOpen },
    { path: '/ai-tutor', label: 'AI Tutor', icon: Sparkles, badge: 'Live', badgeType: 'ai' as const },
    { path: '/ai-learning', label: 'AI Học tập', icon: BrainCircuit, badge: 'AI', badgeType: 'primary' as const },
  ];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: 'var(--background)' }}>
      {/* =====================================================================
          APP TOP NAVIGATION BAR (ZhongWenHub Chinese Learning Shell)
          ===================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'var(--surface)',
          borderBottom: '1px solid var(--border)',
          padding: '0 var(--space-4)',
        }}
      >
        <div
          style={{
            maxWidth: '1480px',
            margin: '0 auto',
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          {/* Left: Brand Logo & Desktop Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)', flex: 1, minWidth: 0 }}>
            {/* Brand Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              onClick={() => navigate('/dashboard')}
            >
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
                  fontSize: '19px',
                  boxShadow: '0 2px 10px rgba(67, 56, 202, 0.3)',
                }}
              >
                华
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
                </span>
                <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
                  Tự học Tiếng Trung HSK
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                flexWrap: 'nowrap',
                overflowX: 'auto',
              }}
              className="student-desktop-nav"
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isTabActive(item.path);
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => navigate(item.path)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: 'var(--radius-full)',
                      border: 'none',
                      backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                      color: active ? 'var(--primary)' : 'var(--muted)',
                      fontSize: 'var(--text-xs)',
                      fontWeight: active ? 700 : 600,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} />
                    <span>{item.label}</span>
                    {item.badge && (
                      <span
                        style={{
                          fontSize: '10px',
                          padding: '1px 5px',
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
                        }}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}

              {/* Utility Dropdown Trigger */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsUtilityMenuOpen((prev) => !prev)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    backgroundColor: isUtilityMenuOpen ? 'var(--surface-hover)' : 'transparent',
                    color: 'var(--muted)',
                    fontSize: 'var(--text-xs)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  title="Tiện ích & Lối tắt khác"
                >
                  <MoreHorizontal size={14} />
                  <span>Thêm</span>
                  <ChevronDown size={12} />
                </button>

                {isUtilityMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      backgroundColor: 'var(--surface)',
                      border: '1px solid var(--border-strong)',
                      borderRadius: 'var(--radius-lg)',
                      boxShadow: 'var(--elevation-popover)',
                      minWidth: '180px',
                      zIndex: 100,
                      padding: '4px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                    onMouseLeave={() => setIsUtilityMenuOpen(false)}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        navigate('/lesson');
                        setIsUtilityMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--primary)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <GraduationCap size={15} />
                      <span>Vào học Bài 8</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        navigate('/design-system');
                        setIsUtilityMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: 'var(--foreground)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      <Layers size={15} />
                      <span>Design System</span>
                    </button>

                    <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '2px 0' }} />

                    <Link
                      to="/management/admin/dashboard"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--muted)',
                        fontSize: 'var(--text-xs)',
                        fontWeight: 500,
                        textDecoration: 'none',
                      }}
                      onClick={() => setIsUtilityMenuOpen(false)}
                    >
                      <ShieldCheck size={15} />
                      <span>Cổng quản trị</span>
                    </Link>
                  </div>
                )}
              </div>
            </nav>
          </div>

          {/* Right Header Indicators & Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}>
            <HSKLevel level={2} />

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--streak-bg)',
                border: '1px solid var(--streak-border)',
                color: 'var(--streak)',
                fontSize: '11px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
              title="Chuỗi 8 ngày học liên tiếp"
            >
              <Flame size={13} />
              <span>8 Ngày</span>
            </div>

            <XPIndicator amount={2180} variant="pill" />

            {/* User Avatar */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--secondary)',
                border: '1px solid var(--border-strong)',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Minh Anh (Học viên HSK 2)"
              onClick={() => navigate('/login')}
            >
              MA
            </div>

            {/* Mobile Menu Hamburger Toggle */}
            <button
              type="button"
              className="student-mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'transparent',
                color: 'var(--foreground)',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
              aria-label="Mở menu điều hướng"
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Navigation Drawer */}
        {isMobileMenuOpen && (
          <div
            style={{
              padding: 'var(--space-3) var(--space-4)',
              backgroundColor: 'var(--surface)',
              borderBottom: '1px solid var(--border-strong)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
            className="student-mobile-drawer"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isTabActive(item.path);
              return (
                <button
                  key={item.path}
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: 'var(--radius-lg)',
                    border: 'none',
                    backgroundColor: active ? 'var(--primary-light)' : 'transparent',
                    color: active ? 'var(--primary)' : 'var(--foreground)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Icon size={17} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      style={{
                        fontSize: '10px',
                        padding: '1px 6px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        fontWeight: 700,
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

            <button
              type="button"
              onClick={() => {
                navigate('/lesson');
                setIsMobileMenuOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                backgroundColor: 'transparent',
                color: 'var(--primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <GraduationCap size={17} />
              <span>Vào học Bài 8</span>
            </button>

            <Link
              to="/management/admin/dashboard"
              onClick={() => setIsMobileMenuOpen(false)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 14px',
                borderRadius: 'var(--radius-lg)',
                color: 'var(--muted)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                textDecoration: 'none',
              }}
            >
              <ShieldCheck size={17} />
              <span>Cổng quản trị</span>
            </Link>
          </div>
        )}
      </header>

      {/* =====================================================================
          MAIN CONTENT AREA (Spacious 1480px Container)
          ===================================================================== */}
      <main
        style={{
          maxWidth: '1480px',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4)',
          width: '100%',
          flex: 1,
          boxSizing: 'border-box',
        }}
      >
        <Outlet />
      </main>

      {/* =====================================================================
          FOOTER
          ===================================================================== */}
      <footer
        style={{
          borderTop: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: 'var(--space-5) var(--space-4)',
          marginTop: 'auto',
        }}
      >
        <div
          style={{
            maxWidth: '1480px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--text-xs)',
            color: 'var(--muted)',
            gap: 'var(--space-3)',
          }}
        >
          <div>
            © 2026 ZhongWenHub • Nền tảng tự học tiếng Trung theo lộ trình HSK dành cho người Việt
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
            <span>
              Đang xem:{' '}
              <strong>{getPageTitle()}</strong>
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isTabActive('/dashboard') ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Dashboard
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/homework')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isTabActive('/homework') ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Bài tập
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/practice')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isTabActive('/practice') ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Luyện tập
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/vocabulary')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isTabActive('/vocabulary') ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Kho từ vựng
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/learning-path')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isTabActive('/learning-path') ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Lộ trình HSK
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/ai-tutor')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isTabActive('/ai-tutor') ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                AI Tutor
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile media query CSS rule injection */}
      <style>{`
        @media (max-width: 1024px) {
          .student-desktop-nav {
            display: none !important;
          }
          .student-mobile-menu-btn {
            display: inline-flex !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentLayout;
