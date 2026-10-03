import React, { useState } from 'react';
import { User, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthCard } from './AuthCard';
import { AuthHeader } from './AuthHeader';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { PasswordStrength } from './PasswordStrength';
import { SocialLoginButton } from './SocialLoginButton';
import { AuthDivider } from './AuthDivider';
import { useAuth } from '../hooks/useAuth';
import { usePasswordStrength } from '../hooks/usePasswordStrength';
import type { AuthUser, RegisterRequest } from '../types/auth.types';

export interface RegisterFormProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onNavigateToLogin,
}) => {
  const { isSubmitting, apiError, apiSuccess, register, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState<RegisterRequest>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });

  const [errors, setErrors] = useState<{
    fullName?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});

  const passwordStrength = usePasswordStrength(formData.password);

  const validate = (): boolean => {
    const newErrors: {
      fullName?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      agreeTerms?: string;
    } = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên.';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = 'Email không đúng định dạng.';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu.';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Mật khẩu phải có ít nhất 8 ký tự.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp.';
    }

    if (!formData.agreeTerms) {
      newErrors.agreeTerms = 'Vui lòng đồng ý với Điều khoản dịch vụ và Chính sách bảo mật.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    register(formData, onSuccess);
  };

  const handleGoogleAuth = () => {
    loginWithGoogle(onSuccess);
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Bắt đầu hành trình học tiếng Trung"
        subtitle="Tạo tài khoản miễn phí và bắt đầu học ngay hôm nay."
      />

      {/* Social Google Signup Button */}
      <SocialLoginButton
        text="Đăng ký với Google"
        onClick={handleGoogleAuth}
        isLoading={isSubmitting}
        disabled={isSubmitting}
      />

      <AuthDivider text="hoặc đăng ký bằng email" />

      {/* API Feedback Alerts */}
      {apiError && (
        <div
          role="alert"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '10px 14px',
            backgroundColor: 'var(--danger-bg)',
            border: '1px solid var(--danger-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--danger)',
            fontSize: 'var(--text-xs)',
            fontWeight: 500,
            marginBottom: 'var(--space-4)',
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{apiError}</span>
        </div>
      )}

      {apiSuccess && (
        <div
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--space-2)',
            padding: '10px 14px',
            backgroundColor: 'var(--success-bg)',
            border: '1px solid var(--success-border)',
            borderRadius: 'var(--radius-lg)',
            color: 'var(--success)',
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            marginBottom: 'var(--space-4)',
          }}
        >
          <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
          <span>{apiSuccess}</span>
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
        {/* Full Name */}
        <AuthInput
          id="register-fullname"
          label="Họ và tên"
          type="text"
          isRequired
          placeholder="Ví dụ: Nguyễn Văn A"
          value={formData.fullName}
          onChange={(e) => {
            setFormData({ ...formData, fullName: e.target.value });
            if (errors.fullName) setErrors({ ...errors, fullName: undefined });
          }}
          error={errors.fullName}
          iconLeft={<User size={16} />}
          disabled={isSubmitting}
          autoComplete="name"
        />

        {/* Email */}
        <AuthInput
          id="register-email"
          label="Email học tập"
          type="email"
          isRequired
          placeholder="ban@example.com"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          error={errors.email}
          iconLeft={<Mail size={16} />}
          disabled={isSubmitting}
          autoComplete="email"
        />

        {/* Password */}
        <div>
          <PasswordInput
            id="register-password"
            label="Mật khẩu"
            isRequired
            placeholder="Tối thiểu 8 ký tự"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="new-password"
          />

          {formData.password && (
            <PasswordStrength strength={passwordStrength} showChecklist={true} />
          )}
        </div>

        {/* Confirm Password */}
        <PasswordInput
          id="register-confirm-password"
          label="Xác nhận mật khẩu"
          isRequired
          placeholder="Nhập lại mật khẩu vừa tạo"
          value={formData.confirmPassword}
          onChange={(e) => {
            setFormData({ ...formData, confirmPassword: e.target.value });
            if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
          }}
          error={errors.confirmPassword}
          disabled={isSubmitting}
          autoComplete="new-password"
        />

        {/* Terms Agreement Checkbox */}
        <div style={{ marginTop: 'var(--space-1)' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: '13px',
              color: 'var(--foreground)',
              lineHeight: 1.45,
            }}
          >
            <input
              type="checkbox"
              checked={formData.agreeTerms}
              onChange={(e) => {
                setFormData({ ...formData, agreeTerms: e.target.checked });
                if (errors.agreeTerms) setErrors({ ...errors, agreeTerms: undefined });
              }}
              disabled={isSubmitting}
              style={{
                width: '16px',
                height: '16px',
                marginTop: '2px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            />
            <span>
              Tôi đồng ý với{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Điều khoản dịch vụ</span>{' '}
              và{' '}
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>Chính sách bảo mật</span>{' '}
              của ZhongWenHub.
            </span>
          </label>
          {errors.agreeTerms && (
            <p className="ds-error-text" role="alert" style={{ marginTop: '4px' }}>
              {errors.agreeTerms}
            </p>
          )}
        </div>

        {/* Primary CTA */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="ds-btn ds-btn-primary"
          style={{
            width: '100%',
            minHeight: '44px',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            marginTop: 'var(--space-2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
          }}
        >
          <span>{isSubmitting ? 'Đang tạo tài khoản...' : 'Tạo tài khoản'}</span>
          {!isSubmitting && <ArrowRight size={16} />}
        </button>
      </form>

      {/* Footer Switcher */}
      <div
        style={{
          marginTop: 'var(--space-4)',
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-1)',
        }}
      >
        <span>Đã có tài khoản?</span>
        <button
          type="button"
          onClick={onNavigateToLogin}
          className="ds-btn ds-btn-ghost"
          style={{
            padding: 0,
            height: 'auto',
            minHeight: 'auto',
            fontSize: 'var(--text-sm)',
            color: 'var(--primary)',
            fontWeight: 700,
          }}
        >
          Đăng nhập
        </button>
      </div>
    </AuthCard>
  );
};
