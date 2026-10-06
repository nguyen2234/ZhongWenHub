import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import type { UserRole } from '../../../types';

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

  // Compute breadcrumb title based on pathname
  const breadcrumb = React.useMemo(() => {
    const path = location.pathname;
    if (path.includes('/users')) return { group: 'Quản lý người dùng', title: 'Danh sách Người dùng' };
    if (path.includes('/teachers')) return { group: 'Quản lý người dùng', title: 'Giáo viên & Trợ giảng' };
    if (path.includes('/support-staff')) return { group: 'Quản lý người dùng', title: 'Nhân viên hỗ trợ' };
    if (path.includes('/roles')) return { group: 'Quản lý người dùng', title: 'Vai trò & Phân quyền' };
    if (path.includes('/hsk-content')) return { group: 'Nội dung học tập', title: 'Cấp độ HSK' };
    if (path.includes('/vocabulary')) return { group: 'Nội dung học tập', title: 'Kho từ vựng & SRS' };
    if (path.includes('/grammar')) return { group: 'Nội dung học tập', title: 'Ngữ pháp & Cấu trúc' };
    if (path.includes('/hanzi')) return { group: 'Nội dung học tập', title: 'Chữ Hán' };
    if (path.includes('/courses')) return { group: 'Nội dung học tập', title: 'Khóa học & Giáo trình' };
    if (path.includes('/lessons')) return { group: 'Nội dung học tập', title: 'Bài học số' };
    if (path.includes('/question-bank')) return { group: 'Đánh giá', title: 'Ngân hàng câu hỏi' };
    if (path.includes('/exercises')) return { group: 'Đánh giá', title: 'Ngân hàng bài tập' };
    if (path.includes('/tests')) return { group: 'Đánh giá', title: 'Bài kiểm tra & Đề thi' };
    if (path.includes('/classes')) return { group: 'Giảng dạy', title: 'Lớp học của tôi' };
    if (path.includes('/students')) return { group: 'Giảng dạy', title: 'Học viên' };
    if (path.includes('/lectures')) return { group: 'Giảng dạy', title: 'Bài giảng số' };
    if (path.includes('/assignments')) return { group: 'Giảng dạy', title: 'Bài tập về nhà' };
    if (path.includes('/submissions')) return { group: 'Đánh giá', title: 'Bài tập đã nộp' };
    if (path.includes('/grading')) return { group: 'Đánh giá', title: 'Chấm điểm & Nhận xét' };
    if (path.includes('/tickets')) return { group: 'Hỗ trợ', title: 'Tickets & Yêu cầu' };
    if (path.includes('/reports')) return { group: 'Hệ thống', title: 'Báo cáo & Thống kê' };
    if (path.includes('/settings')) return { group: 'Hệ thống', title: 'Cài đặt hệ thống' };
    return { group: 'Tổng quan', title: 'Bảng điều khiển (Dashboard)' };
  }, [location.pathname]);

  return (
    <header
      style={{
        height: '62px',
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: '0 var(--space-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
      }}
    >
      {/* =====================================================================
          LEFT: SIDEBAR TOGGLE & BREADCRUMB
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
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--muted)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={isCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
        </button>

        {/* Breadcrumb Hierarchy */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', minWidth: 0 }}>
          <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }} className="breadcrumb-prefix">
            Quản trị {currentRole}
          </span>
          <span style={{ color: 'var(--border-strong)' }} className="breadcrumb-separator">/</span>
          <span style={{ color: 'var(--muted)', whiteSpace: 'nowrap' }} className="breadcrumb-group">
            {breadcrumb.group}
          </span>
          <span style={{ color: 'var(--border-strong)' }}>/</span>
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
        </div>
      </div>

      {/* =====================================================================
          RIGHT: SEARCH SHORTCUT, NOTIFICATIONS, USER DROPDOWN
          ===================================================================== */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {/* Quick Search Trigger (hidden on mobile) */}
        <div
          className="header-search-btn"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 12px',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-full)',
            color: 'var(--muted)',
            fontSize: '12px',
            cursor: 'pointer',
          }}
          onClick={() => {
            const input = document.querySelector('input[placeholder*="Tìm nhanh"]') as HTMLInputElement;
            if (input) input.focus();
          }}
          title="Tìm nhanh (Ctrl + K)"
        >
          <Search size={13} />
          <span>Tìm kiếm...</span>
          <kbd
            style={{
              padding: '1px 5px',
              fontSize: '10px',
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
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
            aria-label="Thông báo hệ thống"
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              background: 'none',
              border: '1px solid var(--border)',
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
                backgroundColor: 'var(--danger)',
                color: '#fff',
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
                top: '44px',
                width: '320px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                padding: 'var(--space-3)',
                zIndex: 60,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', paddingBottom: '6px', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)' }}>Thông báo mới</span>
                <span style={{ fontSize: '11px', color: 'var(--primary)', cursor: 'pointer' }}>Đánh dấu đã đọc</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--primary-light)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--primary)' }}>3 Học viên mới đăng ký HSK 2</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>5 phút trước</div>
                </div>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>14 Bài tập cần giáo viên chấm điểm</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>28 phút trước</div>
                </div>
                <div style={{ padding: '6px', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--background)' }}>
                  <div style={{ fontWeight: 600, color: 'var(--foreground)' }}>Báo cáo sao lưu dữ liệu tự động hoàn tất</div>
                  <div style={{ fontSize: '11px', color: 'var(--muted)' }}>2 giờ trước</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Trigger & Dropdown */}
        <div style={{ position: 'relative' }} ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            aria-label="Menu tài khoản"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 8px 4px 4px',
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
            className="user-profile-btn"
          >
            {/* Avatar Pill */}
            <div
              style={{
                width: '30px',
                height: '30px',
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

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }} className="user-profile-info">
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
                {userName}
              </span>
              <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
                {currentRole}
              </span>
            </div>

            <ChevronDown size={14} style={{ color: 'var(--muted)' }} />
          </button>

          {/* User Profile Dropdown Menu */}
          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: '44px',
                width: '230px',
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
                padding: 'var(--space-2)',
                zIndex: 60,
              }}
            >
              {/* User meta info */}
              <div style={{ padding: '8px 10px', borderBottom: '1px solid var(--border)', marginBottom: '4px' }}>
                <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)' }}>{userName}</div>
                <div style={{ fontSize: '10.5px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userEmail}</div>
                <div style={{ marginTop: '4px' }}>
                  <span
                    style={{
                      fontSize: '9.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      backgroundColor: 'var(--primary-light)',
                      color: 'var(--primary)',
                    }}
                  >
                    VAI TRÒ: {currentRole}
                  </span>
                </div>
              </div>

              {/* Menu Actions */}
              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  alert('Chức năng: Xem hồ sơ cá nhân');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
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

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  alert('Chức năng: Cài đặt tài khoản');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
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
                <Settings size={14} style={{ color: 'var(--muted)' }} />
                <span>Cài đặt hệ thống</span>
              </button>

              <Link
                to="/dashboard"
                onClick={() => setIsUserMenuOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--primary)',
                  cursor: 'pointer',
                  textDecoration: 'none',
                }}
                className="dropdown-item"
              >
                <ArrowLeft size={14} style={{ color: 'var(--primary)' }} />
                <span>Về Cổng Học Viên</span>
              </Link>

              <div style={{ height: '1px', backgroundColor: 'var(--border)', margin: '4px 0' }} />

              <button
                type="button"
                onClick={() => {
                  setIsUserMenuOpen(false);
                  navigate('/login');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  width: '100%',
                  padding: '7px 10px',
                  background: 'none',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  fontSize: '12px',
                  color: 'var(--danger)',
                  cursor: 'pointer',
                  textAlign: 'left',
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
          .user-profile-info {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};

export default ManagementHeader;
