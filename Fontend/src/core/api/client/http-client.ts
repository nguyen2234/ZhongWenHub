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
 * - Transparently handles Bearer token authentication.
 * - Parses RFC 7807 ProblemDetails on 4xx/5xx responses into ApiClientError.
 * - Supports cancellation via AbortSignal and timeout safety.
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
   * Executes an HTTP request with timeout and error handling.
   */
  private async execute<T>(
    endpoint: string,
    method: string,
    body?: unknown,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint, options.params);
    const timeoutMs = options.timeoutMs ?? this.config.timeoutMs;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Merge custom signals if caller provided one
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

    // Inject Bearer token if available
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
      });

      clearTimeout(timeoutId);

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      // Parse JSON response or fallback to text
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json') || contentType.includes('application/problem+json');
      const responseData = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        throw ApiClientError.fromResponse(response.status, responseData);
      }

      return responseData as T;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new ApiClientError(
          'Yêu cầu đã bị hủy hoặc quá thời gian phản hồi (Timeout).',
          408,
          undefined,
          true
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
