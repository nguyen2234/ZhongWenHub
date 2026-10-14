import React, { useState } from 'react';
import { Info, UserPlus } from 'lucide-react';
import { Modal } from '../../../../design-system';
import type {
  CreateSupportStaffDTO,
  SupportScope,
  SupportShift,
  SupportWorkStatus,
} from '../types/support-staff.types';
import {
  ALL_SUPPORT_SCOPES,
  ALL_SUPPORT_SHIFTS,
  SUPPORT_SCOPE_META,
  SUPPORT_SHIFT_META,
} from '../types/support-staff.types';
import { adminSupportStaffService } from '../services/support-staff.service';

export interface CreateSupportStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateSupportStaffDTO) => void;
}

export const CreateSupportStaffModal: React.FC<CreateSupportStaffModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateSupportStaffDTO>({
    name: '',
    email: '',
    phone: '',
    supportScopes: ['ACCOUNT', 'TECHNICAL'],
    shift: 'MORNING',
    initialWorkStatus: 'AVAILABLE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleToggleScope = (scope: SupportScope) => {
    setFormData((prev) => {
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

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!formData.name.trim()) {
      errs.name = 'Vui lòng nhập họ và tên nhân viên.';
    }

    const trimmedEmail = formData.email.trim();
    if (!trimmedEmail) {
      errs.email = 'Vui lòng nhập địa chỉ email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errs.email = 'Địa chỉ email không đúng định dạng.';
    } else if (adminSupportStaffService.isEmailTaken(trimmedEmail)) {
      errs.email = 'Email này đã tồn tại trong hệ thống.';
    }

    if (formData.supportScopes.length === 0) {
      errs.supportScopes = 'Vui lòng chọn ít nhất 1 phạm vi hỗ trợ phụ trách.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit(formData);
    onClose();

    // Reset form
    setFormData({
      name: '',
      email: '',
      phone: '',
      supportScopes: ['ACCOUNT', 'TECHNICAL'],
      shift: 'MORNING',
      initialWorkStatus: 'AVAILABLE',
    });
    setErrors({});
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm nhân viên hỗ trợ mới">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }} noValidate>
        {/* Name and Email */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="drawer-edit-field">
            <label className="drawer-edit-label">
              Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="drawer-edit-input"
              placeholder="VD: Đặng Minh Châu"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
            />
            {errors.name && (
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.name}</span>
            )}
          </div>

          <div className="drawer-edit-field">
            <label className="drawer-edit-label">
              Email công tác <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="email"
              className="drawer-edit-input"
              placeholder="chau.dang@zhongwenhub.edu.vn"
              value={formData.email}
              onChange={(e) => {
                setFormData({ ...formData, email: e.target.value });
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
            />
            {errors.email && (
              <span style={{ fontSize: '11px', color: 'var(--danger)' }}>{errors.email}</span>
            )}
          </div>
        </div>

        {/* Phone & Shift */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
          <div className="drawer-edit-field">
            <label className="drawer-edit-label">Số điện thoại liên hệ</label>
            <input
              type="tel"
              className="drawer-edit-input"
              placeholder="0912 345 678"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <div className="drawer-edit-field">
            <label className="drawer-edit-label">Ca làm việc phân công</label>
            <select
              className="drawer-edit-select"
              value={formData.shift}
              onChange={(e) =>
                setFormData({ ...formData, shift: e.target.value as SupportShift })
              }
            >
              {ALL_SUPPORT_SHIFTS.map((sh) => (
                <option key={sh} value={sh}>
                  {SUPPORT_SHIFT_META[sh]?.label || sh}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Support Scopes (Multi-select) */}
        <div className="drawer-edit-field">
          <label className="drawer-edit-label">
            Phạm vi hỗ trợ tiếp nhận <span style={{ color: 'var(--danger)' }}>*</span>
          </label>
          <div className="pill-selector-grid">
            {ALL_SUPPORT_SCOPES.map((scope) => {
              const isSelected = formData.supportScopes.includes(scope);
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

        {/* Initial Work Status */}
        <div className="drawer-edit-field">
          <label className="drawer-edit-label">Trạng thái trực ban đầu</label>
          <select
            className="drawer-edit-select"
            value={formData.initialWorkStatus}
            onChange={(e) =>
              setFormData({
                ...formData,
                initialWorkStatus: e.target.value as SupportWorkStatus,
              })
            }
          >
            <option value="AVAILABLE">Đang sẵn sàng</option>
            <option value="BUSY">Đang bận</option>
            <option value="OFF_DUTY">Hết ca / Ngoại tuyến</option>
            <option value="ON_LEAVE">Nghỉ phép</option>
          </select>
        </div>

        {/* Notice of Account Status = PENDING & No Manual Password */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            padding: '10px 12px',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.2)',
            borderRadius: 'var(--radius-md)',
            fontSize: '11px',
            color: '#1d4ed8',
            lineHeight: 1.45,
          }}
        >
          <Info size={15} style={{ flexShrink: 0, marginTop: '2px' }} />
          <span>
            Hồ sơ sẽ được tạo với trạng thái tài khoản ban đầu là <strong>Chờ kích hoạt (PENDING)</strong>.
            Hệ thống sẽ gửi email lời mời kèm liên kết thiết lập mật khẩu bảo mật đến hòm thư của nhân viên.
          </span>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Hủy bỏ
          </button>
          <button type="submit" className="btn btn-primary">
            <UserPlus size={14} style={{ display: 'inline', marginRight: 4 }} />
            Tạo nhân viên hỗ trợ
          </button>
        </div>
      </form>
    </Modal>
  );
};
