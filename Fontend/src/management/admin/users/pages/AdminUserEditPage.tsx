import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  X,
  AlertCircle,
  RefreshCw,
  User,
  Mail,
  Shield,
  Activity,
  Award,
  Phone,
  FileText,
} from 'lucide-react';
import type { HskLevelCode, UpdateUserDTO, UserDetail, UserRole, UserStatus } from '../types/user.types';
import { adminUserService } from '../services/user.service';
import { ToastNotification, type ToastMessage } from '../../../shared/components';
import '../components/user-management.css';

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
  { value: 'ACTIVE', label: 'Đang hoạt động (ACTIVE)' },
  { value: 'PENDING', label: 'Chờ xác thực (PENDING)' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động (INACTIVE)' },
  { value: 'LOCKED', label: 'Bị khóa (LOCKED)' },
];

const ROLE_OPTIONS: Array<{ value: UserRole; label: string; desc: string }> = [
  { value: 'STUDENT', label: 'Học viên (STUDENT)', desc: 'Học viên học tiếng Trung trên hệ thống' },
  { value: 'TEACHER', label: 'Giáo viên (TEACHER)', desc: 'Giáo viên giảng dạy, tạo bài tập' },
  { value: 'CONTENT_MANAGER', label: 'Quản lý nội dung (CONTENT_MANAGER)', desc: 'Biên tập học liệu, từ vựng, bài học' },
  { value: 'SUPPORT', label: 'Hỗ trợ viên (SUPPORT)', desc: 'Chăm sóc học viên và hỗ trợ kỹ thuật' },
  { value: 'ADMIN', label: 'Quản trị viên (ADMIN)', desc: 'Toàn quyền quản trị hệ thống' },
];

const isSoleAdmin = (email: string) => {
  return email.trim().toLowerCase() === 'admin@gmail.com';
};

