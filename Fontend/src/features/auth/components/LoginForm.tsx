import React, { useState } from 'react';
import { Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { AuthCard } from './AuthCard';
import { AuthHeader } from './AuthHeader';
import { AuthInput } from './AuthInput';
import { PasswordInput } from './PasswordInput';
import { SocialLoginButton } from './SocialLoginButton';
import { AuthDivider } from './AuthDivider';
import { useAuth } from '../hooks/useAuth';
import type { AuthUser, LoginRequest } from '../types/auth.types';

export interface LoginFormProps {
  onSuccess: (user: AuthUser) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
}) => {
  const { isSubmitting, apiError, apiSuccess, login, loginWithGoogle } = useAuth();

  const [formData, setFormData] = useState<LoginRequest>({
    email: '',
    password: '',
    rememberMe: true,
  });

  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = (): boolean => {
    const newErrors: { email?: string; password?: string } = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    login(formData, onSuccess);
  };

  const handleGoogleAuth = () => {
    loginWithGoogle(onSuccess);
  };

  return (
    <AuthCard>
      <AuthHeader
        title="Chào mừng bạn trở lại 👋"
        subtitle="Tiếp tục hành trình chinh phục tiếng Trung của bạn."
      />

      {/* Social Google Login Button */}
      <SocialLoginButton
        text="Tiếp tục với Google"
        onClick={handleGoogleAuth}
        isLoading={isSubmitting}
        disabled={isSubmitting}
      />

      <AuthDivider text="hoặc tiếp tục bằng email" />

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

      {/* Main Email / Password Form */}
      <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        <AuthInput
          id="login-email"
          label="Email"
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

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
            <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--foreground)' }}>
              Mật khẩu <span style={{ color: 'var(--danger)' }}>*</span>
            </span>
            <button
              type="button"
              onClick={onNavigateToForgotPassword}
              className="ds-btn ds-btn-ghost"
              style={{
                padding: 0,
                height: 'auto',
                minHeight: 'auto',
                fontSize: 'var(--text-xs)',
                color: 'var(--primary)',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Quên mật khẩu?
            </button>
          </div>

          <PasswordInput
            id="login-password"
            label=""
            placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            disabled={isSubmitting}
            autoComplete="current-password"
          />
        </div>

        {/* Remember me option */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '-4px' }}>
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              cursor: 'pointer',
              userSelect: 'none',
              fontSize: 'var(--text-sm)',
              color: 'var(--foreground)',
            }}
          >
            <input
              type="checkbox"
              checked={formData.rememberMe}
              onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
              disabled={isSubmitting}
              style={{
                width: '16px',
                height: '16px',
                accentColor: 'var(--primary)',
                cursor: 'pointer',
              }}
            />
            <span>Ghi nhớ đăng nhập</span>
          </label>
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
            marginTop: 'var(--space-1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
            boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
          }}
        >
          <span>{isSubmitting ? 'Đang xác thực...' : 'Đăng nhập'}</span>
          {!isSubmitting && <ArrowRight size={16} />}
        </button>
      </form>

      {/* Footer Switcher */}
      <div
        style={{
          marginTop: 'var(--space-5)',
          textAlign: 'center',
          fontSize: 'var(--text-sm)',
          color: 'var(--muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-1)',
        }}
      >
        <span>Chưa có tài khoản?</span>
        <button
          type="button"
          onClick={onNavigateToRegister}
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
          Đăng ký ngay
        </button>
      </div>
    </AuthCard>
  );
};
