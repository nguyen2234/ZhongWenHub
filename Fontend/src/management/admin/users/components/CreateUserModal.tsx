import React, { useState } from 'react';
import { Modal } from '../../../../design-system';
import type { CreateUserDTO, HskLevelCode, UserStatus } from '../types/user.types';

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateUserDTO) => void;
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

export const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<CreateUserDTO>({
    name: '',
    email: '',
    initialHsk: 'HSK 1',
    status: 'ACTIVE',
    notes: '',
  });
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Vui lòng nhập họ và tên học viên.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    try {
      onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        initialHsk: 'HSK 1',
        status: 'ACTIVE',
        notes: '',
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi khi tạo tài khoản.');
      }
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm học viên mới">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '11px',
              fontWeight: 600,
            }}
          >
            ✕ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
            Họ và tên học viên *
          </label>
          <input
            type="text"
            className="drawer-form-input"
            placeholder="Ví dụ: Lê Hoàng Nam"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
            Địa chỉ Email *
          </label>
          <input
            type="email"
            className="drawer-form-input"
            placeholder="Ví dụ: nam.le@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
              Trình độ HSK ban đầu
            </label>
            <select
              className="drawer-form-select"
              value={formData.initialHsk}
              onChange={(e) =>
                setFormData({ ...formData, initialHsk: e.target.value as HskLevelCode })
              }
            >
              {HSK_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
              Trạng thái tài khoản
            </label>
            <select
              className="drawer-form-select"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as UserStatus })
              }
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="PENDING">Chờ xác thực</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--foreground)' }}>
            Ghi chú nội bộ
          </label>
          <textarea
            className="drawer-form-textarea"
            placeholder="Ghi chú về nguồn đăng ký hoặc chương trình học..."
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
          ℹ️ Thông tin đăng nhập sẽ được xử lý bởi hệ thống xác thực khi backend được tích hợp.
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '8px',
            marginTop: '8px',
            paddingTop: '12px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={onClose}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="ds-btn ds-btn-primary ds-btn-sm"
          >
            Tạo người dùng
          </button>
        </div>
      </form>
    </Modal>
  );
};
