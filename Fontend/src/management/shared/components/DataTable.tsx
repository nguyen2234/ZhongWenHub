import React, { useState } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import type { TableColumn, SortConfig, RowAction } from '../types';
import { TableSkeleton } from './TableSkeleton';
import { EmptyState } from './EmptyState';
import { ConfirmDialog } from './ConfirmDialog';
import '../styles/management-table.css';

export interface MobileFieldConfig<T> {
  label: string;
  render: (item: T) => React.ReactNode;
}

export interface DataTableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  keyExtractor?: (item: T, index: number) => string | number;
  loading?: boolean;
  emptyText?: string;
  onRowClick?: (item: T) => void;

  // Evondev Advanced Table Features
  sortConfig?: SortConfig;
  onSortChange?: (field: string) => void;

  // Checkbox selection
  selectable?: boolean;
  selectedIds?: (string | number)[];
  onSelectRow?: (id: string | number, selected: boolean, item: T) => void;
  onSelectAll?: (selected: boolean) => void;

  // Actions per row
  rowActions?: RowAction<T>[];

  // Mobile card view configuration (R9, R11, R20)
  enableMobileCards?: boolean;
  mobileTitleExtractor?: (item: T) => React.ReactNode;
  mobileSubtitleExtractor?: (item: T) => React.ReactNode;
  mobileBadgeExtractor?: (item: T) => React.ReactNode;
  mobileFields?: MobileFieldConfig<T>[];

  // Empty state customizations
  isFiltered?: boolean;
  onClearFilters?: () => void;
  emptyAction?: React.ReactNode;

  className?: string;
  containerStyle?: React.CSSProperties;
}

