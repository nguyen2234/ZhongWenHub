import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { AuthLayout } from '../components/AuthLayout';
import { AuthCard } from '../components/AuthCard';
import { AuthHeader } from '../components/AuthHeader';
import { AuthInput } from '../components/AuthInput';
import { useAuth } from '../hooks/useAuth';

export interface ForgotPasswordPageProps {
  onNavigate?: (route: 'login' | 'register' | 'forgot-password' | 'dashboard') => void;
}

export const ForgotPasswordPage: React.FC<ForgotPasswordPageProps> = ({ onNavigate: customNav }) => {
  const routerNavigate = useNavigate();
  const onNavigate = customNav ?? ((r) => routerNavigate(`/${r}`));
  const { isSubmitting, apiError, apiSuccess, forgotPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | undefined>();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setEmailError('Vui lòng nhập email.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setEmailError('Email không đúng định dạng.');
      return;
    }

    forgotPassword(email, () => {
      setSubmittedEmail(email);
    });
  };

  return (
    <AuthLayout
      activeRoute="forgot-password"
      onNavigate={(r) => onNavigate && onNavigate(r)}
    >
      <AuthCard>
        {!submittedEmail ? (
          <>
            <AuthHeader
              title="Quên mật khẩu? 🔒"
              subtitle="Đừng lo lắng! Nhập địa chỉ email đăng ký, ZhongWenHub sẽ gửi đường dẫn đặt lại mật khẩu cho bạn."
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

            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
              <AuthInput
                id="forgot-email"
                label="Địa chỉ email đã đăng ký"
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
                  boxShadow: '0 2px 8px rgba(67, 56, 202, 0.25)',
                }}
              >
                <span>{isSubmitting ? 'Đang gửi...' : 'Gửi liên kết khôi phục'}</span>
                {!isSubmitting && <Send size={15} />}
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
          <div style={{ textAlign: 'center', padding: 'var(--space-2) 0' }}>
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

            <h2
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                color: 'var(--foreground)',
                margin: 0,
                marginBottom: 'var(--space-2)',
              }}
            >
              Kiểm tra email của bạn
            </h2>

            <p
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--muted)',
                lineHeight: 1.5,
                margin: '0 auto var(--space-5)',
              }}
            >
              {apiSuccess || (
                <>
                  Chúng tôi đã gửi hướng dẫn đặt lại mật khẩu đến{' '}
                  <strong style={{ color: 'var(--foreground)' }}>{submittedEmail}</strong>. Vui lòng kiểm tra hộp thư
                  đến hoặc thư rác (spam).
                </>
              )}
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
              <button
                type="button"
                onClick={() => onNavigate && onNavigate('login')}
                className="ds-btn ds-btn-primary"
                style={{
                  width: '100%',
                  minHeight: '44px',
                  fontWeight: 700,
                }}
              >
                Quay lại Đăng nhập
              </button>

              <button
                type="button"
                onClick={() => {
                  setSubmittedEmail(null);
                  setEmail('');
                }}
                className="ds-btn ds-btn-outline"
                style={{
                  width: '100%',
                  minHeight: '40px',
                  color: 'var(--muted)',
                }}
              >
                Gửi lại email khác
              </button>
            </div>
          </div>
        )}
      </AuthCard>
    </AuthLayout>
  );
};
