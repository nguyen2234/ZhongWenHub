import React, { useState } from 'react';
import {
  Shield,
  Palette,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Globe,
} from 'lucide-react';

export const AdminSystemSettingsView: React.FC = () => {
  const [platformName, setPlatformName] = useState('ZhongWenHub (中文社)');
  const [contactEmail, setContactEmail] = useState('admin@zhongwenhub.edu.vn');
  const [slogan, setSlogan] = useState('Nền tảng đào tạo HSK và Tiếng Trung Thương mại Thông minh');
  const [defaultLanguage, setDefaultLanguage] = useState('vi-VN');
  const [timezone, setTimezone] = useState('Asia/Ho_Chi_Minh');

  // Security policies
  const [maxAttempts, setMaxAttempts] = useState(5);
  const [sessionTimeoutMin, setSessionTimeoutMin] = useState(60);
  const [require2FA, setRequire2FA] = useState(false);

  // Notifications
  const [systemNotice, setSystemNotice] = useState(
    'Hệ thống sẽ tiến hành nâng cấp thuật toán AI Tutor vào 02:00 sáng ngày 01/11.'
  );

  // Maintenance mode
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingMaintenanceState, setPendingMaintenanceState] = useState(false);

  // Save feedback
  const [isSaved, setIsSaved] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleFieldChange = (setter: any, value: any) => {
    setter(value);
    setHasChanges(true);
    setIsSaved(false);
  };

  const handleMaintenanceToggle = (checked: boolean) => {
    setPendingMaintenanceState(checked);
    setShowConfirmModal(true);
  };

  const confirmMaintenanceChange = () => {
    setIsMaintenanceMode(pendingMaintenanceState);
    setShowConfirmModal(false);
    setHasChanges(true);
    setIsSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setHasChanges(false);
    setTimeout(() => setIsSaved(false), 4000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
      {/* Disclaimer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          fontSize: '12.5px',
          lineHeight: 1.5,
        }}
      >
        <Shield size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#2563eb' }} />
        <div>
          <strong>Cấu hình mô phỏng (Demo Configuration):</strong> Mọi thiết lập trên trang này có giá trị minh họa giao diện quản trị trong phiên làm việc của trình duyệt. Không áp dụng thay đổi vật lý lên tường lửa máy chủ Linux hoặc cơ sở dữ liệu PostgreSQL.
        </div>
      </div>

      {/* Maintenance Mode Alert Banner if enabled */}
      {isMaintenanceMode && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#b45309',
            fontSize: '13px',
            fontWeight: 600,
          }}
        >
          <AlertTriangle size={18} />
          <span>Hệ thống đang ở trạng thái BẢO TRÌ MÔ PHỎNG. Người dùng thông thường sẽ thấy trang thông báo bảo trì.</span>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
        {/* Section 1: Platform Information */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Globe size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
              1. Thông tin Nền tảng & Định danh
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Tên nền tảng hiển thị <span style={{ color: 'var(--primary)' }}>*</span>
              </label>
              <input
                type="text"
                required
                value={platformName}
                onChange={(e) => handleFieldChange(setPlatformName, e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Email liên hệ hỗ trợ / Quản trị
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={(e) => handleFieldChange(setContactEmail, e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Khẩu hiệu thương hiệu (Slogan)
            </label>
            <input
              type="text"
              value={slogan}
              onChange={(e) => handleFieldChange(setSlogan, e.target.value)}
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '13px',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Ngôn ngữ giao diện mặc định
              </label>
              <select
                value={defaultLanguage}
                onChange={(e) => handleFieldChange(setDefaultLanguage, e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              >
                <option value="vi-VN">Tiếng Việt (vi-VN)</option>
                <option value="zh-CN">Tiếng Trung giản thể (zh-CN)</option>
                <option value="en-US">English (en-US)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Múi giờ hệ thống
              </label>
              <select
                value={timezone}
                onChange={(e) => handleFieldChange(setTimezone, e.target.value)}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 10px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              >
                <option value="Asia/Ho_Chi_Minh">Giờ Hà Nội (GMT+7)</option>
                <option value="Asia/Shanghai">Giờ Bắc Kinh / Thượng Hải (GMT+8)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Branding Settings */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Palette size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
              2. Bộ Nhận diện Thương hiệu (Brand Identity)
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            {/* Color Palette Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#E60012',
                  boxShadow: '0 2px 8px rgba(230, 0, 18, 0.3)',
                }}
              />
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>Màu chủ đạo (Viettel Red)</strong>
                <div style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'monospace' }}>#E60012</div>
              </div>
            </div>

            {/* Seal Logo Preview */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-hanzi)',
                  fontWeight: 800,
                  fontSize: '22px',
                  boxShadow: '0 2px 8px rgba(230, 0, 18, 0.3)',
                }}
              >
                华
              </div>
              <div>
                <strong style={{ fontSize: '13px', color: 'var(--foreground)' }}>Dấu ấn Hán tự (Chinese Seal)</strong>
                <div style={{ fontSize: '12px', color: 'var(--muted)' }}>Biểu tượng độc quyền ZhongWenHub</div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Security & Session Policies */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Lock size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
              3. Chính sách Tài khoản & An toàn (Account Policy Mock)
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Số lần đăng nhập sai tối đa trước khi khoá tạm (lần)
              </label>
              <input
                type="number"
                min={1}
                max={20}
                value={maxAttempts}
                onChange={(e) => handleFieldChange(setMaxAttempts, Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
                Thời gian hết hạn phiên làm việc không thao tác (phút)
              </label>
              <input
                type="number"
                min={15}
                max={480}
                value={sessionTimeoutMin}
                onChange={(e) => handleFieldChange(setSessionTimeoutMin, Number(e.target.value))}
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-strong)',
                  backgroundColor: 'var(--surface)',
                  color: 'var(--foreground)',
                  fontSize: '13px',
                }}
              />
            </div>
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={require2FA}
              onChange={(e) => handleFieldChange(setRequire2FA, e.target.checked)}
              style={{ accentColor: 'var(--primary)' }}
            />
            <span>Bắt buộc xác thực hai yếu tố (2FA) đối với tài khoản Admin và Giáo viên</span>
          </label>
        </div>

        {/* Section 4: System Notice & Maintenance Mode */}
        <div
          style={{
            padding: '20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
            <Bell size={18} style={{ color: 'var(--primary)' }} />
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--foreground)' }}>
              4. Thông báo Hệ thống & Chế độ Bảo trì
            </h3>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: 'var(--foreground)', marginBottom: '4px' }}>
              Nội dung thông báo nổi trên toàn bộ cổng học viên
            </label>
            <textarea
              rows={2}
              value={systemNotice}
              onChange={(e) => handleFieldChange(setSystemNotice, e.target.value)}
              placeholder="Nhập thông báo hiển thị trên banner..."
              style={{
                width: '100%',
                padding: '8px 12px',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                fontSize: '13px',
              }}
            />
          </div>

          <div
            style={{
              padding: '14px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: isMaintenanceMode ? '#fffbeb' : 'var(--background)',
              border: `1px solid ${isMaintenanceMode ? '#fde68a' : 'var(--border)'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              flexWrap: 'wrap',
            }}
          >
            <div>
              <strong style={{ fontSize: '13.5px', color: isMaintenanceMode ? '#b45309' : 'var(--foreground)' }}>
                Kích hoạt chế độ bảo trì hệ thống (Maintenance Mode Simulation)
              </strong>
              <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '2px' }}>
                Khi bật, chỉ tài khoản Admin mới có thể đăng nhập. Học viên và giáo viên sẽ thấy trang bảo trì.
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
              <input
                type="checkbox"
                checked={isMaintenanceMode}
                onChange={(e) => handleMaintenanceToggle(e.target.checked)}
                style={{ accentColor: 'var(--primary)', width: '18px', height: '18px' }}
              />
              <span style={{ fontWeight: 700, color: isMaintenanceMode ? '#b45309' : 'var(--muted)' }}>
                {isMaintenanceMode ? 'ĐANG BẬT BẢO TRÌ' : 'Tắt'}
              </span>
            </label>
          </div>
        </div>

        {/* Submit Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-xl)',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div>
            {hasChanges && (
              <span style={{ fontSize: '12.5px', color: '#b45309', fontWeight: 600 }}>
                Bạn có thay đổi chưa lưu trong phiên này.
              </span>
            )}
            {isSaved && (
              <span style={{ fontSize: '12.5px', color: '#16a34a', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={15} /> Đã áp dụng thiết lập demo thành công trong phiên hiện tại!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="submit"
              className="ds-btn ds-btn-primary"
              style={{ gap: '6px' }}
            >
              <CheckCircle2 size={16} /> Lưu & Áp dụng thiết lập
            </button>
          </div>
        </div>
      </form>

      {/* Maintenance Confirmation Dialog */}
      {showConfirmModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="maint-dialog-title"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 'var(--z-modal)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-4)',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--surface)',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid var(--border-strong)',
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#fffbeb',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AlertTriangle size={20} />
              </div>
              <h3 id="maint-dialog-title" style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--foreground)' }}>
                {pendingMaintenanceState ? 'Xác nhận BẬT chế độ bảo trì mô phỏng?' : 'Xác nhận TẮT chế độ bảo trì?'}
              </h3>
            </div>

            <p style={{ margin: 0, fontSize: '13px', color: 'var(--muted)', lineHeight: 1.5 }}>
              {pendingMaintenanceState
                ? 'Trong chế độ bảo trì mô phỏng, giao diện sẽ kích hoạt cờ bảo trì trên toàn bộ các route học viên và giáo viên trong phiên thử nghiệm này.'
                : 'Thao tác này sẽ đưa cổng thông tin trở lại trạng thái hoạt động bình thường.'}
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="ds-btn ds-btn-secondary"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={confirmMaintenanceChange}
                className={`ds-btn ${pendingMaintenanceState ? 'ds-btn-danger' : 'ds-btn-primary'}`}
              >
                {pendingMaintenanceState ? 'Bật bảo trì' : 'Tắt bảo trì'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AdminSystemSettingsView;
