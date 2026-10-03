import { useState, useCallback } from 'react';
import { authService } from '../services/authService';
import type { LoginRequest, RegisterRequest, AuthUser } from '../types/auth.types';

export function useAuth() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setApiError(null);
    setApiSuccess(null);
  }, []);

  const login = useCallback(
    async (request: LoginRequest, onSuccess: (user: AuthUser) => void) => {
      setIsSubmitting(true);
      setApiError(null);
      setApiSuccess(null);

      try {
        const response = await authService.login(request);
        if (response.success && response.user) {
          setApiSuccess(response.message || 'Đăng nhập thành công!');
          setTimeout(() => {
            onSuccess(response.user!);
          }, 450);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        setApiError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const register = useCallback(
    async (request: RegisterRequest, onSuccess: (user: AuthUser) => void) => {
      setIsSubmitting(true);
      setApiError(null);
      setApiSuccess(null);

      try {
        const response = await authService.register(request);
        if (response.success && response.user) {
          setApiSuccess(response.message || 'Đăng ký thành công!');
          setTimeout(() => {
            onSuccess(response.user!);
          }, 450);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Đã có lỗi xảy ra. Vui lòng thử lại.';
        setApiError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const loginWithGoogle = useCallback(
    async (onSuccess: (user: AuthUser) => void) => {
      setIsSubmitting(true);
      setApiError(null);
      setApiSuccess(null);

      try {
        const response = await authService.loginWithGoogle();
        if (response.success && response.user) {
          setApiSuccess(response.message || 'Đăng nhập Google thành công!');
          setTimeout(() => {
            onSuccess(response.user!);
          }, 450);
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Đăng nhập bằng Google không thành công.';
        setApiError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  const forgotPassword = useCallback(
    async (email: string, onSuccess: () => void) => {
      setIsSubmitting(true);
      setApiError(null);
      setApiSuccess(null);

      try {
        const response = await authService.forgotPassword(email);
        if (response.success) {
          setApiSuccess(response.message);
          onSuccess();
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Không thể gửi email đặt lại mật khẩu.';
        setApiError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isSubmitting,
    apiError,
    apiSuccess,
    login,
    register,
    loginWithGoogle,
    forgotPassword,
    clearMessages,
  };
}
