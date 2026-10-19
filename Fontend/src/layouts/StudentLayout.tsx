import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Flame,
  Search,
  Menu,
  X,
  ShieldCheck,
  Languages,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
} from 'lucide-react';
import { HSKLevel, XPIndicator } from '../design-system';
import { StudentSidebar } from './components/StudentSidebar';
import { StudentSearchModal } from './components/StudentSearchModal';
import { StudentBottomNav } from './components/StudentBottomNav';
import { useLearningState } from '../features/learning';
import { ACCOUNT_MENU_ITEMS } from '../config/student-navigation.config';

export const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { currentHskLevel, streakDays, xpTotal } = useLearningState();

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPinyinActive, setIsPinyinActive] = useState(true);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('zwh_sidebar_collapsed') === 'true';
  });

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('zwh_sidebar_collapsed', String(next));
      return next;
    });
  };

  // Close account menu on click outside or escape key
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (accountMenuRef.current && !accountMenuRef.current.contains(e.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsAccountMenuOpen(false);
      }
    };
    if (isAccountMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountMenuOpen]);

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
    if (pathname.startsWith('/ai-live')) return 'Luyện giao tiếp AI Live';
    if (pathname.startsWith('/ai-grading')) return 'AI Chấm điểm & Sửa văn';
    if (pathname.startsWith('/ai-analytics')) return 'Phân tích Năng lực AI';
    if (pathname.startsWith('/homework')) return 'Bài tập & Bài kiểm tra';
    if (pathname.startsWith('/vocabulary')) return 'Kho từ vựng & Spaced Repetition';
    if (pathname.startsWith('/grammar')) return 'Ngữ pháp tiếng Trung HSK';
    if (pathname.startsWith('/skills')) return 'Luyện 4 Kỹ năng Nghe - Nói - Đọc - Viết';
    if (pathname.startsWith('/mock-exams')) return 'Thi thử HSK Chuẩn hóa';
    if (pathname.startsWith('/games')) return 'Trò chơi Học tiếng Trung';
    if (pathname.startsWith('/classes')) return 'Lớp học của tôi';
    if (pathname.startsWith('/learning-results')) return 'Kết quả & Đánh giá Học tập';
    if (pathname.startsWith('/progress')) return 'Tiến độ & Thống kê Học tập';
    if (pathname.startsWith('/leaderboard')) return 'Bảng xếp hạng Học viên';
    if (pathname.startsWith('/achievements')) return 'Thành tựu & Huy hiệu';
    if (pathname.startsWith('/profile')) return 'Hồ sơ Học viên';
    if (pathname.startsWith('/settings')) return 'Cài đặt Hệ thống';
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
        {/* Left section: Aligned with the Sidebar width (256px or 72px) */}
        <div
          style={{
            display: 'flex',
            height: '100%',
            alignItems: 'center',
            justifyContent: isSidebarCollapsed ? 'center' : 'space-between',
            gap: '10px',
            padding: isSidebarCollapsed ? '0 10px' : '0 16px',
            width: isSidebarCollapsed ? '72px' : '256px',
            borderRight: '1.5px solid #f1f5f9',
            flexShrink: 0,
            boxSizing: 'border-box',
            transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
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
            title="Về Trang chủ ZhongWenHub"
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
                boxShadow: '0 3px 0 0 #B80010',
                flexShrink: 0,
              }}
            >
              华
            </div>
            {!isSidebarCollapsed && (
              <div style={{ display: 'flex', flexDirection: 'column' }} className="header-brand-title">
                <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
                </span>
                <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748b' }}>
                  Học tiếng Trung dễ dàng
                </span>
              </div>
            )}
          </div>

          {/* Desktop Sidebar Toggle icon */}
          {!isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              aria-label="Thu gọn thanh điều hướng"
              className="desktop-sidebar-toggle-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: 'transparent',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: 0,
              }}
              title="Thu gọn sidebar"
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* Center / Search Input Trigger */}
        <div className="header-search-container" style={{ flex: 1, padding: '0 12px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {/* Quick Expand button when sidebar is collapsed (Desktop only) */}
          {isSidebarCollapsed && (
            <button
              type="button"
              onClick={toggleSidebarCollapse}
              aria-label="Mở rộng thanh điều hướng"
              className="desktop-sidebar-expand-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                backgroundColor: '#ffffff',
                color: '#64748b',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              title="Mở rộng sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          )}

          {/* Desktop/Tablet Full Search Bar */}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="header-search-full"
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
              Tìm kiếm...
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

          {/* Mobile Icon-only Search Button */}
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="header-search-compact"
            aria-label="Tìm kiếm nhanh tính năng"
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#f1f5f9',
              border: '1px solid #e2e8f0',
              color: '#64748b',
              cursor: 'pointer',
              flexShrink: 0,
            }}
            title="Tìm kiếm (⌘K)"
          >
            <Search size={16} style={{ color: '#64748b' }} />
          </button>
        </div>

        {/* Right Header: Pinyin Toggle, Indicators, User Profile */}
        <div
          className="header-right-actions"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingRight: '16px',
            flexShrink: 0,
          }}
        >
          {/* Pinyin Toggle Button */}
          <button
            type="button"
            onClick={() => setIsPinyinActive((p) => !p)}
            className="header-pinyin-btn"
            style={{
              height: '32px',
              padding: '0 8px',
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
              flexShrink: 0,
            }}
            title={isPinyinActive ? 'Đang bật Pinyin phiên âm' : 'Đang ẩn Pinyin'}
          >
            <Languages size={13} />
            <span>pīn</span>
          </button>

          <div className="header-hsk-badge">
            <HSKLevel level={(currentHskLevel >= 7 ? '7-9' : currentHskLevel) as 1 | 2 | 3 | 4 | 5 | 6 | '7-9'} />
          </div>

          {/* Streak Flame Pill */}
          <div
            className="header-streak-pill"
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
              flexShrink: 0,
            }}
            title={`Chuỗi ${streakDays} ngày học liên tiếp`}
          >
            <Flame size={14} />
            <span className="header-streak-label">{streakDays}N</span>
          </div>

          <div className="header-xp-pill">
            <XPIndicator amount={xpTotal} variant="pill" />
          </div>

          {/* User Account Dropdown Trigger & Popover */}
          <div ref={accountMenuRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              aria-expanded={isAccountMenuOpen}
              aria-haspopup="true"
              aria-label="Tài khoản học viên Minh Anh"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '2px 6px 2px 2px',
                borderRadius: '9999px',
                border: isAccountMenuOpen ? '1.5px solid var(--primary)' : '1.5px solid #cbd5e1',
                backgroundColor: isAccountMenuOpen ? '#eef2ff' : '#ffffff',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              title="Menu tài khoản (Hồ sơ, Cài đặt)"
            >
              <div
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  fontWeight: 800,
                }}
              >
                MA
              </div>
              <ChevronDown
                size={14}
                style={{
                  color: '#64748b',
                  transform: isAccountMenuOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            </button>

            {/* Account Popover Menu */}
            {isAccountMenuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: '240px',
                  backgroundColor: '#ffffff',
                  borderRadius: '14px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                  zIndex: 50,
                  padding: '6px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '2px',
                }}
              >
                {/* User Identity Header */}
                <div style={{ padding: '10px 12px 8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Minh Anh</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>student@zhongwenhub.edu.vn</div>
                  <div
                    style={{
                      display: 'inline-block',
                      marginTop: '6px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      backgroundColor: '#e0e7ff',
                      color: '#4338ca',
                      fontSize: '10px',
                      fontWeight: 700,
                    }}
                  >
                    Học viên HSK 2
                  </div>
                </div>

                {/* Primary Account Items: Profile, Settings, Classes */}
                {ACCOUNT_MENU_ITEMS.map((item) => {
                  const ItemIcon = item.icon;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        navigate(item.path);
                        setIsAccountMenuOpen(false);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: 'transparent',
                        color: '#334155',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'background-color 0.1s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <ItemIcon size={16} style={{ color: '#64748b' }} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}

                <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                {/* Management Portal Shortcut */}
                <button
                  type="button"
                  onClick={() => {
                    navigate('/management/admin/dashboard');
                    setIsAccountMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    width: '100%',
                    padding: '8px 10px',
                    borderRadius: '8px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: '#4338ca',
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#eef2ff')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <ShieldCheck size={16} style={{ color: '#4338ca' }} />
                  <span>Cổng Quản trị hệ thống</span>
                </button>
              </div>
            )}
          </div>

          {/* Quick Management Switch */}
          <Link
            to="/management/admin/dashboard"
            className="header-admin-link"
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
            <StudentSidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={toggleSidebarCollapse}
            />
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

              <div style={{ flex: 1, overflowY: 'auto' }} className="student-sidebar-scroll">
                <StudentSidebar
                  isCollapsed={false}
                  onNavigate={() => setIsMobileDrawerOpen(false)}
                />
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
          <main className="student-main-viewport" style={{ flex: 1, width: '100%', boxSizing: 'border-box' }}>
            <Outlet />
          </main>

          {/* Clean Responsive Footer */}
          <footer
            className="student-footer"
            style={{
              borderTop: '1px solid #e2e8f0',
              backgroundColor: '#ffffff',
              padding: '16px 20px',
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
                © 2026 ZhongWenHub • Nền tảng tự học tiếng Trung theo lộ trình HSK chuẩn quốc tế
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span className="footer-viewing-text">
                  Đang xem: <strong>{getPageTitle()}</strong>
                </span>
                <span>•</span>
                <Link to="/learning-path" style={{ color: '#64748b', textDecoration: 'none' }}>
                  Lộ trình HSK 1–9
                </Link>
                <span>•</span>
                <Link to="/ai-live" style={{ color: 'var(--primary)', fontWeight: 700, textDecoration: 'none' }}>
                  AI Tutor Live
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </div>

      {/* Mobile-First Fixed Bottom Navigation */}
      <StudentBottomNav />

      {/* Global Quick Search Command Palette */}
      <StudentSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />

      {/* Responsive Breakpoint CSS */}
      <style>{`
        @media (max-width: 1024px) {
          .desktop-sidebar-wrapper {
            display: none !important;
          }
          .mobile-hamburger-btn {
            display: none !important;
          }
          .header-brand-box {
            width: auto !important;
            border-right: none !important;
            padding: 0 8px 0 12px !important;
          }
          .header-admin-link {
            display: none !important;
          }
          .header-admin-text {
            display: none !important;
          }
          .desktop-sidebar-toggle-btn {
            display: none !important;
          }
          .desktop-sidebar-expand-btn {
            display: none !important;
          }
          .student-main-viewport {
            padding-bottom: 24px !important;
          }
          .student-footer {
            margin-bottom: calc(64px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }

        @media (max-width: 640px) {
          .header-search-full {
            display: none !important;
          }
          .header-search-compact {
            display: inline-flex !important;
          }
          .header-brand-title {
            display: none !important;
          }
          .header-pinyin-btn {
            display: none !important;
          }
          .header-hsk-badge {
            display: none !important;
          }
          .header-right-actions {
            gap: 6px !important;
            padding-right: 8px !important;
          }
          .footer-viewing-text {
            display: none !important;
          }
        }

        @media (max-width: 480px) {
          .header-xp-pill {
            display: none !important;
          }
        }

        @media (max-width: 360px) {
          .header-streak-label {
            display: none !important;
          }
          .header-streak-pill {
            padding: 4px 6px !important;
          }
        }
      `}</style>
    </div>
  );
};

export default StudentLayout;
