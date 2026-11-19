import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Mail, KeyRound, ArrowLeft, CheckCircle2, AlertCircle, Check } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthInput } from '../components/AuthInput';
import { PasswordInput } from '../components/PasswordInput';
import { PasswordStrength } from '../components/PasswordStrength';
import { useAuth } from '../hooks/useAuth';
import { usePasswordStrength } from '../hooks/usePasswordStrength';

export interface ResetPasswordPageProps {
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard') => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onNavigate: customNav }) => {
  const routerNavigate = useNavigate();
  const onNavigate = customNav ?? ((r) => routerNavigate(`/${r}`));
  const [searchParams] = useSearchParams();

  const initialEmail = searchParams.get('email') || '';
  const initialToken = searchParams.get('token') || '';

  const [email, setEmail] = useState(initialEmail);
  const [token, setToken] = useState(initialToken);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [emailError, setEmailError] = useState<string | undefined>();
  const [tokenError, setTokenError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | undefined>();
  const [isSuccess, setIsSuccess] = useState(false);

  const { isSubmitting, apiError, apiSuccess, resetPassword } = useAuth();
  const strengthResult = usePasswordStrength(password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let hasError = false;

    if (!email.trim()) {
      setEmailError('Vui lòng nhập địa chỉ email.');
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Email không đúng định dạng.');
      hasError = true;
    }

    if (!token.trim()) {
      setTokenError('Vui lòng cung cấp mã xác thực đặt lại mật khẩu.');
      hasError = true;
    }

    if (!password) {
      setPasswordError('Vui lòng nhập mật khẩu mới.');
      hasError = true;
    } else if (password.length < 8) {
      setPasswordError('Mật khẩu phải chứa ít nhất 8 ký tự.');
      hasError = true;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Vui lòng xác nhận mật khẩu mới.');
      hasError = true;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Mật khẩu xác nhận không khớp.');
      hasError = true;
    }

    if (hasError) return;

    resetPassword(
      {
        email: email.trim(),
        token: token.trim(),
        newPassword: password,
        confirmPassword,
      },
      () => {
        setIsSuccess(true);
      }
    );
  };

  return (
    <AuthLayout
      activeRoute="login"
      onNavigate={(r) => onNavigate && onNavigate(r)}
    >
      <AuthCard>
        {!isSuccess ? (
          <>
            <AuthHeader
              title="Đặt lại mật khẩu 🔑"
              subtitle="Nhập mã xác thực đã nhận cùng mật khẩu mới an toàn cho tài khoản của bạn."
            />

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

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
              <AuthInput
                id="reset-email"
                label="Địa chỉ email tài khoản"
                type="email"
                isRequired
                placeholder="ban@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError(undefined);
                }}
                error={emailError}
                iconLeft={<Mail size={16} />}
                disabled={isSubmitting}
                autoComplete="email"
              />

              <AuthInput
                id="reset-token"
                label="Mã token khôi phục"
                type="text"
                isRequired
                placeholder="Dán mã xác thực nhận được từ email"
                value={token}
                onChange={(e) => {
                  setToken(e.target.value);
                  if (tokenError) setTokenError(undefined);
                }}
                error={tokenError}
                iconLeft={<KeyRound size={16} />}
                disabled={isSubmitting}
                autoComplete="off"
              />

              <div>
                <PasswordInput
                  id="reset-new-password"
                  label="Mật khẩu mới"
                  isRequired
                  placeholder="Tối thiểu 8 ký tự"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(undefined);
                  }}
                  error={passwordError}
                  disabled={isSubmitting}
                  autoComplete="new-password"
                />
                {password.length > 0 && (
                  <div style={{ marginTop: 'var(--space-2)' }}>
                    <PasswordStrength strength={strengthResult} />
                  </div>
                )}
              </div>

              <PasswordInput
                id="reset-confirm-password"
                label="Xác nhận mật khẩu mới"
                isRequired
                placeholder="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError) setConfirmPasswordError(undefined);
                }}
                error={confirmPasswordError}
                disabled={isSubmitting}
                autoComplete="new-password"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="ds-btn ds-btn-primary"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 'var(--space-2)',
                  marginTop: 'var(--space-2)',
                  boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
                }}
              >
                <span>{isSubmitting ? 'Đang cập nhật...' : 'Xác nhận đặt lại mật khẩu'}</span>
                {!isSubmitting && <Check size={16} />}
              </button>
            </form>

            <div style={{ marginTop: 'var(--space-5)', textAlign: 'center' }}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('login')}
                className="ds-btn ds-btn-ghost"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  fontSize: 'var(--text-sm)',
                  color: 'var(--muted)',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft size={16} />
                <span>Quay lại đăng nhập</span>
              </button>
            </div>
          </>
        ) : (
          /* SUCCESS STATE */
          <div style={{ textAlign: 'center', padding: 'var(--space-4) 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--success-bg)',
                border: '1px solid var(--success-border)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
              }}
            >
              <CheckCircle2 size={32} />
            </div>

            <h3
              style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 800,
                color: 'var(--foreground)',
                marginBottom: 'var(--space-2)',
              }}
            >
              Đặt lại mật khẩu thành công! 🎉
            </h3>

            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--muted)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-6)',
              }}
            >
              {apiSuccess || 'Mật khẩu tài khoản đã được cập nhật thành công. Tất cả phiên đăng nhập cũ đã được thu hồi vì lý do an toàn.'}
            </p>

            <button
              type="button"
              onClick={() => onNavigate && onNavigate('login')}
              className="ds-btn ds-btn-primary"
              style={{
                width: '100%',
                minHeight: '44px',
                fontSize: 'var(--text-sm)',
                fontWeight: 700,
              }}
            >
              Đăng nhập ngay
            </button>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};
