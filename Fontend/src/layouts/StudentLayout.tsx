import React from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Flame,
  LayoutDashboard,
  Layers,
  BookOpen,
  GraduationCap,
  Languages,
  Dumbbell,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { HSKLevel, XPIndicator } from '../design-system';

export const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/dashboard') {
      return pathname === '/dashboard' || pathname === '/';
    }
    return pathname.startsWith(tabPath);
  };

  const getPageTitle = () => {
    if (pathname.startsWith('/vocabulary')) return 'Kho từ vựng & Spaced Repetition';
    if (pathname.startsWith('/learning-path')) return 'Lộ trình HSK';
    if (pathname.startsWith('/practice')) return 'Trung tâm Luyện tập';
    if (pathname.startsWith('/design-system')) return 'Design System Showcase';
    return 'Dashboard Trải nghiệm học';
  };

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
            maxWidth: '1240px',
            margin: '0 auto',
            height: '62px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-4)',
          }}
        >
          {/* Logo & Navigation Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-6)' }}>
            {/* Brand Logo */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                cursor: 'pointer',
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

            {/* Navigation Tabs */}
            <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
              <button
                type="button"
                onClick={() => navigate('/practice')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: isTabActive('/practice') ? 'var(--primary-light)' : 'transparent',
                  color: isTabActive('/practice') ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Dumbbell size={16} />
                <span>Luyện tập</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'rgba(239, 68, 68, 0.12)',
                    color: 'var(--danger)',
                    fontWeight: 700,
                  }}
                  title="12 câu cần luyện lại"
                >
                  12
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/vocabulary')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: isTabActive('/vocabulary') ? 'var(--primary-light)' : 'transparent',
                  color: isTabActive('/vocabulary') ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Languages size={16} />
                <span>Kho từ vựng</span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '1px 6px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: 'var(--streak-bg)',
                    color: 'var(--streak)',
                    fontWeight: 700,
                  }}
                  title="18 từ cần ôn hôm nay"
                >
                  18
                </span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/learning-path')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: isTabActive('/learning-path') ? 'var(--primary-light)' : 'transparent',
                  color: isTabActive('/learning-path') ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <BookOpen size={16} />
                Lộ trình HSK
              </button>

              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: isTabActive('/dashboard') ? 'var(--primary-light)' : 'transparent',
                  color: isTabActive('/dashboard') ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </button>

              <button
                type="button"
                onClick={() => navigate('/lesson')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: 'var(--primary)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <GraduationCap size={16} />
                Vào học Bài 8
              </button>

              <button
                type="button"
                onClick={() => navigate('/design-system')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  padding: '6px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: 'none',
                  backgroundColor: isTabActive('/design-system') ? 'var(--primary-light)' : 'transparent',
                  color: isTabActive('/design-system') ? 'var(--primary)' : 'var(--muted)',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <Layers size={16} />
                Design System
              </button>
            </nav>
          </div>

          {/* Right Header Indicators */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
            <HSKLevel level={2} />

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--streak-bg)',
                border: '1px solid var(--streak-border)',
                color: 'var(--streak)',
                fontSize: 'var(--text-xs)',
                fontWeight: 700,
              }}
              title="Chuỗi 8 ngày học liên tiếp"
            >
              <Flame size={15} />
              <span>8 Ngày</span>
            </div>

            <XPIndicator amount={2180} variant="pill" />

            {/* User Avatar */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--secondary)',
                border: '1px solid var(--border-strong)',
                color: 'var(--foreground)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
              title="Minh Anh (Học viên HSK 2)"
              onClick={() => navigate('/login')}
            >
              MA
            </div>

            {/* Portal Switch Quick Link for Management */}
            <Link
              to="/management/admin/dashboard"
              className="ds-btn ds-btn-ghost"
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: 'var(--text-xs)',
                gap: '4px',
                color: 'var(--muted)',
              }}
              title="Cổng quản lý (Admin / Teacher / Support)"
            >
              <ShieldCheck size={14} />
              <span>Quản trị</span>
            </Link>

            {/* Quick Auth Trigger Button */}
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="ds-btn ds-btn-outline"
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: 'var(--text-xs)',
                fontWeight: 600,
                gap: '5px',
                borderRadius: 'var(--radius-full)',
              }}
              title="Đăng nhập / Đăng ký"
            >
              <LogIn size={13} />
              <span>Đăng nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN CONTENT AREA
          ===================================================================== */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: 'var(--space-6) var(--space-4)', width: '100%', flex: 1 }}>
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
        }}
      >
        <div
          style={{
            maxWidth: '1240px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
            <span>
              Đang xem:{' '}
              <strong>{getPageTitle()}</strong>
            </span>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
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
                  textDecoration: isTabActive('/vocabulary') ? 'underline' : 'none',
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
                  textDecoration: isTabActive('/learning-path') ? 'underline' : 'none',
                }}
              >
                Lộ trình HSK
              </button>
              <span>•</span>
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
                  textDecoration: isTabActive('/dashboard') ? 'underline' : 'none',
                }}
              >
                Dashboard
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/design-system')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: isTabActive('/design-system') ? 'var(--primary)' : 'var(--muted)',
                  fontWeight: 600,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                  textDecoration: isTabActive('/design-system') ? 'underline' : 'none',
                }}
              >
                Design System
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/login')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Đăng nhập
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => navigate('/register')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary)',
                  fontWeight: 700,
                  fontSize: 'var(--text-xs)',
                  cursor: 'pointer',
                }}
              >
                Đăng ký
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default StudentLayout;
