import React, { useState } from 'react';
import { Modal } from '../../../../design-system';
import type { CreateUserDTO, HskLevelCode, UserRole, UserStatus } from '../types/user.types';

export interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (dto: CreateUserDTO) => Promise<void> | void;
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

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; desc: string }> = [
  { value: 'STUDENT', label: 'Học viên (Student)', desc: 'Tham gia học tập, luyện tập và làm bài tập' },
  { value: 'TEACHER', label: 'Giáo viên (Teacher)', desc: 'Giảng dạy, quản lý lớp và chấm điểm' },
  { value: 'CONTENT_MANAGER', label: 'Quản lý nội dung (Content Manager)', desc: 'Biên soạn, kiểm duyệt giáo trình và học liệu' },
  { value: 'SUPPORT', label: 'Hỗ trợ viên (Support)', desc: 'Tiếp nhận và giải quyết yêu cầu hỗ trợ học viên' },
  { value: 'ADMIN', label: 'Quản trị viên (Admin)', desc: 'Toàn quyền cấu hình, vận hành và quản lý tài khoản' },
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
    role: 'STUDENT',
    password: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Vui lòng nhập họ và tên người dùng.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Mật khẩu khởi tạo phải có tối thiểu 6 ký tự.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      // Reset form on success
      setFormData({
        name: '',
        email: '',
        initialHsk: 'HSK 1',
        status: 'ACTIVE',
        role: 'STUDENT',
        password: '',
        notes: '',
      });
      onClose();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Đã xảy ra lỗi khi tạo tài khoản.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Thêm tài khoản người dùng / nhân viên">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              color: 'var(--danger)',
              borderRadius: 'var(--radius-md)',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            ✕ {error}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
            Họ và tên *
          </label>
          <input
            type="text"
            className="drawer-form-input"
            placeholder="Ví dụ: Lê Hoàng Nam"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
            Địa chỉ Email *
          </label>
          <input
            type="email"
            className="drawer-form-input"
            placeholder="Ví dụ: nam.le@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            disabled={isSubmitting}
          />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
              Vai trò (Role) *
            </label>
            <select
              className="drawer-form-select"
              value={formData.role}
              onChange={(e) =>
                setFormData({ ...formData, role: e.target.value as UserRole })
              }
              disabled={isSubmitting}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
              Trạng thái tài khoản
            </label>
            <select
              className="drawer-form-select"
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value as UserStatus })
              }
              disabled={isSubmitting}
            >
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="PENDING">Chờ xác thực</option>
              <option value="INACTIVE">Ngưng hoạt động</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
              Mật khẩu khởi tạo
            </label>
            <input
              type="password"
              className="drawer-form-input"
              placeholder="Mặc định: UserPassword123!"
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              disabled={isSubmitting}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
              Trình độ HSK ban đầu
            </label>
            <select
              className="drawer-form-select"
              value={formData.initialHsk}
              onChange={(e) =>
                setFormData({ ...formData, initialHsk: e.target.value as HskLevelCode })
              }
              disabled={isSubmitting}
            >
              {HSK_OPTIONS.map((lvl) => (
                <option key={lvl} value={lvl}>
                  {lvl}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--foreground)' }}>
            Ghi chú nội bộ
          </label>
          <textarea
            className="drawer-form-textarea"
            placeholder="Ghi chú về chức vụ hoặc bộ phận phân công..."
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            disabled={isSubmitting}
          />
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
            disabled={isSubmitting}
          >
            Hủy
          </button>
          <button
            type="submit"
            className="ds-btn ds-btn-primary ds-btn-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </div>
      </form>
    </Modal>
  );
};
