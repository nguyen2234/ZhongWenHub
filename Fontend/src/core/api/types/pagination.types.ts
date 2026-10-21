/**
 * Standard query parameters for pagination, sorting, and search.
 */
export interface PaginationParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  sortBy?: string;
  sortDescending?: boolean;
}

/**
 * Standard PagedResult matching ASP.NET Core pagination contract.
 * Note: Only endpoints with collection pagination return this structure.
 * Single resource endpoints return the entity directly (no arbitrary wrapper).
 */
export interface PagedResult<T> {
  items: T[];
  pageNumber: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}

/**
 * Helper to create a client-side PagedResult from an array (used by Mock Adapters).
 */
export function paginateArray<T>(
  items: T[],
  pageNumber = 1,
  pageSize = 20
): PagedResult<T> {
  const safePageNumber = Math.max(1, pageNumber);
  const safePageSize = Math.max(1, pageSize);
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const startIndex = (safePageNumber - 1) * safePageSize;
  const pagedItems = items.slice(startIndex, startIndex + safePageSize);

  return {
    items: pagedItems,
    pageNumber: safePageNumber,
    pageSize: safePageSize,
    totalCount,
    totalPages,
    hasPreviousPage: safePageNumber > 1,
    hasNextPage: safePageNumber < totalPages,
  };
}
