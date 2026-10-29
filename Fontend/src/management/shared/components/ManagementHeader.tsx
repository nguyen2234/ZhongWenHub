import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  ChevronDown,
  User,
  Settings,
  LogOut,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Info,
  CheckCheck,
} from 'lucide-react';
import type { UserRole } from '../../../types';
import { authService } from '../../../features/auth/services/authService';

export interface ManagementHeaderProps {
  currentRole: UserRole;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onMobileToggle?: () => void;
  userName?: string;
  userEmail?: string;
}

export const ManagementHeader: React.FC<ManagementHeaderProps> = ({
  currentRole,
  isCollapsed = false,
  onToggleCollapse,
  onMobileToggle,
  userName = 'Minh Anh',
  userEmail = 'admin@zhongwenhub.edu.vn',
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifyRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (notifyRef.current && !notifyRef.current.contains(e.target as Node)) {
        setIsNotifyOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Compute breadcrumb hierarchy matching the reorganized sitemap
  const breadcrumb = useMemo(() => {
    const path = location.pathname;
    // Content Manager routes
    if (path.includes('/content-manager/dashboard')) return { group: 'Tổng quan', title: 'Dashboard Học liệu', link: '/management/content-manager/dashboard' };
    if (path.includes('/content-manager/hsk-repository')) return { group: 'Học liệu & Biên tập', title: 'Kho HSK', link: '/management/content-manager/hsk-repository' };
    if (path.includes('/content-manager/curriculum/lessons/') && path.includes('/edit')) return { group: 'Học liệu & Biên tập', title: 'Trình biên tập bài học', link: path };
    if (path.includes('/content-manager/lesson-editor')) return { group: 'Học liệu & Biên tập', title: 'Trình biên tập bài học', link: path };
    if (path.includes('/content-manager/curriculum')) return { group: 'Học liệu & Biên tập', title: 'Giáo trình & Bài học', link: '/management/content-manager/curriculum' };
    if (path.includes('/content-manager/grammar')) return { group: 'Học liệu & Biên tập', title: 'Ngữ pháp', link: '/management/content-manager/grammar' };
    if (path.includes('/content-manager/question-bank') || path.includes('/content-manager/exercises')) return { group: 'Học liệu & Biên tập', title: 'Ngân hàng câu hỏi', link: '/management/content-manager/question-bank' };
    if (path.includes('/content-manager/videos')) return { group: 'Học liệu & Biên tập', title: 'Học liệu video', link: '/management/content-manager/videos' };
    if (path.includes('/content-manager/moderation')) return { group: 'Kiểm duyệt & Vận hành', title: 'Kiểm duyệt & Xuất bản', link: '/management/content-manager/moderation' };
    if (path.includes('/content-manager/issues')) return { group: 'Kiểm duyệt & Vận hành', title: 'Báo cáo lỗi học liệu', link: '/management/content-manager/issues' };
    if (path.includes('/content-manager/audit-history')) return { group: 'Kiểm duyệt & Vận hành', title: 'Lịch sử phiên bản', link: '/management/content-manager/audit-history' };
    if (path.includes('/content-manager/quality-metrics')) return { group: 'Kiểm duyệt & Vận hành', title: 'Thống kê chất lượng', link: '/management/content-manager/quality-metrics' };

    // Group: Người dùng & Tổ chức (Admin)
    if (path.includes('/users')) return { group: 'Người dùng & Tổ chức', title: 'Học viên & Người dùng', link: '/management/admin/users' };
    if (path.includes('/teachers')) return { group: 'Người dùng & Tổ chức', title: 'Đội ngũ Giáo viên', link: '/management/admin/teachers' };
    if (path.includes('/support-staff')) return { group: 'Người dùng & Tổ chức', title: 'Nhân viên hỗ trợ', link: '/management/admin/support-staff' };
    if (path.includes('/roles')) return { group: 'Người dùng & Tổ chức', title: 'Vai trò & Phân quyền', link: '/management/admin/roles' };

    // Group: Trí tuệ nhân tạo (Admin)
    if (path.includes('/ai-management')) return { group: 'Trí tuệ nhân tạo', title: 'Trợ lý AI Tutor', link: '/management/admin/ai-management' };

    // Group: Vận hành & Hệ thống (Admin)
    if (path.includes('/analytics')) return { group: 'Vận hành & Hệ thống', title: 'Báo cáo tổng hợp', link: '/management/admin/analytics' };
    if (path.includes('/support-requests')) return { group: 'Vận hành & Hệ thống', title: 'Hỗ trợ vận hành', link: '/management/admin/support-requests' };
    if (path.includes('/settings')) return { group: 'Vận hành & Hệ thống', title: 'Cấu hình hệ thống', link: '/management/admin/settings' };

    // Teacher routes
    if (path.includes('/teacher/classes')) return { group: 'Giảng dạy', title: 'Lớp học của tôi', link: '/management/teacher/classes' };
    if (path.includes('/teacher/assignments')) return { group: 'Giảng dạy', title: 'Bài tập giao lớp', link: '/management/teacher/assignments' };
    if (path.includes('/teacher/ai-workspace')) return { group: 'Trợ lý AI', title: 'Không gian soạn bài AI', link: '/management/teacher/ai-workspace' };

    // Default: Dashboard
    return {
      group: 'Tổng quan',
      title: currentRole === 'CONTENT_MANAGER' ? 'Dashboard Học liệu' : 'Dashboard V2',
      link: currentRole === 'CONTENT_MANAGER' ? '/management/content-manager/dashboard' : `/management/${currentRole.toLowerCase()}/dashboard`,
    };
  }, [location.pathname, currentRole]);

  return (
    <header
      style={{
        height: 'var(--app-header-height)',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 'var(--z-header)',
        boxShadow: 'none',
      }}
    >
      {/* =====================================================================
          LEFT: SIDEBAR TOGGLE & BREADCRUMB HIERARCHY
          ===================================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        {/* Mobile Hamburger Trigger (< 1024px) */}
        <button
          type="button"
          onClick={onMobileToggle}
          aria-label="Mở menu quản trị"
          className="header-mobile-toggle"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            padding: '8px',
            color: 'var(--foreground)',
            cursor: 'pointer',
            borderRadius: 'var(--radius-md)',
          }}
        >
          <Menu size={20} />
        </button>

        {/* Desktop Collapse / Expand Icon Button (>= 1024px) */}
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
          className="header-desktop-toggle"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '32px',
            height: '32px',
            background: 'none',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* Structured Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: 'var(--text-xs)',
            minWidth: 0,
          }}
        >
          <span
            style={{
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
            className="breadcrumb-prefix"
          >
            Quản trị {currentRole}
          </span>
          <span style={{ color: 'var(--muted)', opacity: 0.5 }} className="breadcrumb-separator">
            /
          </span>
          <span
            style={{
              color: 'var(--muted)',
              whiteSpace: 'nowrap',
              fontWeight: 500,
            }}
            className="breadcrumb-group"
          >
            {breadcrumb.group}
          </span>
          <span style={{ color: 'var(--muted)', opacity: 0.5 }}>/</span>
          <span
            style={{
              fontWeight: 600,
              color: 'var(--foreground)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {breadcrumb.title}
          </span>
        </nav>
      </div>

      {/* =====================================================================
          RIGHT: ENVIRONMENT BADGE, SEARCH, NOTIFICATIONS, USER MENU
          ===================================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Environment / Demo Indicator Tag */}
        <div
          className="env-indicator-pill"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            border: '1px solid rgba(230, 0, 18, 0.2)',
            color: 'var(--primary)',
            fontSize: '11px',
            fontWeight: 600,
          }}
          title="Dữ liệu hiển thị ở chế độ mô phỏng vận hành"
        >
          <Info size={12} />
          <span>Mô phỏng Demo</span>
        </div>

        {/* Search Shortcut */}
        <div
          className="header-search-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--muted)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
          onClick={() => {
            const input = document.querySelector('input[placeholder*="Tìm nhanh"]') as HTMLInputElement;
            if (input) input.focus();
          }}
          title="Tìm nhanh trong console (Ctrl + K)"
        >
          <Search size={13} />
          <span>Tìm nhanh...</span>
          <kbd
            style={{
              padding: '1px 5px',
              fontSize: '10px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '4px',
              fontFamily: 'var(--font-mono)',
            }}
          >
            ⌘K
          </kbd>
        </div>

        {/* Notifications Popover */}
        <div style={{ position: 'relative' }} ref={notifyRef}>
          <button
            type="button"
            onClick={() => setIsNotifyOpen((prev) => !prev)}
            aria-label="Thông báo hệ thống (3 mới)"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'none',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--foreground)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            className="notify-btn"
          >
            <Bell size={16} />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '16px',
                height: '16px',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                borderRadius: '50%',
                fontSize: '9.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid var(--surface)',
              }}
            >
              3
            </span>
          </button>

          {isNotifyOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '320px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                padding: 'var(--space-3)',
                zIndex: 60,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                  paddingBottom: '8px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                    Thông báo hệ thống
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                    }}
                  >
                    3 mới
                  </span>
                </div>
                <button
                  type="button"
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: '11px',
                    color: 'var(--primary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: 0,
                  }}
                  onClick={() => setIsNotifyOpen(false)}
                >
                  <CheckCheck size={13} />
                  <span>Đã đọc hết</span>
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    14 Nội dung học liệu chờ kiểm duyệt
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    8 bài giảng số + 6 bài tập mới từ giáo viên • 12 phút trước
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    3 Vé hỗ trợ vượt thời hạn phản hồi SLA
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Yêu cầu nạp khóa học HSK 3 & lỗi âm thanh • 35 phút trước
                  </div>
                </div>

                <div
                  style={{
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-md)',
                    backgroundColor: 'var(--background)',
                    border: '1px solid var(--border)',
                  }}
                >
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>
                    Sao lưu cơ sở dữ liệu hoàn tất
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                    Bản sao lưu HSK Repository tự động • 2 giờ trước
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-label="Menu tài khoản quản trị"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px 4px 4px',
              background: 'none',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            className="user-profile-btn"
          >
            {/* Avatar Badge with Viettel Red */}
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              MA
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                lineHeight: 1.1,
              }}
              className="user-profile-info"
            >
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                {userName}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
                {currentRole}
              </span>
            </div>

            <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
          </button>

          {/* User Dropdown */}
          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '46px',
                width: '240px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-strong)',
                borderRadius: 'var(--radius-xl)',
                boxShadow: '0 12px 30px rgba(15, 23, 42, 0.12)',
                padding: 'var(--space-2)',
                zIndex: 60,
              }}
            >
              {/* Account Meta */}
              <div
                style={{
                  padding: '8px 10px',
                  borderBottom: '1px solid var(--border)',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>
                  {userName}
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {userEmail}
                </div>
                <div style={{ marginTop: '5px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                    }}
                  >
                    VAI TRÒ:{' '}
                    {currentRole === 'CONTENT_MANAGER'
                      ? 'QUẢN LÝ HỌC LIỆU'
                      : currentRole === 'TEACHER'
                        ? 'GIÁO VIÊN'
                        : currentRole === 'SUPPORT'
                          ? 'NHÂN VIÊN HỖ TRỢ'
                          : 'QUẢN TRỊ VIÊN'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  alert('Chức năng: Xem thông tin cá nhân quản trị');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
                className="dropdown-item"
              >
                <User size={14} style={{ color: 'var(--muted)' }} />
                <span>Hồ sơ cá nhân</span>
              </button>

              <Link
                to="/management/admin/settings"
                onClick={() => setIsUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--foreground)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                className="dropdown-item"
              >
                <Settings size={14} style={{ color: 'var(--muted)' }} />
                <span>Cài đặt hệ thống</span>
              </Link>

              <Link
                to="/dashboard"
                onClick={() => setIsUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
                className="dropdown-item"
              >
                <ArrowLeft size={14} style={{ color: 'var(--primary)' }} />
                <span>Về Cổng Học Viên</span>
              </Link>

              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

              <button
                type="button"
                onClick={async () => {
                  setIsUserMenuOpen(false);
                  await authService.logout();
                  navigate('/login');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '8px 10px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontWeight: 600,
                }}
                className="dropdown-item danger"
              >
                <LogOut size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .header-desktop-toggle:hover,
        .notify-btn:hover,
        .user-profile-btn:hover {
          background-color: var(--surface-hover);
        }
        .dropdown-item:hover {
          background-color: var(--surface-hover);
        }
        .dropdown-item.danger:hover {
          background-color: rgba(239, 68, 68, 0.08);
        }
        @media (max-width: 1023px) {
          .header-mobile-toggle {
            display: inline-flex !important;
          }
          .header-desktop-toggle {
            display: none !important;
          }
          .header-search-btn {
            display: none !important;
          }
          .breadcrumb-prefix,
          .breadcrumb-separator,
          .breadcrumb-group {
            display: none !important;
          }
        }
        @media (max-width: 640px) {
          .env-indicator-pill {
            display: none !important;
          }
          .user-profile-info {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default ManagementHeader;
