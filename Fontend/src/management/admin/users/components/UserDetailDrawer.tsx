import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, Edit2, ShieldAlert, BookOpen, Flame, Award, Clock } from 'lucide-react';
import type { HskLevelCode, UpdateUserDTO, UserDetail, UserStatus } from '../types/user.types';
import { StatusBadge } from '../../../shared/components';

export interface UserDetailDrawerProps {
  isOpen: boolean;
  user: UserDetail | null;
  onClose: () => void;
  onSaveEdit: (id: string, dto: UpdateUserDTO) => void;
  onToggleLock: (user: UserDetail) => void;
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

export const UserDetailDrawer: React.FC<UserDetailDrawerProps> = ({
  isOpen,
  user,
  onClose,
  onSaveEdit,
  onToggleLock,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState<UpdateUserDTO>(() => ({
    name: user?.name || '',
    email: user?.email || '',
    hskLevel: user?.hskLevel || 'HSK 1',
    status: user?.status || 'ACTIVE',
    notes: user?.notes || '',
  }));
  const [editError, setEditError] = useState<string | null>(null);

  const handleStartEdit = () => {
    if (user) {
      setEditFormData({
        name: user.name,
        email: user.email,
        hskLevel: user.hskLevel,
        status: user.status,
        notes: user.notes || '',
      });
      setEditError(null);
      setIsEditing(true);
    }
  };

  // Handle escape key
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

  const handleSaveSubmit = (e: React.FormEvent) => {
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

    try {
      onSaveEdit(user.id, editFormData);
      setIsEditing(false);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setEditError(err.message);
      } else {
        setEditError('Đã xảy ra lỗi khi lưu thông tin.');
      }
    }
  };

  return (
    <div
      className="user-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Thông tin chi tiết học viên"
    >
      <div
        className="user-detail-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-avatar">{getInitials(user.name)}</div>
            <div style={{ minWidth: 0 }}>
              <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
                {user.name}
              </h3>
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
              <div className="drawer-section-title">Chỉnh sửa thông tin học viên</div>

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
                />
              </div>

              <div className="drawer-form-field">
                <label className="drawer-form-label">Trình độ HSK mục tiêu</label>
                <select
                  className="drawer-form-select"
                  value={editFormData.hskLevel}
                  onChange={(e) =>
                    setEditFormData({ ...editFormData, hskLevel: e.target.value as HskLevelCode })
                  }
                >
                  {HSK_OPTIONS.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
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
                >
                  {STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="drawer-form-field">
                <label className="drawer-form-label">Ghi chú quản trị</label>
                <textarea
                  className="drawer-form-textarea"
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  placeholder="Ghi chú nội bộ cho ban quản trị..."
                />
              </div>

              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  backgroundColor: 'var(--surface-hover)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                }}
              >
                ℹ️ Lưu ý: Các chỉ số học tập (XP, Chuỗi học, Tiến độ hoàn thành bài) được đồng bộ
                tự động từ hệ thống học viên và không thể can thiệp thủ công.
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
                    <span className="drawer-cell-lbl">Mã học viên</span>
                    <span className="drawer-cell-val">{user.id}</span>
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
                  <div className="drawer-data-cell">
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
                  <div className="telemetry-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#ea580c' }}>
                      <Flame size={15} />
                      <span className="telemetry-num">{user.learningSummary.streakDays}</span>
                      <span style={{ fontSize: '11px', color: 'var(--muted)' }}>ngày</span>
                    </div>
                    <div className="telemetry-lbl">Chuỗi Streak</div>
                  </div>

                  <div className="telemetry-item">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#eab308' }}>
                      <Award size={15} />
                      <span className="telemetry-num">
                        {user.learningSummary.totalXp.toLocaleString()}
                      </span>
                    </div>
                    <div className="telemetry-lbl">Điểm kinh nghiệm (XP)</div>
                  </div>

                  <div className="telemetry-item">
                    <div className="telemetry-num">
                      {user.learningSummary.completedLessons}
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                        /{user.learningSummary.totalLessons}
                      </span>
                    </div>
                    <div className="telemetry-lbl">Bài giảng hoàn thành</div>
                  </div>

                  <div className="telemetry-item">
                    <div className="telemetry-num">
                      {user.learningSummary.vocabularyMastered}
                      <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>từ</span>
                    </div>
                    <div className="telemetry-lbl">Từ vựng SRS nắm vững</div>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--muted)',
                    marginTop: '12px',
                    paddingTop: '8px',
                    borderTop: '1px solid var(--border-subtle)',
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
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="ds-btn ds-btn-primary ds-btn-sm"
                onClick={handleSaveSubmit}
              >
                Lưu thay đổi
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};
