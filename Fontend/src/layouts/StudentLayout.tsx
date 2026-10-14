import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Flame,
  Search,
  Menu,
  X,
  ShieldCheck,
  Languages,
} from 'lucide-react';
import { HSKLevel, XPIndicator } from '../design-system';
import { StudentSidebar } from './components/StudentSidebar';
import { StudentSearchModal } from './components/StudentSearchModal';

export const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isPinyinActive, setIsPinyinActive] = useState(true);

  // Keyboard shortcut Cmd+K or Ctrl+K for search palette
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getPageTitle = () => {
    if (pathname.startsWith('/ai-tutor')) return 'Không gian AI Tutor Chuyên nghiệp';
    if (pathname.startsWith('/ai-learning')) return 'Không gian Trí tuệ Nhân tạo AI';
    if (pathname.startsWith('/homework')) return 'Bài tập & Bài kiểm tra';
    if (pathname.startsWith('/vocabulary')) return 'Kho từ vựng & Spaced Repetition';
    if (pathname.startsWith('/learning-path')) return 'Lộ trình HSK';
    if (pathname.startsWith('/practice')) return 'Trung tâm Luyện tập';
    if (pathname.startsWith('/design-system')) return 'Design System Showcase';
    return 'Dashboard Học tập';
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc' }}>
      {/* =====================================================================
          1. HANBEEGO-INSPIRED TOP HEADER
          ===================================================================== */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 40,
          display: 'flex',
          height: '64px',
          alignItems: 'center',
          borderBottom: '1.5px solid #e2e8f0',
          backgroundColor: '#ffffff',
          width: '100%',
        }}
      >
        {/* Left section: Aligning with the 256px Sidebar */}
        <div
          style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            gap: '10px',
            padding: '0 16px',
            width: '256px',
            borderRight: '1.5px solid #f1f5f9',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
          className="header-brand-box"
        >
          {/* Mobile Menu Hamburger button */}
          <button
            type="button"
            aria-label="Mở menu"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="mobile-hamburger-btn"
            style={{
              display: 'none',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              backgroundColor: 'transparent',
              color: '#334155',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <Menu size={20} />
          </button>

          {/* Logo & Brand text */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', userSelect: 'none' }}
            onClick={() => navigate('/dashboard')}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'var(--font-hanzi)',
                fontWeight: 700,
                fontSize: '20px',
                boxShadow: '0 3px 0 0 #312e81',
                flexShrink: 0,
              }}
            >
              华
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                Học tiếng Trung dễ dàng
              </span>
            </div>
          </div>
        </div>

        {/* Center / Search Input Trigger */}
        <div style={{ flex: 1, padding: '0 20px', display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              height: '38px',
              width: '100%',
              maxWidth: '320px',
              padding: '0 14px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
            }}
            title="Tìm kiếm tính năng (⌘K)"
          >
            <Search size={15} style={{ color: '#94a3b8', flexShrink: 0 }} />
            <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              Tìm kiếm tính năng...
            </span>
            <kbd
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '2px 6px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                border: '1px solid #cbd5e1',
                fontSize: '10px',
                fontWeight: 700,
                color: '#64748b',
              }}
            >
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Right Header: Pinyin Toggle, Indicators, User Profile */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            paddingRight: '20px',
            flexShrink: 0,
          }}
        >
          {/* Pinyin Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPinyinActive((p) => !p)}
            style={{
              height: '32px',
              padding: '0 10px',
              borderRadius: 'var(--radius-full)',
              border: isPinyinActive ? '1.5px solid var(--primary)' : '1px solid #e2e8f0',
              backgroundColor: isPinyinActive ? 'var(--primary-light)' : 'transparent',
              color: isPinyinActive ? 'var(--primary)' : '#64748b',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
            title={isPinyinActive ? 'Đang bật Pinyin phiên âm' : 'Đang ẩn Pinyin'}
          >
            <Languages size={13} />
            <span>pīn</span>
          </button>

          <HSKLevel level={2} />

          {/* Streak Flame Pill */}
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
              fontSize: '11px',
              fontWeight: 700,
              whiteSpace: 'nowrap',
            }}
            title="Chuỗi 8 ngày học liên tiếp"
          >
            <Flame size={14} />
            <span>8 Ngày</span>
          </div>

          <XPIndicator amount={2180} variant="pill" />

          {/* User Avatar */}
          <div
            style={{
              width: '34px',
              height: '34px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#e2e8f0',
              border: '1.5px solid #cbd5e1',
              color: '#0f172a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
            title="Minh Anh (Học viên HSK 2)"
            onClick={() => navigate('/login')}
          >
            MA
          </div>

          {/* Quick Management Switch */}
          <Link
            to="/management/admin/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              height: '32px',
              padding: '0 10px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              color: '#64748b',
              fontSize: '11px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
            title="Cổng Quản trị"
          >
            <ShieldCheck size={14} />
            <span className="header-admin-text">Quản trị</span>
          </Link>
        </div>
      </header>

      {/* =====================================================================
          2. HANBEEGO-STYLE TWO-PANE BODY (Sticky Sidebar + Main Content)
          ===================================================================== */}
      <div style={{ display: 'flex', flex: 1, minHeight: 'calc(100vh - 64px)' }}>
        {/* Persistent Desktop Sidebar */}
        <div className="desktop-sidebar-wrapper" style={{ display: 'block' }}>
          <div
            style={{
              position: 'sticky',
              top: '64px',
              height: 'calc(100vh - 64px)',
            }}
          >
            <StudentSidebar />
          </div>
        </div>

        {/* Mobile Slide-in Drawer */}
        {isMobileDrawerOpen && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              backgroundColor: 'rgba(15, 23, 42, 0.5)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
            }}
            onClick={() => setIsMobileDrawerOpen(false)}
          >
            <div
              style={{
                width: '280px',
                height: '100%',
                backgroundColor: '#ffffff',
                boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: '14px 16px',
                  borderBottom: '1.5px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--primary)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: 'var(--font-hanzi)',
                      fontWeight: 700,
                      fontSize: '16px',
                    }}
                  >
                    华
                  </div>
                  <span style={{ fontSize: 'var(--text-sm)', fontWeight: 800 }}>ZhongWenHub</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', padding: 0 }}
                >
                  <X size={20} />
                </button>
              </div>

              <div style={{ flex: 1, overflowY: 'auto' }}>
                <StudentSidebar onNavigate={() => setIsMobileDrawerOpen(false)} />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Viewport hosting Outlet and Footer */}
        <div
          style={{
            minWidth: 0,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f8fafc',
          }}
        >
          <main style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
            <Outlet />
          </main>

          {/* Simple Clean Footer */}
          <footer
            style={{
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              padding: '16px 24px',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: '#64748b',
                gap: '12px',
              }}
            >
              <div>
                © 2026 ZhongWenHub • Nền tảng tự học tiếng Trung theo lộ trình HSK dành cho người Việt
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>
                  Đang xem: <strong>{getPageTitle()}</strong>
                </span>
                <span>•</span>
                <Link to="/learning-path" style={{ color: '#64748b', textDecoration: 'none' }}>
                  Lộ trình HSK 1–9
                </Link>
                <span>•</span>
                <Link to="/ai-tutor" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                  AI Tutor Live
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Global Quick Search Command Palette */}
      <StudentSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />

      {/* Responsive Breakpoint CSS */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-sidebar-wrapper {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: inline-flex !important;
          }
          .header-brand-box {
            width: auto !important;
            border-right: none !important;
          }
          .header-admin-text {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentLayout;
