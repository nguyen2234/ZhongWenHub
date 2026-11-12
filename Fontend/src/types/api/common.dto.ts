/**
 * Standard API Common Types & Contracts for ZhongWenHub
 * Aligned with ASP.NET Core Web API conventions & RFC 7807 Problem Details
 */

/**
 * Standard Paged Response matching ASP.NET Core PagedResult<T>
 */
export interface PagedResponse<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage?: boolean;
  hasNextPage?: boolean;
}

/**
 * Standard Pagination & Filter Query Parameters
 */
export interface PaginationQuery {
  pageNumber?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

/**
 * Standard ASP.NET Core Problem Details (RFC 7807 / RFC 9457)
 */
export interface ApiProblemDetails {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errors?: Record<string, string[]>;
  traceId?: string;
}

/**
 * Standard API Result wrapper for action outcomes
 */
export interface ApiActionResult<T = void> {
  success: boolean;
  data?: T;
  message?: string;
  problemDetails?: ApiProblemDetails;
}
