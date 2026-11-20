import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, Sparkles, Check, AlertCircle } from 'lucide-react';
import type { UserListItem } from '../types/user.types';
import { generateSecureRandomPassword } from '../services/user.service';

export interface ResetPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserListItem | null;
  onConfirm: (userId: string, newPassword: string, confirmPassword: string) => Promise<void>;
}

export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  isOpen,
  onClose,
  user,
  onConfirm,
}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setShowPassword(false);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const isSoleAdmin = user.email.toLowerCase() === 'admin@gmail.com';

  const handleGeneratePassword = () => {
    const pwd = generateSecureRandomPassword();
    setNewPassword(pwd);
    setConfirmPassword(pwd);
    setShowPassword(true);
    setError(null);
  };

  const hasMinLength = newPassword.length >= 8;
  const hasUpper = /[A-Z]/.test(newPassword);
  const hasLower = /[a-z]/.test(newPassword);
  const hasDigit = /[0-9]/.test(newPassword);
  const isMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const isValid = hasMinLength && hasUpper && hasLower && hasDigit && isMatch && !isSoleAdmin;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    try {
      setIsSubmitting(true);
      setError(null);
      await onConfirm(user.id, newPassword, confirmPassword);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Không thể đặt lại mật khẩu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.55)',
        backdropFilter: 'blur(3px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-password-title"
    >
      <div
        style={{
          backgroundColor: 'var(--surface, #ffffff)',
          border: '1px solid var(--border, #e2e8f0)',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '480px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
              }}
            >
              <KeyRound size={18} />
            </div>
            <div>
              <h3 id="reset-password-title" style={{ fontSize: '15px', fontWeight: 700, margin: 0 }}>
                Đặt lại mật khẩu người dùng
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--muted, #64748b)', margin: 0 }}>
                {user.name} ({user.email})
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {isSoleAdmin ? (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#dc2626',
                fontSize: '12px',
                marginBottom: '16px',
              }}
            >
              <AlertCircle size={18} />
              <span>
                Không thể đặt lại mật khẩu cho tài khoản Quản trị viên hệ thống duy nhất qua giao diện này vì lý do bảo mật.
              </span>
            </div>
          ) : null}

          {error && (
            <div
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                padding: '10px 12px',
                color: '#dc2626',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              ✕ {error}
            </div>
          )}

          {/* Random password generator */}
          <div style={{ marginBottom: '14px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              className="ds-btn ds-btn-outline ds-btn-sm"
              onClick={handleGeneratePassword}
              disabled={isSoleAdmin || isSubmitting}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
            >
              <Sparkles size={14} style={{ color: '#d97706' }} />
              Sinh mật khẩu mạnh ngẫu nhiên
            </button>
          </div>

          {/* New password input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Mật khẩu mới *
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="drawer-form-input"
                style={{ width: '100%', paddingRight: '38px', boxSizing: 'border-box' }}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)..."
                disabled={isSoleAdmin || isSubmitting}
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--muted, #64748b)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                }}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Confirm password input */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>
              Xác nhận mật khẩu mới *
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              className="drawer-form-input"
              style={{ width: '100%', boxSizing: 'border-box' }}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Nhập lại mật khẩu mới..."
              disabled={isSoleAdmin || isSubmitting}
            />
          </div>

          {/* Requirements Checklist */}
          <div
            style={{
              backgroundColor: 'var(--surface-hover, #f8fafc)',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '11px',
              color: 'var(--muted, #64748b)',
              marginBottom: '16px',
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: '4px' }}>Yêu cầu mật khẩu chuẩn Identity:</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
              <span style={{ color: hasMinLength ? '#16a34a' : 'inherit' }}>
                {hasMinLength ? '✓' : '•'} Tối thiểu 8 ký tự
              </span>
              <span style={{ color: hasUpper ? '#16a34a' : 'inherit' }}>
                {hasUpper ? '✓' : '•'} Có chữ in hoa (A-Z)
              </span>
              <span style={{ color: hasLower ? '#16a34a' : 'inherit' }}>
                {hasLower ? '✓' : '•'} Có chữ thường (a-z)
              </span>
              <span style={{ color: hasDigit ? '#16a34a' : 'inherit' }}>
                {hasDigit ? '✓' : '•'} Có chữ số (0-9)
              </span>
              <span style={{ color: isMatch ? '#16a34a' : 'inherit', gridColumn: 'span 2' }}>
                {isMatch ? '✓' : '•'} Mật khẩu xác nhận trùng khớp
              </span>
            </div>
          </div>

          {/* Footer actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
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
              disabled={!isValid || isSubmitting || isSoleAdmin}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              {isSubmitting ? (
                <span>Đang lưu...</span>
              ) : (
                <>
                  <Check size={14} />
                  <span>Xác nhận đổi mật khẩu</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