export const AdminUserEditPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Form State - Always initialized cleanly per ID
  const [formData, setFormData] = useState<UpdateUserDTO>({
    name: '',
    email: '',
    hskLevel: 'HSK 1',
    status: 'ACTIVE',
    role: 'STUDENT',
    phone: '',
    notes: '',
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Fetch exactly the user belonging to this URL :id
  const fetchUserData = useCallback(async () => {
    if (!id) {
      setLoadError('Mã người dùng không hợp lệ.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setLoadError(null);
    setSaveError(null);
    setFormErrors({});

    try {
      const data = await adminUserService.getUserDetailAsync(id);
      // Verify loaded user matches the route param ID strictly
      if (data.id !== id) {
        throw new Error('Dữ liệu người dùng trả về không khớp với mã yêu cầu.');
      }

      setUser(data);
      // Synchronize form fields strictly with the loaded user
      setFormData({
        name: data.name,
        email: data.email,
        hskLevel: data.hskLevel || 'HSK 1',
        status: data.status,
        role: data.role || (data.roles && data.roles[0]) || 'STUDENT',
        phone: data.phone || '',
        notes: data.notes || '',
      });
    } catch (err: any) {
      setLoadError(err?.message || 'Không thể tải thông tin người dùng từ máy chủ.');
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const validate = (): boolean => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'Họ và tên là bắt buộc.';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Họ và tên phải có ít nhất 2 ký tự.';
    }

    if (!formData.email.trim()) {
      errors.email = 'Địa chỉ email là bắt buộc.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'Địa chỉ email không đúng định dạng.';
    }

    // Security Guard: Prevent assigning ADMIN role to other users
    if (user && !isSoleAdmin(user.email) && formData.role === 'ADMIN') {
      errors.role = 'Hệ thống chỉ duy trì một tài khoản Quản trị viên duy nhất (admin@gmail.com). Không thể cấp vai trò ADMIN cho tài khoản khác.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !user) return;
    if (!validate()) return;

    setIsSaving(true);
    setSaveError(null);

    try {
      const updated = await adminUserService.updateUser(id, {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        hskLevel: formData.hskLevel,
        status: formData.status,
        role: formData.role,
        roles: formData.role ? [formData.role] : user.roles,
        phone: formData.phone?.trim() || undefined,
        notes: formData.notes?.trim() || undefined,
      });

      setToast({
        type: 'success',
        message: `Đã cập nhật thông tin tài khoản ${updated.name} thành công!`,
      });

      // Navigate back to the detail page of the updated user after short delay
      setTimeout(() => {
        navigate(`/management/admin/users/${id}`);
      }, 600);
    } catch (err: any) {
      setSaveError(err?.message || 'Không thể lưu thay đổi người dùng.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="user-management-container" style={{ padding: '40px 0', textAlign: 'center' }}>
        <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--primary)', margin: '0 auto 12px' }} />
        <p style={{ color: 'var(--muted)', fontSize: '14px' }}>Đang tải biểu mẫu chỉnh sửa người dùng...</p>
      </div>
    );
  }

  if (loadError || !user) {
    return (
      <div className="user-management-container">
        <button
          type="button"
          className="ds-btn ds-btn-outline ds-btn-sm"
          onClick={() => navigate('/management/admin/users')}
          style={{ width: 'fit-content' }}
        >
          <ArrowLeft size={16} style={{ marginRight: '6px' }} />
          Quay lại danh sách
        </button>

        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-lg)',
            padding: '24px',
            textAlign: 'center',
            marginTop: '16px',
          }}
        >
          <AlertCircle size={36} style={{ color: '#dc2626', margin: '0 auto 10px' }} />
          <h3 style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', margin: '0 0 6px' }}>
            Lỗi tải dữ liệu người dùng
          </h3>
          <p style={{ fontSize: '13px', color: '#7f1d1d', margin: '0 0 16px' }}>
            {loadError || 'Không thể tìm thấy tài khoản tương ứng với mã định danh trong URL.'}
          </p>
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={() => navigate('/management/admin/users')}
          >
            Quay lại danh sách người dùng
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = isSoleAdmin(user.email);

  return (
    <div className="user-management-container">
      {/* Top Navigation & Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => navigate(`/management/admin/users/${id}`)}
          >
            <ArrowLeft size={16} style={{ marginRight: '6px' }} />
            Quay lại chi tiết
          </button>
          <div style={{ fontSize: '13px', color: 'var(--muted)' }}>
            <span>Quản lý người dùng</span>
            <span style={{ margin: '0 6px' }}>/</span>
            <span>{user.name}</span>
            <span style={{ margin: '0 6px' }}>/</span>
            <strong style={{ color: 'var(--foreground)' }}>Chỉnh sửa</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-sm"
            onClick={() => navigate(`/management/admin/users/${id}`)}
            disabled={isSaving}
          >
            <X size={15} style={{ marginRight: '6px' }} />
            Hủy bỏ
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-primary ds-btn-sm"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            <Save size={15} style={{ marginRight: '6px' }} />
            {isSaving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}
          </button>
        </div>
      </div>

      {/* Hero User Banner */}
      <div
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {user.name.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--foreground)' }}>
            Chỉnh sửa hồ sơ: {user.name}
          </h2>
          <p style={{ fontSize: '12px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
            ID: <code style={{ fontSize: '11px' }}>{user.id}</code> • Email: <strong>{user.email}</strong>
          </p>
        </div>
      </div>

      {/* Global Error Banner */}
      {saveError && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 'var(--radius-md)',
            padding: '12px 16px',
            color: '#dc2626',
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span>{saveError}</span>
        </div>
      )}

      {/* Main Edit Form */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
          {/* 1. Họ và tên */}
          <div className="drawer-form-field">
            <label className="drawer-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={14} style={{ color: 'var(--primary)' }} />
              Họ và tên <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="text"
              className="drawer-form-input"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Nhập họ và tên đầy đủ..."
              disabled={isSaving}
              required
            />
            {formErrors.name && (
              <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '2px' }}>
                ✕ {formErrors.name}
              </span>
            )}
          </div>

          {/* 2. Địa chỉ Email */}
          <div className="drawer-form-field">
            <label className="drawer-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={14} style={{ color: 'var(--primary)' }} />
              Địa chỉ Email <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <input
              type="email"
              className="drawer-form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="user@example.com"
              disabled={isSaving || isAdmin}
              required
            />
            {isAdmin && (
              <span style={{ color: 'var(--muted)', fontSize: '11px', fontStyle: 'italic', marginTop: '2px' }}>
                Tài khoản Quản trị viên hệ thống duy nhất không thể thay đổi địa chỉ email.
              </span>
            )}
            {formErrors.email && (
              <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '2px' }}>
                ✕ {formErrors.email}
              </span>
            )}
          </div>

          {/* 3. Vai trò hệ thống */}
          <div className="drawer-form-field">
            <label className="drawer-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={14} style={{ color: 'var(--primary)' }} />
              Vai trò hệ thống (Role) <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              className="drawer-form-select"
              value={formData.role || 'STUDENT'}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              disabled={isSaving || isAdmin}
            >
              {ROLE_OPTIONS.map((opt) => {
                // If not sole admin, disable ADMIN option
                const disabled = opt.value === 'ADMIN' && !isAdmin;
                return (
                  <option key={opt.value} value={opt.value} disabled={disabled}>
                    {opt.label} {disabled ? '(Không áp dụng)' : ''}
                  </option>
                );
              })}
            </select>
            {isAdmin && (
              <span style={{ color: 'var(--muted)', fontSize: '11px', fontStyle: 'italic', marginTop: '2px' }}>
                Tài khoản Quản trị viên hệ thống duy nhất phải giữ nguyên vai trò ADMIN.
              </span>
            )}
            {formErrors.role && (
              <span style={{ color: 'var(--danger)', fontSize: '11px', marginTop: '2px' }}>
                ✕ {formErrors.role}
              </span>
            )}
          </div>

          {/* 4. Trạng thái tài khoản */}
          <div className="drawer-form-field">
            <label className="drawer-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Activity size={14} style={{ color: 'var(--primary)' }} />
              Trạng thái tài khoản <span style={{ color: 'var(--danger)' }}>*</span>
            </label>
            <select
              className="drawer-form-select"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
              disabled={isSaving || isAdmin}
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {isAdmin && (
              <span style={{ color: 'var(--muted)', fontSize: '11px', fontStyle: 'italic', marginTop: '2px' }}>
                Tài khoản Quản trị viên hệ thống luôn phải ở trạng thái Đang hoạt động (ACTIVE).
              </span>
            )}
          </div>

          {/* 5. Trình độ HSK */}
          <div className="drawer-form-field">
            <label className="drawer-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Award size={14} style={{ color: 'var(--primary)' }} />
              Trình độ HSK hiện tại
            </label>
            <select
              className="drawer-form-select"
              value={formData.hskLevel}
              onChange={(e) => setFormData({ ...formData, hskLevel: e.target.value as HskLevelCode })}
              disabled={isSaving}
            >
              {HSK_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          {/* 6. Số điện thoại */}
          <div className="drawer-form-field">
            <label className="drawer-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Phone size={14} style={{ color: 'var(--primary)' }} />
              Số điện thoại liên hệ
            </label>
            <input
              type="text"
              className="drawer-form-input"
              value={formData.phone || ''}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0912 345 678..."
              disabled={isSaving}
            />
          </div>
        </div>

        {/* 7. Ghi chú quản trị */}
        <div className="drawer-form-field">
          <label className="drawer-form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} style={{ color: 'var(--primary)' }} />
            Ghi chú nội bộ dành cho ban quản trị
          </label>
          <textarea
            className="drawer-form-textarea"
            style={{ height: '90px' }}
            value={formData.notes || ''}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Ghi chú nội bộ về lịch sử hỗ trợ, yêu cầu nâng cấp, xác thực hồ sơ..."
            disabled={isSaving}
          />
        </div>

        {/* Bottom Form Action Buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '12px',
            paddingTop: '16px',
            borderTop: '1px solid var(--border)',
          }}
        >
          <button
            type="button"
            className="ds-btn ds-btn-outline ds-btn-md"
            onClick={() => navigate(`/management/admin/users/${id}`)}
            disabled={isSaving}
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="ds-btn ds-btn-primary ds-btn-md"
            disabled={isSaving}
          >
            <Save size={16} style={{ marginRight: '8px' }} />
            {isSaving ? 'Đang lưu thay đổi...' : 'Lưu thay đổi'}
          </button>
        </div>
      </form>

      {/* Toast Notification */}
      <ToastNotification toast={toast} onClose={() => setToast(null)} />
    </div>
  );
};

export default AdminUserEditPage;
