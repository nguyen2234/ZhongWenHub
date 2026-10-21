/**
 * API Client Configuration
 * Supports environment overrides via Vite import.meta.env
 */

export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  useMock: boolean;
}

export const defaultApiConfig: ApiConfig = {
  // Can be configured via VITE_API_BASE_URL (e.g., https://api.zhongwenhub.vn/api/v1 or http://localhost:5000/api/v1)
  baseUrl: (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1',
  timeoutMs: 15000,
  // Flag to toggle between Mock and HTTP adapters in the service container
  useMock: import.meta.env?.VITE_USE_MOCK_API !== 'false',
};
