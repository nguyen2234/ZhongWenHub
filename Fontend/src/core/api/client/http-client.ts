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
 * - Transparently handles Bearer token authentication from in-memory AuthTokenService.
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
   * Builds full URL with normalized query string parameters.
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined | null>): string {
    const isAbsolute = endpoint.startsWith('http://') || endpoint.startsWith('https://');
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
   * proper event listener cleanup, and Problem Details decoding.
   */
  private async execute<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;

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

    const headers: Record<string, string> = {
      Accept: 'application/json, application/problem+json',
      ...(options.headers as Record<string, string>),
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Anti-CSRF protection: Inject token for state-changing requests if present
    if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
      const csrfToken = extractCsrfToken();
      if (csrfToken && !headers['X-CSRF-TOKEN'] && !headers['X-XSRF-TOKEN']) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      }
    }

    // Inject Bearer token from in-memory service if available
    const token = authTokenService.getAccessToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Default to 'same-origin' to restrict cookie leakage unless explicitly overridden
    const credentials = options.credentials ?? this.config.credentials ?? 'same-origin';

    try {
      const response = await fetch(url, {
        ...options,
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
        if (response.status === 401) {
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
