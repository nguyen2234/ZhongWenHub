import React from 'react';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  pageSize?: number;
  totalItems?: number;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  itemLabel?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  pageSize,
  totalItems,
  pageSizeOptions = [10, 20, 50],
  onPageSizeChange,
  itemLabel = 'mục',
}) => {
  // If there are no items at all, don't show pagination
  if (totalItems === 0) return null;

  const startItem = totalItems !== undefined && pageSize !== undefined
    ? (currentPage - 1) * pageSize + 1
    : 1;
  const endItem = totalItems !== undefined && pageSize !== undefined
    ? Math.min(currentPage * pageSize, totalItems)
    : undefined;

  // Generate visible page numbers (max 5 around current)
  const getPageNumbers = () => {
    if (totalPages <= 1) return [1];
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage - 2);
    const end = Math.min(totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 'var(--space-3) var(--space-4)',
        borderTop: '1px solid var(--border)',
        fontSize: 'var(--text-xs)',
        color: 'var(--muted)',
        flexWrap: 'wrap',
        gap: 'var(--space-2)',
      }}
      role="navigation"
      aria-label="Phân trang dữ liệu"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        {totalItems !== undefined && endItem !== undefined ? (
          <span>
            Hiển thị <strong>{startItem}</strong>–<strong>{endItem}</strong> trong{' '}
            <strong>{totalItems.toLocaleString()}</strong> {itemLabel}
          </span>
        ) : (
          <span>Trang {currentPage} / {Math.max(1, totalPages)}</span>
        )}

        {onPageSizeChange && pageSize && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginLeft: '6px' }}>
            <span style={{ fontSize: '11px', color: 'var(--muted)' }}>Hiển thị:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              aria-label="Số mục trên mỗi trang"
              style={{
                height: '26px',
                padding: '0 6px',
                fontSize: '11px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                backgroundColor: 'var(--surface)',
                color: 'var(--foreground)',
                cursor: 'pointer',
              }}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="ds-btn ds-btn-sm ds-btn-ghost"
          style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
          aria-label="Trang trước"
        >
          Trước
        </button>

        {pages.map((p) => {
          const isActive = p === currentPage;
          return (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              className={`ds-btn ds-btn-sm ${isActive ? 'ds-btn-primary' : 'ds-btn-ghost'}`}
              style={{
                height: '28px',
                minWidth: '28px',
                padding: '0 6px',
                fontSize: '11px',
                fontWeight: isActive ? 700 : 500,
              }}
              aria-current={isActive ? 'page' : undefined}
              aria-label={`Trang ${p}`}
            >
              {p}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="ds-btn ds-btn-sm ds-btn-ghost"
          style={{ height: '28px', padding: '0 8px', fontSize: '11px' }}
          aria-label="Trang kế tiếp"
        >
          Sau
        </button>
      </div>
    </div>
  );
};
