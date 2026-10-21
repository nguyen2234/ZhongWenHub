import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/management-table.css';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  itemLabel = 'bản ghi',
  className = '',
}) => {
  // If there are no items or only 1 page with no totalItems provided, keep it clean
  if (totalItems === 0) return null;

  const startItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min((currentPage - 1) * pageSize + 1, totalItems)
      : (currentPage - 1) * (pageSize || 10) + 1;

  const endItem =
    totalItems !== undefined && pageSize !== undefined
      ? Math.min(currentPage * pageSize, totalItems)
      : undefined;

  // Generate page numbers with ellipsis (Evondev small-controls.md)
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];

    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible + 2) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
      return pages;
    }

    pages.push(1);

    const leftBoundary = Math.max(2, currentPage - 1);
    const rightBoundary = Math.min(totalPages - 1, currentPage + 1);

    if (leftBoundary > 2) {
      pages.push('ellipsis');
    }

    for (let i = leftBoundary; i <= rightBoundary; i++) {
      pages.push(i);
    }

    if (rightBoundary < totalPages - 1) {
      pages.push('ellipsis');
    }

    pages.push(totalPages);
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav
      className={`mgmt-pagination ${className}`}
      role="navigation"
      aria-label="Phân trang dữ liệu"
    >
      <div className="mgmt-pagination-info">
        {totalItems !== undefined && endItem !== undefined ? (
          <span>
            Hiển thị <strong>{startItem}</strong>–<strong>{endItem}</strong> trong{' '}
            <strong>{totalItems.toLocaleString()}</strong> {itemLabel}
          </span>
        ) : (
          <span>
            Trang <strong>{currentPage}</strong> / {Math.max(1, totalPages)}
          </span>
        )}

        {onPageSizeChange && pageSize && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--muted)' }}>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Số mục trên mỗi trang"
              className="mgmt-pagination-size-select"
            >
              {pageSizeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt} / trang
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="mgmt-pagination-controls">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="mgmt-page-btn"
          aria-label="Trang trước"
        >
          <ChevronLeft size={16} aria-hidden="true" />
        </button>

        {pages.map((p, idx) => {
          if (p === 'ellipsis') {
            return (
              <span key={`ellipsis-${idx}`} className="mgmt-page-ellipsis" aria-hidden="true">
                …
              </span>
            );
          }

          const isActive = p === currentPage;
          return (
            <button
              key={`page-${p}`}
              type="button"
              onClick={() => onPageChange(p)}
              className={`mgmt-page-btn ${isActive ? 'is-active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Trang ${p}`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="mgmt-page-btn"
          aria-label="Trang sau"
        >
          <ChevronRight size={16} aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
};
