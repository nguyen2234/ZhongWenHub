/**
 * API Client Configuration
 * Supports environment overrides via Vite import.meta.env
 */

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  useMock: boolean;
  credentials?: RequestCredentials;
  /**
   * Explicit allowlist of trusted origins allowed to receive Bearer tokens and CSRF headers.
   * Wildcards (*) are strictly prohibited.
   * Relative URLs and same-origin URLs are always trusted by default.
   */
  trustedOrigins?: string[];
}

// Parse comma-separated trusted origins from VITE_API_TRUSTED_ORIGINS if configured
function parseTrustedOrigins(): string[] {
  const envVal = (import.meta.env?.VITE_API_TRUSTED_ORIGINS ?? import.meta.env?.VITE_TRUSTED_ORIGINS) as string | undefined;
  if (!envVal) return [];
  return envVal
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter((s) => s.length > 0 && s !== '*'); // Reject wildcards
}

/**
 * Returns true if the environment is a production build or explicitly forced into production mode.
 */
export function isProductionEnvironment(): boolean {
  if ((globalThis as unknown as { __FORCE_PRODUCTION_AUTH_MODE__?: boolean }).__FORCE_PRODUCTION_AUTH_MODE__ === true) {
    return true;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    if (import.meta.env.PROD === true || import.meta.env.MODE === 'production') {
      return true;
    }
  }
  return false;
}

/**
 * Helper to build full API endpoint URL from base configuration.
 */
export function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

// In Bun test runner, default to mock for unit tests unless production mode is enforced.
const isBunTest = typeof (globalThis as unknown as { Bun?: unknown }).Bun !== 'undefined';

export const defaultApiConfig: ApiConfig = {
  // Can be configured via VITE_API_BASE_URL (e.g., https://api.zhongwenhub.vn/api/v1 or http://localhost:5000/api/v1)
  baseUrl: (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1',
  timeoutMs: 15000,
  // Flag to toggle between Mock and HTTP adapters in the service container.
  // In production builds: strictly false (never mock).
  // In Bun test runner: true (so synchronous unit test fixtures run cleanly).
  // In real browser runtime: false by default (real SQL Server HTTP API), unless explicitly set to 'true'.
  useMock: !isProductionEnvironment() && (isBunTest || import.meta.env?.VITE_USE_MOCK_API === 'true'),
  // Standard credential mode (same-origin by default to restrict cookie leakage)
  credentials: 'same-origin',
  // Explicit trusted origins allowlist
  trustedOrigins: parseTrustedOrigins(),
};
