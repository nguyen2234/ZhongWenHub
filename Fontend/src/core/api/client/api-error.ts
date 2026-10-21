import { isProblemDetails, type ProblemDetails } from '../types/problem-details';

/**
 * Standard API error class for all HTTP operations.
 * Encapsulates HTTP status code, RFC 7807 ProblemDetails, and field validation errors.
 */
export class ApiClientError extends Error {
  public readonly status: number;
  public readonly problemDetails?: ProblemDetails;
  public readonly validationErrors?: Record<string, string[]>;
  public readonly isNetworkError: boolean;

  constructor(
    message: string,
    status = 0,
    problemDetails?: ProblemDetails,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.problemDetails = problemDetails;
    this.validationErrors = problemDetails?.errors;
    this.isNetworkError = isNetworkError;

    // Preserve prototype chain in ES5/ES6 environments
    Object.setPrototypeOf(this, ApiClientError.prototype);
  }

  /**
   * Factory method to construct an ApiClientError from an HTTP response and parsed body.
   */
  static fromResponse(status: number, responseBody: unknown): ApiClientError {
    if (isProblemDetails(responseBody)) {
      const title = responseBody.title || 'Lỗi xử lý yêu cầu';
      const detail = responseBody.detail ? `: ${responseBody.detail}` : '';
      const message = `${title}${detail}`;
      return new ApiClientError(message, status, responseBody);
    }

    if (typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody) {
      const msg = String((responseBody as { message: unknown }).message);
      return new ApiClientError(msg, status);
    }

    const defaultMessages: Record<number, string> = {
      400: 'Yêu cầu không hợp lệ (400 Bad Request).',
      401: 'Phiên làm việc hết hạn hoặc chưa xác thực (401 Unauthorized).',
      403: 'Bạn không có quyền thực hiện hành động này (403 Forbidden).',
      404: 'Tài nguyên không tìm thấy (404 Not Found).',
      409: 'Xung đột dữ liệu (409 Conflict).',
      422: 'Dữ liệu không thể xử lý (422 Unprocessable Entity).',
      500: 'Lỗi máy chủ nội bộ. Vui lòng thử lại sau (500 Internal Server Error).',
      503: 'Dịch vụ tạm thời không khả dụng (503 Service Unavailable).',
    };

    const message = defaultMessages[status] || `Lỗi kết nối máy chủ (Mã: ${status}).`;
    return new ApiClientError(message, status);
  }

  /**
   * Factory method for network disconnection / unreachable host.
   */
  static networkError(_originalError?: Error): ApiClientError {
    return new ApiClientError(
      'Không thể kết nối đến máy chủ. Vui lòng kiểm tra đường truyền mạng.',
      0,
      undefined,
      true
    );
  }

  /**
   * Helper to retrieve all validation error messages as a flat string list.
   */
  getFlatValidationErrors(): string[] {
    if (!this.validationErrors) return [];
    return Object.values(this.validationErrors).flat();
  }
}
