import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  AuthUser,
} from '../types/auth.types';

/**
 * Mock Authentication Service
 * 
 * NOTE FOR SPRING BOOT INTEGRATION:
 * When connecting to Spring Boot backend:
 * 1. Replace the mock delay with standard fetch or axios calls.
 * 2. Point endpoints to:
 *    - POST /api/v1/auth/login
 *    - POST /api/v1/auth/register
 *    - POST /api/v1/auth/google
 *    - POST /api/v1/auth/forgot-password
 * 3. Handle HttpOnly cookies or Authorization: Bearer <token> headers.
 * 4. Remove this simulation layer.
 */

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  /**
   * Mock login
   */
  async login(request: LoginRequest): Promise<AuthResponse> {
    await delay(750);

    const emailTrimmed = request.email.trim().toLowerCase();

    // Simulated error case for testing UI error state
    if (emailTrimmed === 'error@test.com') {
      throw new Error('Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.');
    }

    if (request.password.length < 6) {
      throw new Error('Mật khẩu không hợp lệ.');
    }

    const mockUser: AuthUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      fullName: emailTrimmed.split('@')[0].toUpperCase(),
      email: emailTrimmed,
      currentHskLevel: 2,
      streakDays: 8,
      xpPoints: 2180,
    };

    return {
      success: true,
      message: 'Đăng nhập thành công! Đang chuyển hướng...',
      user: mockUser,
    };
  },

  /**
   * Mock register
   */
  async register(request: RegisterRequest): Promise<AuthResponse> {
    await delay(850);

    const emailTrimmed = request.email.trim().toLowerCase();

    // Simulated already existing email
    if (emailTrimmed === 'exists@test.com') {
      throw new Error('Email này đã được đăng ký tài khoản. Vui lòng đăng nhập.');
    }

    if (request.password !== request.confirmPassword) {
      throw new Error('Mật khẩu xác nhận không khớp.');
    }

    const mockUser: AuthUser = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      fullName: request.fullName.trim(),
      email: emailTrimmed,
      currentHskLevel: 1,
      streakDays: 1,
      xpPoints: 50,
    };

    return {
      success: true,
      message: 'Đăng ký tài khoản thành công! Đang chuyển đến bước thiết lập...',
      user: mockUser,
    };
  },

  /**
   * Mock Google OAuth login
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    await delay(600);

    const mockUser: AuthUser = {
      id: 'usr_g_' + Math.random().toString(36).substring(2, 9),
      fullName: 'Học viên Google',
      email: 'student.google@gmail.com',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      currentHskLevel: 1,
      streakDays: 1,
      xpPoints: 100,
    };

    return {
      success: true,
      message: 'Đăng nhập bằng Google thành công!',
      user: mockUser,
    };
  },

  /**
   * Mock forgot password request
   */
  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    await delay(700);

    const emailTrimmed = email.trim().toLowerCase();
    if (!emailTrimmed || !emailTrimmed.includes('@')) {
      throw new Error('Vui lòng cung cấp địa chỉ email hợp lệ.');
    }

    return {
      success: true,
      message: 'Hướng dẫn đặt lại mật khẩu đã được gửi đến ' + emailTrimmed + '. Vui lòng kiểm tra hòm thư của bạn.',
    };
  },
};