export function DataTable<T = any>({
  columns,
  data,
  keyExtractor = (item: any, index) => item?.id ?? index,
  loading = false,
  emptyText,
  onRowClick,
  sortConfig,
  onSortChange,
  selectable = false,
  selectedIds = [],
  onSelectRow,
  onSelectAll,
  rowActions = [],
  enableMobileCards = true,
  mobileTitleExtractor,
  mobileSubtitleExtractor,
  mobileBadgeExtractor,
  mobileFields,
  isFiltered = false,
  onClearFilters,
  emptyAction,
  className = '',
  containerStyle,
}: DataTableProps<T>) {
  // Confirm dialog state for dangerous row actions
  const [confirmTarget, setConfirmTarget] = useState<{
    action: RowAction<T>;
    item: T;
  } | null>(null);

  const isAllSelected =
    data.length > 0 && data.every((item, idx) => selectedIds.includes(keyExtractor(item, idx)));

  const isSomeSelected =
    data.some((item, idx) => selectedIds.includes(keyExtractor(item, idx))) && !isAllSelected;

  const handleActionClick = (action: RowAction<T>, item: T, e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof action.disabled === 'function' ? action.disabled(item) : action.disabled) {
      return;
    }

    if (action.requireConfirm) {
      setConfirmTarget({ action, item });
    } else {
      action.onClick(item);
    }
  };

  const executeConfirmedAction = () => {
    if (confirmTarget) {
      confirmTarget.action.onClick(confirmTarget.item);
      setConfirmTarget(null);
    }
  };

  return (
    <div
      className={`mgmt-table-card ${enableMobileCards ? 'enable-mobile-cards' : ''} ${className}`}
      style={containerStyle}
    >
      {/* 1. Desktop Table View */}
      <div className="mgmt-table-wrapper">
        <table className="mgmt-table">
          <thead>
            <tr>
              {selectable && (
                <th className="mgmt-th-checkbox">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isSomeSelected;
                    }}
                    onChange={(e) => onSelectAll && onSelectAll(e.target.checked)}
                    aria-label="Chọn tất cả hàng"
                    className="mgmt-checkbox"
                  />
                </th>
              )}

              {columns.map((col) => {
                const isSorted = sortConfig?.field === (col.sortField || col.key);
                const isSortable = Boolean(col.sortable && onSortChange);

                return (
                  <th
                    key={col.key}
                    scope="col"
                    aria-sort={
                      isSorted
                        ? sortConfig?.direction === 'asc'
                          ? 'ascending'
                          : 'descending'
                        : undefined
                    }
                    style={{
                      width: col.width,
                      textAlign: col.align || 'left',
                    }}
                    className={col.className}
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        onClick={() => onSortChange && onSortChange(col.sortField || col.key)}
                        className={`mgmt-sort-header-btn ${isSorted ? 'is-active' : ''} ${
                          col.align === 'right' ? 'align-right' : ''
                        }`}
                        aria-label={`Sắp xếp theo cột ${col.header}`}
                      >
                        <span>{col.header}</span>
                        {isSorted ? (
                          sortConfig?.direction === 'asc' ? (
                            <ArrowUp size={13} aria-hidden="true" />
                          ) : (
                            <ArrowDown size={13} aria-hidden="true" />
                          )
                        ) : (
                          <ArrowUpDown size={13} style={{ opacity: 0.5 }} aria-hidden="true" />
                        )}
                      </button>
                    ) : col.headerRender ? (
                      col.headerRender()
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}

              {rowActions.length > 0 && (
                <th
                  scope="col"
                  style={{
                    width: '90px',
                    textAlign: 'right',
                  }}
                >
                  <span className="sr-only">Thao tác</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  style={{ padding: 0 }}
                >
                  <TableSkeleton rows={5} columns={columns.length + 1} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0) + (rowActions.length > 0 ? 1 : 0)}
                  style={{ padding: 0 }}
                >
                  <EmptyState
                    title={emptyText}
                    isFiltered={isFiltered}
                    onClearFilters={onClearFilters}
                    action={emptyAction}
                  />
                </td>
              </tr>
            ) : (
              data.map((row, index) => {
                const rowKey = keyExtractor(row, index);
                const isSelected = selectedIds.includes(rowKey);

                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(row)}
                    className={isSelected ? 'is-selected' : ''}
                    style={{
                      cursor: onRowClick ? 'pointer' : 'default',
                    }}
                  >
                    {selectable && (
                      <td
                        className="mgmt-td-checkbox"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) =>
                            onSelectRow && onSelectRow(rowKey, e.target.checked, row)
                          }
                          aria-label={`Chọn hàng ${index + 1}`}
                          className="mgmt-checkbox"
                        />
                      </td>
                    )}

                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={`${col.align === 'right' ? 'align-right' : col.align === 'center' ? 'align-center' : ''} ${
                          col.className || ''
                        }`}
                      >
                        {col.render
                          ? col.render(row, index)
                          : ((row as Record<string, any>)[col.key] as React.ReactNode)}
                      </td>
                    ))}

                    {rowActions.length > 0 && (
                      <td
                        className="align-right"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="mgmt-actions-group">
                          {rowActions
                            .filter((act) => {
                              const isHidden = typeof act.hidden === 'function' ? act.hidden(row) : !!act.hidden;
                              const isVis = typeof act.isVisible === 'function' ? act.isVisible(row) : true;
                              return !isHidden && isVis;
                            })
                            .map((action, aIdx) => {
                              const isDisabled =
                                typeof action.disabled === 'function'
                                  ? action.disabled(row)
                                  : action.disabled;
                              const labelText = typeof action.label === 'function' ? action.label(row) : action.label;
                              const iconNode = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                              const actionKey = action.key || action.id || String(aIdx);

                              return (
                                <button
                                  key={actionKey}
                                  type="button"
                                  onClick={(e) => handleActionClick(action, row, e)}
                                  disabled={isDisabled}
                                  title={labelText}
                                  aria-label={labelText}
                                  className={`mgmt-icon-btn ${
                                    action.variant === 'danger'
                                      ? 'variant-danger'
                                      : action.variant === 'primary'
                                      ? 'variant-primary'
                                      : ''
                                  }`}
                                >
                                  {iconNode}
                                </button>
                              );
                            })}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* 2. Responsive Mobile Card View (Evondev R9 & R11) */}
      {enableMobileCards && (
        <div className="mgmt-mobile-list" role="list">
          {loading ? (
            <TableSkeleton rows={4} isMobileCards />
          ) : data.length === 0 ? (
            <EmptyState
              title={emptyText}
              isFiltered={isFiltered}
              onClearFilters={onClearFilters}
              action={emptyAction}
            />
          ) : (
            data.map((row, index) => {
              const rowKey = keyExtractor(row, index);
              const isSelected = selectedIds.includes(rowKey);

              // Auto-derive title/subtitle if extractors not explicitly provided
              const titleNode = mobileTitleExtractor
                ? mobileTitleExtractor(row)
                : (columns[0]?.render ? columns[0].render(row, index) : ((row as Record<string, any>)[columns[0]?.key] as React.ReactNode));

              const subtitleNode = mobileSubtitleExtractor
                ? mobileSubtitleExtractor(row)
                : columns[1]?.render
                ? columns[1].render(row, index)
                : ((row as Record<string, any>)[columns[1]?.key] as React.ReactNode);

              const badgeNode = mobileBadgeExtractor ? mobileBadgeExtractor(row) : null;

              return (
                <div
                  key={`mobile-${rowKey}`}
                  className={`mgmt-mobile-card ${isSelected ? 'mgmt-mobile-card--selected' : ''}`}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  role="listitem"
                >
                  <div className="mgmt-mobile-card-header">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="mgmt-mobile-card-title">{titleNode}</div>
                      {subtitleNode && (
                        <div className="mgmt-mobile-card-subtitle">{subtitleNode}</div>
                      )}
                    </div>
                    {badgeNode && <div style={{ flexShrink: 0 }}>{badgeNode}</div>}
                  </div>

                  {mobileFields && mobileFields.length > 0 && (
                    <div className="mgmt-mobile-card-grid">
                      {mobileFields.map((f, fIdx) => (
                        <div key={`field-${fIdx}`}>
                          <div className="mgmt-mobile-card-field-label">{f.label}</div>
                          <div className="mgmt-mobile-card-field-value">{f.render(row)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {rowActions.length > 0 && (
                    <div
                      className="mgmt-mobile-card-actions"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {rowActions
                        .filter((act) => {
                          const isHidden = typeof act.hidden === 'function' ? act.hidden(row) : !!act.hidden;
                          const isVis = typeof act.isVisible === 'function' ? act.isVisible(row) : true;
                          return !isHidden && isVis;
                        })
                        .map((action, aIdx) => {
                          const labelText = typeof action.label === 'function' ? action.label(row) : action.label;
                          const iconNode = typeof action.icon === 'function' ? action.icon(row) : action.icon;
                          const actionKey = action.key || action.id || String(aIdx);

                          return (
                            <button
                              key={`mobile-act-${actionKey}`}
                              type="button"
                              onClick={(e) => handleActionClick(action, row, e)}
                              className={`mgmt-mobile-action-btn ${
                                action.variant === 'primary' ? 'primary' : ''
                              }`}
                            >
                              {iconNode}
                              <span>{labelText}</span>
                            </button>
                          );
                        })}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Confirmation Dialog for Dangerous Actions */}
      <ConfirmDialog
        isOpen={Boolean(confirmTarget)}
        title={confirmTarget?.action.confirmTitle || 'Xác nhận hành động'}
        message={
          confirmTarget
            ? typeof confirmTarget.action.confirmMessage === 'function'
              ? confirmTarget.action.confirmMessage(confirmTarget.item)
              : confirmTarget.action.confirmMessage || 'Bạn có chắc chắn muốn thực hiện thao tác này?'
            : ''
        }
        confirmLabel="Đồng ý thực hiện"
        cancelLabel="Hủy bỏ"
        onConfirm={executeConfirmedAction}
        onCancel={() => setConfirmTarget(null)}
      />
    </div>
  );
}

// Export ManagementDataTable as alias
export const ManagementDataTable = DataTable;
