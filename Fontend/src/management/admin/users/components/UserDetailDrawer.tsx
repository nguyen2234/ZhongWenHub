import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Unlock,
  Edit2,
  ShieldAlert,
  BookOpen,
  Clock,
  Trash2,
  KeyRound,
  CreditCard,
  Sparkles,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import type { HskLevelCode, UpdateUserDTO, UserDetail, UserRole, UserStatus } from '../types/user.types';
import { StatusBadge } from '../../../shared/components';

export interface UserDetailDrawerProps {
  isOpen: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onSaveEdit: (id: string, dto: UpdateUserDTO) => Promise<void> | void;
  onToggleLock: (user: UserDetail) => void;
  onDelete?: (user: UserDetail) => void;
  onResetPassword?: (user: UserDetail) => void;
  onAdjustWallet?: (user: UserDetail) => void;
  onUpdateSubscription?: (user: UserDetail) => void;
}

const HSK_OPTIONS: HskLevelCode[] = [
  'HSK 1',
  'HSK 2',
  'HSK 3',
  'HSK 4',
  'HSK 5',
  'HSK 6',
  'HSK 7–9',
];

const STATUS_OPTIONS: Array<{ value: UserStatus; label: string }> = [
  { value: 'ACTIVE', label: 'Đang hoạt động' },
  { value: 'PENDING', label: 'Chờ xác thực' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
  { value: 'LOCKED', label: 'Bị khóa' },
];

const ROLE_OPTIONS: Array<{ value: UserRole; label: string }> = [
  { value: 'STUDENT', label: 'Học viên (Student)' },
  { value: 'TEACHER', label: 'Giáo viên (Teacher)' },
  { value: 'CONTENT_MANAGER', label: 'Quản lý nội dung (Content Manager)' },
  { value: 'SUPPORT', label: 'Hỗ trợ viên (Support)' },
  { value: 'ADMIN', label: 'Quản trị viên (Admin)' },
];

const getRoleBadgeInfo = (roles?: string[]) => {
  const primaryRole = roles && roles.length > 0 ? roles[0].toUpperCase() : 'STUDENT';
  switch (primaryRole) {
    case 'ADMIN':
      return { label: 'Quản trị viên', variant: 'danger' as const, bg: 'rgba(239, 68, 68, 0.1)', color: '#dc2626' };
    case 'TEACHER':
      return { label: 'Giáo viên', variant: 'primary' as const, bg: 'rgba(59, 130, 246, 0.1)', color: '#2563eb' };
    case 'CONTENT_MANAGER':
      return { label: 'Quản lý nội dung', variant: 'warning' as const, bg: 'rgba(245, 158, 11, 0.1)', color: '#d97706' };
    case 'SUPPORT':
      return { label: 'Hỗ trợ viên', variant: 'info' as const, bg: 'rgba(13, 148, 136, 0.1)', color: '#0d9488' };
    case 'STUDENT':
    default:
      return { label: 'Học viên', variant: 'neutral' as const, bg: 'rgba(100, 116, 139, 0.1)', color: '#475569' };
  }
};

const isWalletAndPlanEligible = (user: UserDetail) => {
  const primaryRole = (user.roles?.[0] || user.role || 'STUDENT').toUpperCase();
  return primaryRole === 'STUDENT' || primaryRole === 'TEACHER';
};

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  isOpen,
  user,
  onClose,
  onSaveEdit,
  onToggleLock,
  onDelete,
  onResetPassword,
  onAdjustWallet,
  onUpdateSubscription,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserDTO>(() => ({
    name: user?.name || '',
    email: user?.email || '',
    hskLevel: user?.hskLevel || 'HSK 1',
    status: user?.status || 'ACTIVE',
    role: (user?.roles && user.roles[0]) || user?.role || 'STUDENT',
    notes: user?.notes || '',
    phone: user?.phone || '',
  }));
  const [editError, setEditError] = useState<string | null>(null);

  const handleStartEdit = () => {
    if (user) {
      setEditFormData({
        name: user.name,
        email: user.email,
        hskLevel: user.hskLevel,
        status: user.status,
        role: (user.roles && user.roles[0]) || user.role || 'STUDENT',
        notes: user.notes || '',
        phone: user.phone || '',
      });
      setEditError(null);
      setIsEditing(true);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const getStatusVariant = (status: UserStatus) => {
    switch (status) {
      case 'ACTIVE':
        return { variant: 'success' as const, label: 'Đang hoạt động' };
      case 'PENDING':
        return { variant: 'warning' as const, label: 'Chờ xác thực' };
      case 'LOCKED':
        return { variant: 'danger' as const, label: 'Tài khoản bị khóa' };
      case 'INACTIVE':
      default:
        return { variant: 'neutral' as const, label: 'Ngưng hoạt động' };
    }
  };

  const statusInfo = getStatusVariant(user.status);
  const roleInfo = getRoleBadgeInfo(user.roles || (user.role ? [user.role] : undefined));
  const eligible = isWalletAndPlanEligible(user);

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editFormData.name.trim()) {
      setEditError('Họ và tên không được để trống.');
      return;
    }
    if (!editFormData.email.trim() || !editFormData.email.includes('@')) {
      setEditError('Email không hợp lệ.');
      return;
    }

    setIsSaving(true);
    try {
      await onSaveEdit(user.id, editFormData);
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('Đã xảy ra lỗi khi lưu thông tin.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="user-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Thông tin chi tiết người dùng"
    >
      <div className="user-detail-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-avatar">{getInitials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                  {user.name}
                </h3>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: roleInfo.bg,
                    color: roleInfo.color,
                  }}
                >
                  {roleInfo.label}
                </span>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 6px 0' }}>
                {user.email}
              </p>
              <StatusBadge label={statusInfo.label} variant={statusInfo.variant} size="sm" />
            </div>
          </div>

          <button
            type="button"
            className="btn-row-action"
            onClick={onClose}
            aria-label="Đóng bảng chi tiết"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="drawer-body">
          {/* Locked Notice if applicable */}
          {user.status === 'LOCKED' && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 'var(--radius-md)',
                padding: '12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <ShieldAlert size={18} style={{ color: 'var(--danger)', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ fontSize: '12px', color: 'var(--danger)' }}>
                  Tài khoản đang bị khóa
                </strong>
                <p style={{ fontSize: '11px', color: 'var(--foreground)', margin: '3px 0 0 0' }}>
                  {user.lockReason || 'Khóa bởi Quản trị viên.'}
                </p>
                {user.lockedAt && (
                  <span style={{ fontSize: '10px', color: 'var(--muted)', display: 'block', marginTop: '4px' }}>
                    Thời điểm khóa: {user.lockedAt}
                  </span>
                )}
              </div>
            </div>
          )}

          {isEditing ? (
            /* Edit Mode Form */
            <form onSubmit={handleSaveSubmit} className="drawer-edit-form">
              <div className="drawer-section-title">Chỉnh sửa thông tin người dùng</div>

              {editError && (
                <div style={{ color: 'var(--danger)', fontSize: '11px', fontWeight: 600 }}>
                  ✕ {editError}
                </div>
              )}

              <div className="drawer-form-field">
                <label className="drawer-form-label">Họ và tên *</label>
                <input
                  type="text"
                  className="drawer-form-input"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="drawer-form-field">
                <label className="drawer-form-label">Địa chỉ Email *</label>
                <input
                  type="email"
                  className="drawer-form-input"
                  value={editFormData.email}
                  onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                  required
                  disabled={isSaving}
                />
              </div>

              <div className="drawer-form-field">
                <label className="drawer-form-label">Vai trò hệ thống (Role) *</label>
                <select
                  className="drawer-form-select"
                  value={editFormData.role || 'STUDENT'}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, role: e.target.value as UserRole })
                  }
                  disabled={isSaving}
                >
                  {ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="drawer-form-field">
                <label className="drawer-form-label">Trạng thái tài khoản</label>
                <select
                  className="drawer-form-select"
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, status: e.target.value as UserStatus })
                  }
                  disabled={isSaving}
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="drawer-form-field">
                <label className="drawer-form-label">Trình độ HSK</label>
                <select
                  className="drawer-form-select"
                  value={editFormData.hskLevel}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, hskLevel: e.target.value as HskLevelCode })
                  }
                  disabled={isSaving}
                >
                  {HSK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="drawer-form-field">
                <label className="drawer-form-label">Ghi chú quản trị</label>
                <textarea
                  className="drawer-form-textarea"
                  value={editFormData.notes || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ghi chú nội bộ cho ban quản trị..."
                  disabled={isSaving}
                />
              </div>
            </form>
          ) : (
            /* View Mode */
            <>
              {/* Account Information */}
              <div>
                <div className="drawer-section-title">
                  <span>Thông tin tài khoản</span>
                </div>
                <div className="drawer-data-grid">
                  <div className="drawer-data-cell">
                    <span className="drawer-cell-lbl">Mã người dùng</span>
                    <span className="drawer-cell-val" style={{ fontSize: '11px', wordBreak: 'break-all' }}>
                      {user.id}
                    </span>
                  </div>
                  <div className="drawer-data-cell">
                    <span className="drawer-cell-lbl">Vai trò</span>
                    <span className="drawer-cell-val" style={{ color: roleInfo.color, fontWeight: 700 }}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <div className="drawer-data-cell">
                    <span className="drawer-cell-lbl">Trình độ HSK</span>
                    <span className="drawer-cell-val" style={{ color: 'var(--primary)' }}>
                      {user.hskLevel}
                    </span>
                  </div>
                  <div className="drawer-data-cell">
                    <span className="drawer-cell-lbl">Ngày tham gia</span>
                    <span className="drawer-cell-val">{user.joinedAt}</span>
                  </div>
                  <div className="drawer-data-cell" style={{ gridColumn: 'span 2' }}>
                    <span className="drawer-cell-lbl">Hoạt động gần nhất</span>
                    <span className="drawer-cell-val">{user.lastActiveAt}</span>
                  </div>
                  {user.phone && (
                    <div className="drawer-data-cell" style={{ gridColumn: 'span 2' }}>
                      <span className="drawer-cell-lbl">Số điện thoại liên hệ</span>
                      <span className="drawer-cell-val">{user.phone}</span>
                    </div>
                  )}
                  {user.notes && (
                    <div className="drawer-data-cell" style={{ gridColumn: 'span 2' }}>
                      <span className="drawer-cell-lbl">Ghi chú nội bộ</span>
                      <span className="drawer-cell-val" style={{ fontWeight: 400, color: 'var(--muted)' }}>
                        {user.notes}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Wallet Section */}
              <div className="drawer-learning-card" style={{ borderColor: '#bbf7d0', backgroundColor: '#f0fdf4' }}>
                <div className="drawer-section-title" style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534' }}>
                    <CreditCard size={15} style={{ color: '#16a34a' }} />
                    Ví & Số dư tài khoản
                  </span>
                  {eligible && onAdjustWallet && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-outline ds-btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      onClick={() => onAdjustWallet(user)}
                    >
                      Điều chỉnh số dư
                    </button>
                  )}
                </div>

                {eligible ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#15803d' }}>Số dư hiện tại:</span>
                      <strong style={{ fontSize: '18px', color: '#166534', fontVariantNumeric: 'tabular-nums' }}>
                        {(user.walletBalance ?? 0).toLocaleString('vi-VN')} ₫
                      </strong>
                    </div>

                    {user.walletTransactions && user.walletTransactions.length > 0 ? (
                      <div style={{ marginTop: '10px', borderTop: '1px solid #dcfce7', paddingTop: '8px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534', display: 'block', marginBottom: '6px' }}>
                          Lịch sử giao dịch gần nhất ({user.walletTransactions.length})
                        </span>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                          {user.walletTransactions.map((tx) => (
                            <div
                              key={tx.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '11px',
                                padding: '4px 8px',
                                backgroundColor: '#ffffff',
                                borderRadius: '4px',
                                border: '1px solid #dcfce7',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {tx.amount >= 0 ? (
                                  <ArrowDownLeft size={13} style={{ color: '#16a34a' }} />
                                ) : (
                                  <ArrowUpRight size={13} style={{ color: '#dc2626' }} />
                                )}
                                <div>
                                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{tx.reason || tx.transactionType}</span>
                                  <span style={{ display: 'block', fontSize: '10px', color: '#64748b' }}>{tx.createdAt}</span>
                                </div>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <strong style={{ color: tx.amount >= 0 ? '#16a34a' : '#dc2626' }}>
                                  {tx.amount >= 0 ? '+' : ''}{tx.amount.toLocaleString('vi-VN')} ₫
                                </strong>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p style={{ fontSize: '11px', color: '#15803d', margin: 0 }}>Chưa có giao dịch phát sinh.</p>
                    )}
                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Không áp dụng cho vai trò này (chỉ áp dụng cho Học viên và Giáo viên).
                  </p>
                )}
              </div>

              {/* Subscription Plan Section */}
              <div className="drawer-learning-card" style={{ borderColor: '#fed7aa', backgroundColor: '#fffbeb' }}>
                <div className="drawer-section-title" style={{ marginBottom: '8px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#9a3412' }}>
                    <Sparkles size={15} style={{ color: '#ea580c' }} />
                    Gói sử dụng hiện tại
                  </span>
                  {eligible && onUpdateSubscription && (
                    <button
                      type="button"
                      className="ds-btn ds-btn-outline ds-btn-sm"
                      style={{ fontSize: '11px', padding: '2px 8px' }}
                      onClick={() => onUpdateSubscription(user)}
                    >
                      Thay đổi gói
                    </button>
                  )}
                </div>

                {eligible ? (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '12px', color: '#9a3412' }}>Gói kích hoạt:</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: '12px',
                          padding: '2px 10px',
                          borderRadius: '12px',
                          backgroundColor:
                            user.plan === 'Premium' ? '#f59e0b' : user.plan === 'Basic' ? '#3b82f6' : '#64748b',
                          color: '#ffffff',
                        }}
                      >
                        {user.plan || 'Free'}
                      </span>
                    </div>
                    <div style={{ fontSize: '11px', color: '#78350f', display: 'flex', gap: '16px' }}>
                      <span>Bắt đầu: <strong>{user.planStartDate || 'Chưa thiết lập'}</strong></span>
                      <span>Hết hạn: <strong>{user.planEndDate || 'Vô thời hạn'}</strong></span>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', margin: 0 }}>
                    Không áp dụng cho vai trò này (chỉ áp dụng cho Học viên và Giáo viên).
                  </p>
                )}
              </div>

              {/* Learning Summary (READ-ONLY) */}
              <div className="drawer-learning-card">
                <div className="drawer-section-title" style={{ marginBottom: '6px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <BookOpen size={14} style={{ color: 'var(--primary)' }} />
                    Dữ liệu học tập
                  </span>
                  <span className="drawer-read-only-pill">Chỉ đọc • Telemetry</span>
                </div>

                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--muted)', marginBottom: '4px' }}>
                    <span>Tiến độ hoàn thành lộ trình</span>
                    <strong>{user.learningSummary.progressPercentage}%</strong>
                  </div>
                  <div className="table-progress-bar" style={{ height: '6px' }}>
                    <div
                      className="table-progress-fill"
                      style={{ width: `${user.learningSummary.progressPercentage}%` }}
                    />
                  </div>
                </div>

                <div className="learning-telemetry-grid">
                  <div className="telemetry-box">
                    <span className="telemetry-val" style={{ color: 'var(--primary)' }}>
                      {user.learningSummary.totalXp.toLocaleString()}
                    </span>
                    <span className="telemetry-lbl">Tổng điểm XP</span>
                  </div>
                  <div className="telemetry-box">
                    <span className="telemetry-val" style={{ color: '#d97706' }}>
                      {user.learningSummary.streakDays}
                    </span>
                    <span className="telemetry-lbl">Ngày Streak</span>
                  </div>
                  <div className="telemetry-box">
                    <span className="telemetry-val">
                      {user.learningSummary.completedLessons}/{user.learningSummary.totalLessons}
                    </span>
                    <span className="telemetry-lbl">Bài hoàn thành</span>
                  </div>
                  <div className="telemetry-box">
                    <span className="telemetry-val" style={{ color: '#16a34a' }}>
                      {user.learningSummary.vocabularyMastered}
                    </span>
                    <span className="telemetry-lbl">Từ vựng thành thạo</span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--muted)',
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border)',
                  }}
                >
                  <Clock size={12} />
                  <span>Phiên học gần nhất: </span>
                  <strong style={{ color: 'var(--foreground)' }}>
                    {user.learningSummary.lastStudySession}
                  </strong>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="drawer-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={() => setIsEditing(false)}
                disabled={isSaving}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleSaveSubmit}
                disabled={isSaving}
              >
                {isSaving ? 'Đang lưu...' : 'Lưu thay đổi'}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="ds-btn ds-btn-outline ds-btn-sm"
                onClick={handleStartEdit}
              >
                <Edit2 size={13} style={{ marginRight: '5px' }} />
                Chỉnh sửa
              </button>

              {onResetPassword && (
                <button
                  type="button"
                  className="ds-btn ds-btn-outline ds-btn-sm"
                  onClick={() => onResetPassword(user)}
                >
                  <KeyRound size={13} style={{ marginRight: '5px' }} />
                  Đặt lại mật khẩu
                </button>
              )}

              <button
                type="button"
                className={`ds-btn ds-btn-sm ${user.status === 'LOCKED' ? 'ds-btn-outline' : 'ds-btn-danger'}`}
                onClick={() => onToggleLock(user)}
              >
                {user.status === 'LOCKED' ? (
                  <>
                    <Unlock size={13} style={{ marginRight: '5px' }} />
                    Mở khóa tài khoản
                  </>
                ) : (
                  <>
                    <Lock size={13} style={{ marginRight: '5px' }} />
                    Khóa tài khoản
                  </>
                )}
              </button>

              {onDelete && (
                <button
                  type="button"
                  className="ds-btn ds-btn-danger ds-btn-sm"
                  onClick={() => onDelete(user)}
                  title="Vô hiệu hóa và xóa mềm tài khoản"
                >
                  <Trash2 size={13} style={{ marginRight: '5px' }} />
                  Vô hiệu hóa
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
