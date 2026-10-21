import React, { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import type { BulkAction } from '../types';
import '../styles/management-table.css';

export interface TableToolbarProps<T = Record<string, unknown>> {
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  searchPlaceholder?: string;
  debounceMs?: number;
  filterActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  // Bulk selection support (app.md)
  selectedCount?: number;
  selectedItems?: T[];
  bulkActions?: BulkAction<T>[];
  onClearSelection?: () => void;
}

export function TableToolbar<T = Record<string, unknown>>({
  searchQuery = '',
  onSearchChange,
  searchPlaceholder = 'Tìm kiếm dữ liệu...',
  debounceMs = 250,
  filterActions,
  rightActions,
  selectedCount = 0,
  selectedItems = [],
  bulkActions = [],
  onClearSelection,
}: TableToolbarProps<T>) {
  const [internalSearch, setInternalSearch] = useState(searchQuery);

  // Sync internal state with external prop changes
  useEffect(() => {
    setInternalSearch(searchQuery);
  }, [searchQuery]);

  // Debounced search trigger
  useEffect(() => {
    if (!onSearchChange) return;
    if (internalSearch === searchQuery) return;

    const timer = setTimeout(() => {
      onSearchChange(internalSearch);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [internalSearch, onSearchChange, debounceMs, searchQuery]);

  // If items are selected and bulk actions exist, display the Bulk Actions Bar (Evondev app.md)
  if (selectedCount > 0 && bulkActions.length > 0) {
    return (
      <div className="mgmt-bulk-bar" role="toolbar" aria-label="Thao tác hàng loạt">
        <div className="mgmt-bulk-count">
          <span>Đã chọn <strong>{selectedCount}</strong> mục</span>
          {onClearSelection && (
            <button
              type="button"
              onClick={onClearSelection}
              className="mgmt-icon-btn"
              style={{ width: 'auto', padding: '0 8px', fontSize: '12px' }}
            >
              Bỏ chọn
            </button>
          )}
        </div>

        <div className="mgmt-bulk-actions-group">
          {bulkActions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={() => action.onClick(selectedItems)}
              className={`mgmt-mobile-action-btn ${action.variant === 'danger' ? 'danger' : action.variant === 'primary' ? 'primary' : ''}`}
              style={{
                height: '32px',
                minHeight: '32px',
                fontSize: '12.5px',
                padding: '0 10px',
                backgroundColor: action.variant === 'danger' ? '#dc2626' : undefined,
                color: action.variant === 'danger' ? '#ffffff' : undefined,
                borderColor: action.variant === 'danger' ? '#dc2626' : undefined,
              }}
            >
              {action.icon}
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mgmt-toolbar" role="toolbar" aria-label="Thanh công cụ bảng">
      <div className="mgmt-toolbar-left">
        {onSearchChange && (
          <div className="mgmt-search-wrapper">
            <Search className="mgmt-search-icon" size={16} aria-hidden="true" />
            <input
              type="text"
              value={internalSearch}
              onChange={(e) => setInternalSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="mgmt-search-input"
              aria-label={searchPlaceholder}
            />
            {internalSearch && (
              <button
                type="button"
                onClick={() => {
                  setInternalSearch('');
                  onSearchChange('');
                }}
                className="mgmt-search-clear"
                aria-label="Xóa từ khóa tìm kiếm"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
        {filterActions}
      </div>

      {rightActions && <div className="mgmt-toolbar-right">{rightActions}</div>}
    </div>
  );
}
