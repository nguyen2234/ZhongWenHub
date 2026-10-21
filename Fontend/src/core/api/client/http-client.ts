import { ApiClientError } from './api-error';
import { authTokenService } from './auth-token.service';
import { defaultApiConfig, type ApiConfig } from './api-config';

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  params?: Record<string, string | number | boolean | undefined | null>;
  timeoutMs?: number;
}

/**
 * Standard HTTP Client for ASP.NET Core REST API integration.
 * - Does NOT wrap successful responses into artificial envelopes (returns data T directly).
 * - Transparently handles Bearer token authentication from in-memory AuthTokenService.
 * - Clears in-memory credentials on 401 Unauthorized responses.
 * - Parses RFC 7807 ProblemDetails on 4xx/5xx responses into ApiClientError.
 * - Supports cancellation via AbortSignal and timeout safety.
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
   * Executes an HTTP request with timeout, signal handling, and Problem Details decoding.
   */
  private async execute<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;

    // Check if caller's signal was already aborted
    if (options.signal?.aborted) {
      throw new ApiClientError('Yêu cầu đã bị hủy bởi người dùng.', 499, undefined, true);
    }

    const controller = new AbortController();
    let isTimeout = false;
    const timeoutId = setTimeout(() => {
      isTimeout = true;
      controller.abort();
    }, timeoutMs);

    // Forward custom signal abort
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const headers: Record<string, string> = {
      Accept: 'application/json, application/problem+json',
      ...(options.headers as Record<string, string>),
    };

    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    // Inject Bearer token from in-memory service if available
    const token = authTokenService.getAccessToken();
    if (token && !headers['Authorization']) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: controller.signal,
        credentials: 'include', // Include HttpOnly cookies (for refresh token)
      });

      clearTimeout(timeoutId);

      // Handle HTTP 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      // Parse JSON response or fallback to text
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');
      const responseData = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        // Automatically invalidate session on 401 Unauthorized
        if (response.status === 401) {
          authTokenService.clearTokens();
        }
        throw ApiClientError.fromResponse(response.status, responseData);
      }

      return responseData as T;
    } catch (error) {
      clearTimeout(timeoutId);

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
