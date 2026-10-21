/**
 * Authentication Token Boundary Service
 * 
 * SECURITY ARCHITECTURE & ASP.NET CORE INTEGRATION:
 * 1. Access Token: Stored strictly IN-MEMORY during runtime.
 *    - Never serialized into localStorage to protect against XSS token harvesting.
 * 2. Refresh Token: Managed EXCLUSIVELY via server-set HttpOnly, Secure, SameSite=Strict cookies.
 *    - JavaScript runtime has zero read/write access to refresh token cookies.
 *    - On initial load or page refresh, the client performs a silent refresh (/api/v1/auth/refresh-token)
 *      to re-hydrate the in-memory access token.
 */

export interface AuthSession {
  accessToken: string;
  expiresAt?: number;
}

class AuthTokenService {
  private inMemoryToken: string | null = null;
  private tokenExpiresAt: number | null = null;
  private onTokenExpireCallbacks: Array<() => void> = [];

  constructor() {
    this.cleanLegacyStorage();
  }

  /**
   * Cleans any legacy token artifacts from localStorage to prevent lingering secrets.
   */
  private cleanLegacyStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem('zhongwenhub_auth_tokens_v1');
      window.localStorage.removeItem('zhongwenhub_auth_token');
      window.localStorage.removeItem('refresh_token');
    } catch {
      // Ignore storage access errors in sandboxed environments
    }
  }

  /**
   * Returns current Bearer access token held in memory, or null if unauthenticated.
   */
  getAccessToken(): string | null {
    if (this.tokenExpiresAt && Date.now() > this.tokenExpiresAt) {
      this.clearTokens();
      return null;
    }
    return this.inMemoryToken;
  }

  /**
   * Sets in-memory access token upon successful login or silent cookie refresh.
   * Does NOT write to localStorage.
   */
  setSession(session: AuthSession): void {
    this.inMemoryToken = session.accessToken;
    this.tokenExpiresAt = session.expiresAt || null;
  }

  /**
   * Legacy compatibility method for setTokens: only extracts accessToken into memory.
   * Explicitly drops any refreshToken passed to prevent client-side storage.
   */
  setTokens(tokens: { accessToken: string; refreshToken?: string; expiresAt?: number }): void {
    this.setSession({
      accessToken: tokens.accessToken,
      expiresAt: tokens.expiresAt,
    });
  }

  /**
   * Clears in-memory session upon logout or 401 Unauthorized response.
   */
  clearTokens(): void {
    this.inMemoryToken = null;
    this.tokenExpiresAt = null;
    this.cleanLegacyStorage();
    this.onTokenExpireCallbacks.forEach((cb) => cb());
  }

  /**
   * Check whether user currently holds a non-expired access token in memory.
   */
  isAuthenticated(): boolean {
    return Boolean(this.getAccessToken());
  }

  /**
   * Register listener for session invalidation (e.g., to redirect to login).
   */
  onExpired(callback: () => void): () => void {
    this.onTokenExpireCallbacks.push(callback);
    return () => {
      this.onTokenExpireCallbacks = this.onTokenExpireCallbacks.filter((c) => c !== callback);
    };
  }
}

export const authTokenService = new AuthTokenService();
