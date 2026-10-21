/**
 * Authentication Token Boundary Service
 * Encapsulates token lifecycle, persistence, and injection for HTTP requests.
 * Completely decouples UI components from storage mechanism.
 */

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

const TOKEN_STORAGE_KEY = 'zhongwenhub_auth_tokens_v1';

class AuthTokenService {
  private inMemoryToken: string | null = null;
  private onTokenExpireCallbacks: Array<() => void> = [];

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
      if (raw) {
        const tokens = JSON.parse(raw) as AuthTokens;
        this.inMemoryToken = tokens.accessToken || null;
      }
    } catch {
      this.inMemoryToken = null;
    }
  }

  /**
   * Returns the current Bearer token, or null if unauthenticated.
   */
  getAccessToken(): string | null {
    return this.inMemoryToken;
  }

  /**
   * Sets new authentication tokens and updates storage.
   */
  setTokens(tokens: AuthTokens): void {
    this.inMemoryToken = tokens.accessToken;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(tokens));
      } catch (err) {
        console.warn('[AuthTokenService] Failed to persist auth tokens:', err);
      }
    }
  }

  /**
   * Clears tokens upon logout or session termination.
   */
  clearTokens(): void {
    this.inMemoryToken = null;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      } catch (err) {
        console.warn('[AuthTokenService] Failed to remove tokens:', err);
      }
    }
    this.onTokenExpireCallbacks.forEach((cb) => cb());
  }

  /**
   * Whether the user has an active access token.
   */
  isAuthenticated(): boolean {
    return Boolean(this.inMemoryToken && this.inMemoryToken.length > 0);
  }

  /**
   * Register a callback triggered when token expires or is cleared.
   */
  onExpired(callback: () => void): () => void {
    this.onTokenExpireCallbacks.push(callback);
    return () => {
      this.onTokenExpireCallbacks = this.onTokenExpireCallbacks.filter((c) => c !== callback);
    };
  }
}

export const authTokenService = new AuthTokenService();
