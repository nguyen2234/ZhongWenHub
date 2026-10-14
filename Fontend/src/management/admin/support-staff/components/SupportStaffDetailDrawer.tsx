import React, { useState, useEffect } from 'react';
import {
  X,
  Edit2,
  CalendarCheck,
  Lock,
  Unlock,
  Shield,
  Clock,
  Activity,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { StatusBadge } from '../../../shared/components';
import type {
  SupportAccountStatus,
  SupportScope,
  SupportShift,
  SupportStaffDetail,
  SupportWorkStatus,
  UpdateSupportStaffDTO,
} from '../types/support-staff.types';
import {
  ALL_SUPPORT_SCOPES,
  ALL_SUPPORT_SHIFTS,
  SUPPORT_SCOPE_META,
  SUPPORT_SHIFT_META,
} from '../types/support-staff.types';
import { adminSupportStaffService } from '../services/support-staff.service';

export interface SupportStaffDetailDrawerProps {
  isOpen: boolean;
  staff: SupportStaffDetail | null;
  onClose: () => void;
  onSaveEdit: (id: string, dto: UpdateSupportStaffDTO) => void;
  onChangeWorkStatus: (staff: SupportStaffDetail) => void;
  onToggleLockAccount: (staff: SupportStaffDetail) => void;
}

export const SupportStaffDetailDrawer: React.FC<SupportStaffDetailDrawerProps> = ({
  isOpen,
  staff,
  onClose,
  onSaveEdit,
  onChangeWorkStatus,
  onToggleLockAccount,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [editForm, setEditForm] = useState<UpdateSupportStaffDTO>({
    name: '',
    email: '',
    phone: '',
    supportScopes: [],
    shift: 'MORNING',
    notes: '',
  });

  // Reset editing mode and validation errors whenever active staff changes
  useEffect(() => {
    setIsEditing(false);
    setErrors({});
  }, [staff?.id]);

  const handleStartEdit = () => {
    if (!staff) return;
    setEditForm({
      name: staff.name,
      email: staff.email,
      phone: staff.phone || '',
      supportScopes: [...staff.supportScopes],
      shift: staff.shift,
      notes: staff.notes || '',
    });
    setErrors({});
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setErrors({});
  };

  // Keyboard navigation (ESC key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isEditing) {
          setIsEditing(false);
          setErrors({});
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isEditing, onClose]);

  if (!isOpen || !staff) return null;

  const initials = staff.name
    .split(' ')
    .map((w) => w[0])
    .slice(-2)
    .join('')
    .toUpperCase();

  const handleToggleScope = (scope: SupportScope) => {
    setEditForm((prev) => {
      const exists = prev.supportScopes.includes(scope);
      const updated = exists
        ? prev.supportScopes.filter((s) => s !== scope)
        : [...prev.supportScopes, scope];
      return { ...prev, supportScopes: updated };
    });
    if (errors.supportScopes) {
      setErrors((prev) => ({ ...prev, supportScopes: '' }));
    }
  };

  const validateForm = (): boolean => {
    const errs: Record<string, string> = {};

    if (!editForm.name.trim()) {
      errs.name = 'Vui lòng nhập họ và tên nhân viên.';
    }

    const trimmedEmail = editForm.email.trim();
    if (!trimmedEmail) {
      errs.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Email không đúng định dạng.';
    } else if (adminSupportStaffService.isEmailTaken(trimmedEmail, staff.id)) {
      errs.email = 'Email này đã tồn tại trong hệ thống.';
    }

    if (editForm.supportScopes.length === 0) {
      errs.supportScopes = 'Vui lòng chọn ít nhất 1 phạm vi tiếp nhận hỗ trợ.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSaveEdit(staff.id, editForm);
    setIsEditing(false);
  };

  const getWorkStatusBadge = (status: SupportWorkStatus) => {
    switch (status) {
      case 'AVAILABLE':
        return <StatusBadge variant="success" label="Đang sẵn sàng" />;
      case 'BUSY':
        return <StatusBadge variant="warning" label="Đang bận" />;
      case 'OFF_DUTY':
        return <StatusBadge variant="neutral" label="Hết ca trực" />;
      case 'ON_LEAVE':
        return <StatusBadge variant="warning" label="Nghỉ phép" />;
    }
  };

  const getAccountStatusBadge = (status: SupportAccountStatus) => {
    switch (status) {
      case 'ACTIVE':
        return <StatusBadge variant="info" label="TK Hoạt động" />;
      case 'LOCKED':
        return <StatusBadge variant="danger" label="TK Bị khóa" />;
      case 'PENDING':
        return <StatusBadge variant="warning" label="TK Chờ kích hoạt" />;
      default:
        return <StatusBadge variant="neutral" label="TK Ngừng HĐ" />;
    }
  };

  return (
    <div
      className="support-drawer-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="support-drawer-title"
    >
      <div
        className="support-detail-drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="support-drawer-header">
          <div className="support-drawer-header-left">
            <div className="support-drawer-avatar" aria-hidden="true">
              {initials}
            </div>
            <div className="support-drawer-title-area">
              <div id="support-drawer-title" className="support-drawer-name">
                {staff.name}
              </div>
              <div className="support-drawer-email">{staff.email}</div>
              <div className="support-drawer-badges">
                {/* Independent WorkStatus & AccountStatus Badges */}
                {getWorkStatusBadge(staff.workStatus)}
                {getAccountStatusBadge(staff.accountStatus)}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="support-drawer-close-btn"
            onClick={onClose}
            aria-label="Đóng bảng chi tiết"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body with Independent Scroll */}
        <div className="support-drawer-body">
          {isEditing ? (
            /* ================= EDIT MODE ================= */
            <form
              id="support-staff-edit-form"
              onSubmit={handleSaveSubmit}
              className="support-drawer-edit-form"
              noValidate
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 6,
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <span
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: 'var(--foreground)',
                  }}
                >
                  Chỉnh sửa hồ sơ nhân viên
                </span>
                <span className="drawer-readonly-badge">Chế độ chỉnh sửa</span>
              </div>

              {/* Name */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">
                  Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <input
                  type="text"
                  className="drawer-edit-input"
                  value={editForm.name}
                  onChange={(e) => {
                    setEditForm({ ...editForm, name: e.target.value });
                    if (errors.name) setErrors((prev) => ({ ...prev, name: '' }));
                  }}
                />
                {errors.name && (
                  <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                    {errors.name}
                  </span>
                )}
              </div>

              {/* Email & Phone */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div className="drawer-edit-field">
                  <label className="drawer-edit-label">
                    Email <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="email"
                    className="drawer-edit-input"
                    value={editForm.email}
                    onChange={(e) => {
                      setEditForm({ ...editForm, email: e.target.value });
                      if (errors.email) setErrors((prev) => ({ ...prev, email: '' }));
                    }}
                  />
                  {errors.email && (
                    <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                      {errors.email}
                    </span>
                  )}
                </div>

                <div className="drawer-edit-field">
                  <label className="drawer-edit-label">Số điện thoại</label>
                  <input
                    type="tel"
                    className="drawer-edit-input"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                </div>
              </div>

              {/* Shift */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">Ca làm việc</label>
                <select
                  className="drawer-edit-select"
                  value={editForm.shift}
                  onChange={(e) =>
                    setEditForm({ ...editForm, shift: e.target.value as SupportShift })
                  }
                >
                  {ALL_SUPPORT_SHIFTS.map((sh) => (
                    <option key={sh} value={sh}>
                      {SUPPORT_SHIFT_META[sh]?.label || sh}
                    </option>
                  ))}
                </select>
              </div>

              {/* Support Scopes (Multi-select pills) */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">
                  Phạm vi hỗ trợ tiếp nhận <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <div className="pill-selector-grid">
                  {ALL_SUPPORT_SCOPES.map((scope) => {
                    const isSelected = editForm.supportScopes.includes(scope);
                    return (
                      <button
                        type="button"
                        key={scope}
                        className={`pill-select-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleScope(scope)}
                      >
                        {SUPPORT_SCOPE_META[scope]?.shortLabel || scope}
                      </button>
                    );
                  })}
                </div>
                {errors.supportScopes && (
                  <span style={{ fontSize: '11px', color: 'var(--danger)' }}>
                    {errors.supportScopes}
                  </span>
                )}
              </div>

              {/* Notes */}
              <div className="drawer-edit-field">
                <label className="drawer-edit-label">Ghi chú nội bộ</label>
                <textarea
                  className="drawer-edit-textarea"
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  placeholder="Ghi chú phân công, năng lực chuyên trách hoặc bàn giao ca..."
                />
              </div>

              {/* Notice that WorkStatus & AccountStatus are mutated independently */}
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--muted)',
                  backgroundColor: 'var(--surface-hover)',
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-md)',
                  lineHeight: 1.4,
                }}
              >
                ℹ️ <strong>Lưu ý:</strong> Trạng thái làm việc và Khóa tài khoản được quản lý qua
                các luồng thao tác riêng biệt ở chân trang nhằm đảm bảo tính toàn vẹn hệ thống.
              </div>
            </form>
          ) : (
            /* ================= VIEW MODE ================= */
            <>
              {/* Section 1: Account Information */}
              <div className="support-drawer-section">
                <div className="support-section-header">
                  <span className="support-section-title">
                    <Shield size={13} />
                    Thông tin tài khoản
                  </span>
                </div>
                <div className="support-kv-grid">
                  <div className="support-kv-item">
                    <span className="support-kv-label">Họ và tên</span>
                    <span className="support-kv-value">{staff.name}</span>
                  </div>
                  <div className="support-kv-item">
                    <span className="support-kv-label">Email công tác</span>
                    <span className="support-kv-value">{staff.email}</span>
                  </div>
                  <div className="support-kv-item">
                    <span className="support-kv-label">Số điện thoại</span>
                    <span className="support-kv-value">{staff.phone || 'Chưa cập nhật'}</span>
                  </div>
                  <div className="support-kv-item">
                    <span className="support-kv-label">Ngày gia nhập</span>
                    <span className="support-kv-value">{staff.joinedAt}</span>
                  </div>
                  <div className="support-kv-item">
                    <span className="support-kv-label">Hoạt động gần nhất</span>
                    <span className="support-kv-value">{staff.lastActiveAt}</span>
                  </div>
                  <div className="support-kv-item">
                    <span className="support-kv-label">Trạng thái tài khoản</span>
                    <span className="support-kv-value">
                      {getAccountStatusBadge(staff.accountStatus)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 2: Support Profile */}
              <div className="support-drawer-section">
                <div className="support-section-header">
                  <span className="support-section-title">
                    <Clock size={13} />
                    Hồ sơ hỗ trợ & Phân ca
                  </span>
                </div>
                <div className="support-kv-grid">
                  <div className="support-kv-item" style={{ gridColumn: 'span 2' }}>
                    <span className="support-kv-label">Phạm vi hỗ trợ tiếp nhận</span>
                    <div className="support-scope-pill-row" style={{ marginTop: 4 }}>
                      {staff.supportScopes.map((scope) => (
                        <span key={scope} className="support-scope-mini-tag">
                          {SUPPORT_SCOPE_META[scope]?.label || scope}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="support-kv-item">
                    <span className="support-kv-label">Ca làm việc</span>
                    <span className="support-kv-value">
                      {SUPPORT_SHIFT_META[staff.shift]?.label || staff.shift}
                    </span>
                  </div>
                  <div className="support-kv-item">
                    <span className="support-kv-label">Trạng thái làm việc hiện tại</span>
                    <span className="support-kv-value">
                      {getWorkStatusBadge(staff.workStatus)}
                    </span>
                  </div>
                  {staff.notes && (
                    <div className="support-kv-item" style={{ gridColumn: 'span 2' }}>
                      <span className="support-kv-label">Ghi chú nội bộ</span>
                      <p
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--foreground)',
                          margin: '2px 0 0 0',
                          lineHeight: 1.45,
                          backgroundColor: '#f8fafc',
                          padding: '8px 10px',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        {staff.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Workload & Performance (READ-ONLY 5-KPI Grid) */}
              <div className="support-drawer-section">
                <div className="support-section-header">
                  <span className="support-section-title">
                    <TrendingUp size={13} />
                    Tải công việc & Hiệu suất (Chỉ đọc)
                  </span>
                  <span className="drawer-readonly-badge">Tự động tính từ ticket</span>
                </div>

                <div className="support-kpi-grid">
                  <div className="support-kpi-card highlight">
                    <div className="support-kpi-card-header">
                      <span className="support-kpi-lbl">Ticket đang mở</span>
                      <AlertCircle size={14} style={{ color: '#d97706' }} />
                    </div>
                    <span
                      className="support-kpi-val"
                      style={{ color: staff.performance.openTickets > 0 ? '#d97706' : undefined }}
                    >
                      {staff.performance.openTickets}
                    </span>
                  </div>

                  <div className="support-kpi-card">
                    <div className="support-kpi-card-header">
                      <span className="support-kpi-lbl">Đang xử lý</span>
                      <Activity size={14} style={{ color: 'var(--primary)' }} />
                    </div>
                    <span className="support-kpi-val">
                      {staff.performance.inProgressTickets}
                    </span>
                  </div>

                  <div className="support-kpi-card">
                    <div className="support-kpi-card-header">
                      <span className="support-kpi-lbl">Đã giải quyết</span>
                      <CheckCircle2 size={14} style={{ color: '#16a34a' }} />
                    </div>
                    <span className="support-kpi-val">
                      {staff.performance.resolvedTickets}
                    </span>
                  </div>

                  <div className="support-kpi-card">
                    <div className="support-kpi-card-header">
                      <span className="support-kpi-lbl">Thời gian phản hồi TB</span>
                      <Clock size={14} style={{ color: 'var(--muted)' }} />
                    </div>
                    <span className="support-kpi-val">
                      {staff.performance.avgResponseTime}
                    </span>
                  </div>

                  <div className="support-kpi-card">
                    <div className="support-kpi-card-header">
                      <span className="support-kpi-lbl">Tỷ lệ giải quyết</span>
                      <TrendingUp size={14} style={{ color: '#16a34a' }} />
                    </div>
                    <span className="support-kpi-val" style={{ color: '#16a34a' }}>
                      {staff.performance.resolutionRate}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Recent Activity (READ-ONLY) */}
              <div className="support-drawer-section">
                <div className="support-section-header">
                  <span className="support-section-title">
                    <Activity size={13} />
                    Hoạt động gần nhất
                  </span>
                </div>

                <div className="timeline-list">
                  {staff.recentActivities.map((act) => (
                    <div key={act.id} className="timeline-item">
                      <div className="timeline-dot" />
                      <div className="timeline-action">{act.actionText}</div>
                      <div className="timeline-target">{act.targetName}</div>
                      <div className="timeline-time">{act.timeAgo}</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="support-drawer-footer">
          {isEditing ? (
            <>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEdit}
              >
                <RotateCcw size={13} style={{ display: 'inline', marginRight: 4 }} />
                Hủy chỉnh sửa
              </button>

              <button
                type="submit"
                form="support-staff-edit-form"
                className="btn btn-primary"
              >
                <Save size={13} style={{ display: 'inline', marginRight: 4 }} />
                Lưu thay đổi
              </button>
            </>
          ) : (
            <>
              <div className="drawer-footer-left">
                {staff.accountStatus === 'LOCKED' ? (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onToggleLockAccount(staff)}
                    style={{ color: '#16a34a' }}
                  >
                    <Unlock size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Mở khóa TK
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => onToggleLockAccount(staff)}
                    style={{ color: 'var(--danger)' }}
                  >
                    <Lock size={14} style={{ display: 'inline', marginRight: 4 }} />
                    Khóa tài khoản
                  </button>
                )}
              </div>

              <div className="drawer-footer-right">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => onChangeWorkStatus(staff)}
                >
                  <CalendarCheck size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Đổi trạng thái trực
                </button>

                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleStartEdit}
                >
                  <Edit2 size={14} style={{ display: 'inline', marginRight: 4 }} />
                  Chỉnh sửa
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
