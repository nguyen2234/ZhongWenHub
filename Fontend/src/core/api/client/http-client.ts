import { ApiClientError } from './api-error';
import { authTokenService } from './auth-token.service';
import { defaultApiConfig, type ApiConfig } from './api-config';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
  credentials?: RequestCredentials;
}

/**
 * Helper to retrieve Anti-CSRF token from cookies or DOM meta tags if available.
 * Supports standard ASP.NET Core XSRF-TOKEN cookie pattern.
 */
function extractCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;

  // 1. Check meta tag
  const meta = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null;
  if (meta?.content) return meta.content;

  // 2. Check XSRF-TOKEN or CSRF-TOKEN cookie
  const match = document.cookie.match(/(?:^|;\s*)(?:XSRF-TOKEN|CSRF-TOKEN)=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * Standard HTTP Client for ASP.NET Core REST API integration.
 * - Does NOT wrap successful responses into artificial envelopes (returns data T directly).
 * - Restricts Bearer token and Anti-CSRF header injection STRICTLY to trusted API origins.
 * - Prohibits sending authentication credentials or tokens to external 3rd-party domains.
 * - Enforces listener cleanup for external AbortSignals.
 * - Timeout covers the entire network roundtrip, including response body consumption.
 * - Scopes cookie credentials to 'same-origin' by default with CSRF header support.
 * - Guards against uncontrolled 401 refresh retry loops.
 * - Handles 204 No Content seamlessly.
 */
export class HttpClient {
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...defaultApiConfig, ...config };
  }

  /**
   * Validates if a normalized origin is trusted.
   * In production, only HTTPS origins are allowed.
   * HTTP is only allowed for loopback/localhost in development.
   */
  private checkOriginTrusted(originStr: string): boolean {
    try {
      const parsed = new URL(originStr);
      const protocol = parsed.protocol.toLowerCase();
      const hostname = parsed.hostname.toLowerCase();
      const isProd = import.meta.env?.PROD === true || import.meta.env?.MODE === 'production';

      const isLoopback =
        hostname === 'localhost' ||
        hostname === '127.0.0.1' ||
        hostname === '::1' ||
        hostname === '[::1]';

      // Security rule: Only HTTPS is allowed in production.
      // HTTP is only permitted on localhost / loopback during development.
      if (protocol === 'http:') {
        if (isProd || !isLoopback) {
          return false;
        }
      } else if (protocol !== 'https:') {
        return false;
      }

      const targetOrigin = parsed.origin.toLowerCase();

      // Check current window origin
      if (typeof window !== 'undefined' && window.location?.origin) {
        if (targetOrigin === window.location.origin.toLowerCase()) {
          return true;
        }
      }

      // Check baseUrl origin if baseUrl is absolute
      if (this.config.baseUrl.startsWith('http://') || this.config.baseUrl.startsWith('https://')) {
        const baseOrigin = new URL(this.config.baseUrl).origin.toLowerCase();
        if (targetOrigin === baseOrigin) {
          return true;
        }
      }

      // Check allowlist (strict match, reject wildcards)
      const allowlist = this.config.trustedOrigins || [];
      return allowlist.some((trusted) => {
        if (!trusted || trusted === '*') return false;
        try {
          const trustedUrl = new URL(trusted.startsWith('http') ? trusted : `https://${trusted}`);
          if (
            trustedUrl.protocol === 'http:' &&
            (isProd || (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(trustedUrl.hostname.toLowerCase())))
          ) {
            return false;
          }
          return targetOrigin === trustedUrl.origin.toLowerCase();
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }

  /**
   * Determines whether target URL belongs to a trusted origin.
   * Prevents leaking Authorization Bearer and Anti-CSRF headers to external 3rd-party services.
   * Wildcards are strictly prohibited.
   * Protocol-relative URLs (e.g., //external.example) are NOT blindly trusted.
   * In production, only HTTPS origins are accepted; HTTP is only tolerated on localhost in dev.
   */
  public isTrustedOrigin(targetUrl: string): boolean {
    if (!targetUrl || typeof targetUrl !== 'string') {
      return false;
    }

    const trimmed = targetUrl.trim();

    // 1. Protocol-relative URLs (e.g. "//external.example/api") point to external hosts.
    // MUST NOT be treated as path-relative! Resolve against current protocol/host to check origin.
    if (trimmed.startsWith('//') || trimmed.startsWith('\\\\')) {
      try {
        const protocol = typeof window !== 'undefined' && window.location?.protocol ? window.location.protocol : 'https:';
        const resolved = new URL(`${protocol}${trimmed}`);
        return this.checkOriginTrusted(resolved.origin);
      } catch {
        return false;
      }
    }

    // 2. Absolute URLs with scheme
    const hasScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:\/\//.test(trimmed);
    if (hasScheme) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
          return false;
        }
        return this.checkOriginTrusted(parsed.origin);
      } catch {
        return false;
      }
    }

    // 3. Path-relative URLs (e.g. "/api/v1/...", "grammar")
    // If baseUrl is absolute, resolve relative path against baseUrl
    if (this.config.baseUrl.startsWith('http://') || this.config.baseUrl.startsWith('https://')) {
      try {
        const baseOrigin = new URL(this.config.baseUrl).origin;
        return this.checkOriginTrusted(baseOrigin);
      } catch {
        return false;
      }
    }

    // Relative baseUrl on same-origin host
    if (typeof window !== 'undefined' && window.location?.origin) {
      return this.checkOriginTrusted(window.location.origin);
    }

    return true;
  }

  /**
   * Builds full URL with normalized query string parameters.
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const isAbsolute =
      endpoint.startsWith('http://') ||
      endpoint.startsWith('https://') ||
      endpoint.startsWith('//') ||
      endpoint.startsWith('\\\\');

    const base = isAbsolute ? endpoint : `${this.config.baseUrl.replace(/\/+$/, '')}/${endpoint.replace(/^\/+/, '')}`;

    if (!params) return base;

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });

    const queryString = query.toString();
    return queryString ? `${base}?${queryString}` : base;
  }

  /**
   * Executes an HTTP request with timeout spanning both headers and body consumption,
   * proper event listener cleanup, trusted origin scoping, and Problem Details decoding.
   */
  private async execute<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;
    const isTrusted = this.isTrustedOrigin(url);

    // Check if caller's signal was already aborted before starting
    if (options.signal?.aborted) {
      throw new ApiClientError('Yêu cầu đã bị hủy bởi người dùng.', 499, undefined, true);
    }

    const controller = new AbortController();
    let isTimeout = false;
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, timeoutMs);

    // Forward external signal abort with explicit named listener for guaranteed cleanup
    const onExternalAbort = () => controller.abort();
    if (options.signal) {
      options.signal.addEventListener('abort', onExternalAbort);
    }

    // Initialize headers using Headers API for case-insensitive operations
    const headers = new Headers();
    headers.set('Accept', 'application/json, application/problem+json');

    if (options.headers) {
      if (options.headers instanceof Headers) {
        options.headers.forEach((value, key) => headers.set(key, value));
      } else if (Array.isArray(options.headers)) {
        options.headers.forEach(([key, value]) => headers.set(key, value));
      } else {
        Object.entries(options.headers).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            headers.set(key, String(value));
          }
        });
      }
    }

    if (body !== undefined && !headers.has('content-type')) {
      headers.set('Content-Type', 'application/json');
    }

    if (isTrusted) {
      // Security: Anti-CSRF injection ONLY for trusted origins on state-changing requests
      if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
        const csrfToken = extractCsrfToken();
        if (csrfToken && !headers.has('x-csrf-token') && !headers.has('x-xsrf-token')) {
          headers.set('X-CSRF-TOKEN', csrfToken);
        }
      }

      // Security: Inject Bearer token from in-memory service ONLY for trusted origins
      const token = authTokenService.getAccessToken();
      if (token && !headers.has('authorization')) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } else {
      // Security: For untrusted / external origins, strip sensitive headers case-insensitively
      // Standard Headers API delete() is case-insensitive
      headers.delete('authorization');
      headers.delete('proxy-authorization');
      headers.delete('x-csrf-token');
      headers.delete('x-xsrf-token');
    }

    // Security: Unconditionally enforce credentials: 'omit' for untrusted origins,
    // regardless of what caller passed in options.credentials!
    const credentials: RequestCredentials = isTrusted
      ? (options.credentials ?? this.config.credentials ?? 'same-origin')
      : 'omit';

    try {
      const { headers: _ignoredHeaders, credentials: _ignoredCredentials, ...restOptions } = options;
      const response = await fetch(url, {
        ...restOptions,
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials,
      });

      // Handle HTTP 204 No Content immediately
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      // Parse JSON response or fallback to text.
      // NOTE: timeoutId remains active during this phase to guard against slow-drain / hung sockets.
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');
      const responseData = isJson ? await response.json() : await response.text();

      if (controller.signal.aborted) {
        if (isTimeout) {
          throw new ApiClientError(
            'Yêu cầu quá thời gian phản hồi (Timeout). Vui lòng thử lại.',
            408,
            undefined,
            true
          );
        }
        throw new ApiClientError(
          'Yêu cầu đã bị hủy bởi người dùng.',
          499,
          undefined,
          true
        );
      }

      if (!response.ok) {
        // Safe 401 handling without recursive loop:
        // Invalidate in-memory tokens only. We DO NOT initiate an automatic background retry/refresh loop
        // here to avoid cascading 401 storm attacks or cyclic failures.
        if (response.status === 401 && isTrusted) {
          authTokenService.clearTokens();
        }
        throw ApiClientError.fromResponse(response.status, responseData);
      }

      return responseData as T;
    } catch (error) {
      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        if (isTimeout) {
          return Promise.reject(
            new ApiClientError(
              'Yêu cầu quá thời gian phản hồi (Timeout). Vui lòng thử lại.',
              408,
              undefined,
              true
            )
          );
        }
        return Promise.reject(
          new ApiClientError(
            'Yêu cầu đã bị hủy bởi người dùng.',
            499,
            undefined,
            true
          )
        );
      }

      throw ApiClientError.networkError(error instanceof Error ? error : undefined);
    } finally {
      // 1. Clear timeout to release timer handle
      clearTimeout(timeoutId);

      // 2. Guarantee cleanup of external signal listener to avoid memory leaks
      if (options.signal) {
        options.signal.removeEventListener('abort', onExternalAbort);
      }
    }
  }

  public get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.execute<T>(endpoint, 'GET', undefined, options);
  }

  public post<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.execute<T>(endpoint, 'POST', body, options);
  }

  public put<T>(endpoint: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.execute<T>(endpoint, 'PUT', body, options);
  }

  public delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.execute<T>(endpoint, 'DELETE', undefined, options);
  }
}

export const httpClient = new HttpClient();
