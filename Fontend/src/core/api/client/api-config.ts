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

export const defaultApiConfig: ApiConfig = {
  // Can be configured via VITE_API_BASE_URL (e.g., https://api.zhongwenhub.vn/api/v1 or http://localhost:5000/api/v1)
  baseUrl: (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1',
  timeoutMs: 15000,
  // Flag to toggle between Mock and HTTP adapters in the service container
  useMock: import.meta.env?.VITE_USE_MOCK_API !== 'false',
  // Standard credential mode (same-origin by default to restrict cookie leakage)
  credentials: 'same-origin',
  // Explicit trusted origins allowlist
  trustedOrigins: parseTrustedOrigins(),
};
