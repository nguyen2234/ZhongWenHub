import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Flame,
  Search,
  Menu,
  X,
  Languages,
  ChevronDown,
  LogOut,
} from 'lucide-react';
import { HSKLevel, XPIndicator } from '../design-system';
import { StudentSidebar } from './components/StudentSidebar';
import { StudentSearchModal } from './components/StudentSearchModal';
import { StudentBottomNav } from './components/StudentBottomNav';
import { useLearningState } from '../features/learning';
import { ACCOUNT_MENU_ITEMS } from '../config/student-navigation.config';
import { useAuthContext } from '../features/auth/context/AuthContext';
import { PortalSwitcher, getActivePortalLabel } from '../management/shared/components/PortalSwitcher';

export const StudentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { currentHskLevel, streakDays, xpTotal } = useLearningState();
  const { user, isAuthenticated, logout } = useAuthContext();

  const isAdmin = Boolean(
    user && (user.role === 'ADMIN' || user.roles?.includes('ADMIN'))
  );
  const displayName = user?.fullName || user?.email || 'Học viên';
  const displayEmail = user?.email || '';
  const displayInitials = (displayName || 'U')
    .trim()
    .split(/\s+/)
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();
  const displayRoleLabel = isAdmin
    ? 'Quản trị viên'
    : (user?.role === 'TEACHER' ? 'Giáo viên' : `Học viên HSK ${user?.currentHskLevel || 1}`);

  const activeHskLevel = user?.currentHskLevel ?? currentHskLevel;
  const activeStreak = user?.streakDays ?? streakDays;
  const activeXp = user?.xpPoints ?? xpTotal;

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const [isPinyinActive, setIsPinyinActive] = useState(true);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const mainScrollRef = useRef<HTMLDivElement>(null);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('zwh_sidebar_collapsed') === 'true';
  });

  // Reset independent main content scroll position cleanly when switching student routes
  useEffect(() => {
    if (mainScrollRef.current) {
      mainScrollRef.current.scrollTop = 0;
    }
  }, [pathname]);

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

  useEffect(() => {
    if (!isMobileDrawerOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsMobileDrawerOpen(false);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [isMobileDrawerOpen]);

  const getPageTitle = () => {
    if (pathname.startsWith('/ai-tutor')) return 'Không gian AI Tutor Chuyên nghiệp';
    if (pathname.startsWith('/ai-live') || pathname.startsWith('/conversation')) return 'Hội thoại AI Live';
    if (pathname.startsWith('/ai-grading') || pathname.startsWith('/letter-writing')) return 'Viết thư & AI Chấm điểm';
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
    if (pathname.startsWith('/practice')) return 'Bài tập luyện tiếng Trung';
    if (pathname.startsWith('/design-system')) return 'Design System Showcase';
    return 'Dashboard Học tập';
  };

  const activeSidebarWidth = isSidebarCollapsed
    ? 'var(--student-sidebar-collapsed-width, 72px)'
    : 'var(--student-sidebar-width, 256px)';

  return (
    <div
      className="student-app-shell"
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto minmax(0, 1fr)',
        gridTemplateRows: 'var(--app-header-height, 64px) minmax(0, 1fr)',
        gridTemplateAreas: '"sidebar header" "sidebar main"',
        height: '100dvh',
        maxHeight: '100dvh',
        width: '100%',
        overflow: 'hidden',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* =====================================================================
          1. FIXED APP SHELL SIDEBAR (CSS Grid Left Column: Unified Logo + Scrollable Nav)
          ===================================================================== */}
      <aside
        className="desktop-sidebar-wrapper student-sidebar-wrapper"
        style={{
          gridArea: 'sidebar',
          width: activeSidebarWidth,
          height: '100%',
          minHeight: 0,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <StudentSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={toggleSidebarCollapse}
          showBrandHeader={true}
        />
      </aside>

      {/* Mobile Slide-in Drawer (< 1024px) */}
      {isMobileDrawerOpen && (
        <div
          className="mobile-sidebar-drawer-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 'var(--z-drawer)',
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            overscrollBehavior: 'none',
            touchAction: 'none',
          }}
          onClick={() => setIsMobileDrawerOpen(false)}
        >
          <div
            className="mobile-sidebar-drawer"
            style={{
              width: 'min(300px, 85vw)',
              height: '100dvh',
              maxHeight: '100dvh',
              backgroundColor: '#ffffff',
              boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Điều hướng học viên"
          >
            <div
              style={{
                padding: '14px 16px',
                borderBottom: '1.5px solid #f1f5f9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexShrink: 0,
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
                aria-label="Đóng thanh điều hướng"
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              <StudentSidebar
                isCollapsed={false}
                showBrandHeader={false}
                onNavigate={() => setIsMobileDrawerOpen(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          2. FIXED APP SHELL HEADER (CSS Grid Top Row: Search, Stats & Profile)
          ===================================================================== */}
      <header
        className="student-app-header"
        style={{
          gridArea: 'header',
          position: 'relative',
          zIndex: 20,
          display: 'flex',
          height: 'var(--app-header-height, 64px)',
          minWidth: 0,
          alignItems: 'center',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          width: '100%',
          boxSizing: 'border-box',
        }}
      >
          {/* Mobile-only Hamburger & Brand Logo (Hidden on Desktop >= 1024px) */}
          <div
            style={{
              display: 'none',
              height: '100%',
              alignItems: 'center',
              gap: '8px',
              padding: '0 8px 0 12px',
              flexShrink: 0,
              boxSizing: 'border-box',
            }}
            className="mobile-header-left header-brand-box"
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

            {/* Mobile Logo & Brand text */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', userSelect: 'none' }}
              onClick={() => navigate('/dashboard')}
              title="Về Trang chủ ZhongWenHub"
            >
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-hanzi)',
                  fontWeight: 700,
                  fontSize: '18px',
                  boxShadow: '0 2px 0 0 #B80010',
                  flexShrink: 0,
                }}
              >
                华
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }} className="header-brand-title">
                <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', letterSpacing: '-0.3px', lineHeight: 1.1 }}>
                  ZhongWen<span style={{ color: 'var(--primary)' }}>Hub</span>
                </span>
              </div>
            </div>
          </div>

          {/* Center / Search Input Trigger */}
          <div className="header-search-container" style={{ flex: 1, padding: '0 12px 0 16px', display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>

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

          {/* Conditional Header Content: Guest vs Authenticated */}
          {!isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="ds-btn ds-btn-ghost"
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#334155',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                  backgroundColor: '#ffffff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                onClick={() => navigate('/register')}
                className="ds-btn ds-btn-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '13px',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary, #E60012)',
                  color: '#ffffff',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Đăng ký
              </button>
            </div>
          ) : (
            <>
              <div className="header-hsk-badge">
                <HSKLevel level={((activeHskLevel >= 7 ? '7-9' : activeHskLevel) as 1 | 2 | 3 | 4 | 5 | 6 | '7-9')} />
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
                title={`Chuỗi ${activeStreak} ngày học liên tiếp`}
              >
                <Flame size={14} />
                <span className="header-streak-label">{activeStreak}N</span>
              </div>

              <div className="header-xp-pill">
                <XPIndicator amount={activeXp} variant="pill" />
              </div>

              {/* User Account Dropdown Trigger & Popover */}
              <div ref={accountMenuRef} style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setIsAccountMenuOpen((prev) => !prev)}
                  aria-expanded={isAccountMenuOpen}
                  aria-haspopup="true"
                  aria-label={`Tài khoản ${displayName} - ${getActivePortalLabel(pathname)}`}
                  data-testid="profile-menu-trigger"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '2px 8px 2px 2px',
                    borderRadius: '9999px',
                    border: isAccountMenuOpen ? '1.5px solid var(--primary)' : '1.5px solid #cbd5e1',
                    backgroundColor: isAccountMenuOpen ? '#eef2ff' : '#ffffff',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                  title="Tài khoản, Hồ sơ & Chuyển cổng"
                >
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '30px',
                        height: '30px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary, #E60012)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '11px',
                        fontWeight: 800,
                        flexShrink: 0,
                      }}
                    >
                      {displayInitials}
                    </div>
                  )}
                  <span
                    className="header-profile-name"
                    style={{
                      fontSize: '12px',
                      fontWeight: 700,
                      color: '#0f172a',
                      maxWidth: '120px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {displayName}
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      color: '#64748b',
                      transform: isAccountMenuOpen ? 'rotate(180deg)' : 'none',
                      transition: 'transform 0.15s ease',
                      flexShrink: 0,
                    }}
                  />
                </button>

                {/* Account Popover Menu */}
                {isAccountMenuOpen && (
                  <div
                    role="menu"
                    data-testid="profile-menu-dropdown"
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 8px)',
                      width: 'min(276px, calc(100vw - 24px))',
                      maxHeight: 'calc(100dvh - 80px)',
                      overflowY: 'auto',
                      backgroundColor: '#ffffff',
                      borderRadius: '14px',
                      border: '1px solid #e2e8f0',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                      zIndex: 70,
                      padding: '6px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px',
                    }}
                  >
                    {/* User Identity Header */}
                    <div style={{ padding: '10px 12px 8px 12px', borderBottom: '1px solid #f1f5f9', marginBottom: '4px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>{displayName}</div>
                      {displayEmail && (
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {displayEmail}
                        </div>
                      )}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: isAdmin ? '#fef2f2' : '#e0e7ff',
                            color: isAdmin ? '#dc2626' : '#4338ca',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          {displayRoleLabel}
                        </span>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: '#ecfdf5',
                            color: '#047857',
                            fontSize: '10px',
                            fontWeight: 700,
                          }}
                        >
                          {getActivePortalLabel(pathname)}
                        </span>
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

                    {/* RBAC Portal Switcher integrated inside Profile Menu */}
                    <PortalSwitcher
                      variant="menu"
                      onPortalChange={() => setIsAccountMenuOpen(false)}
                    />

                    <div style={{ height: '1px', backgroundColor: '#f1f5f9', margin: '4px 0' }} />

                    {/* Logout Action */}
                    <button
                      type="button"
                      onClick={async () => {
                        setIsAccountMenuOpen(false);
                        await logout();
                        navigate('/login');
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
                        color: '#e11d48',
                        fontSize: '12px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#fff1f2')}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <LogOut size={16} style={{ color: '#e11d48' }} />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </header>

      {/* =====================================================================
          3. SCROLLABLE MAIN CONTENT PANE (Only this region scrolls vertically)
          ===================================================================== */}
      <div
        ref={mainScrollRef}
        className="student-main-pane student-main-scroll"
        style={{
          gridArea: 'main',
          minWidth: 0,
          minHeight: 0,
          height: '100%',
          overflowY: 'auto',
          overflowX: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--background)',
          boxSizing: 'border-box',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <main className="student-main-viewport" style={{ flex: '1 0 auto', width: '100%', boxSizing: 'border-box' }}>
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

      {/* Mobile-First Fixed Bottom Navigation */}
      <StudentBottomNav />

      {/* Global Quick Search Command Palette */}
      <StudentSearchModal isOpen={isSearchModalOpen} onClose={() => setIsSearchModalOpen(false)} />

      {/* Responsive Breakpoint CSS */}
      <style>{`
        @media (max-width: 1023px) {
          .student-app-shell {
            grid-template-columns: minmax(0, 1fr) !important;
            grid-template-areas:
              "header"
              "main" !important;
          }
          .desktop-sidebar-wrapper {
            display: none !important;
          }
          .student-main-pane {
            width: 100% !important;
          }
          .mobile-header-left {
            display: flex !important;
          }
          .mobile-hamburger-btn {
            display: inline-flex !important;
          }
          .header-search-container {
            padding: 0 12px !important;
          }
          .header-admin-link {
            display: none !important;
          }
          .header-admin-text {
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
          .header-profile-name {
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
