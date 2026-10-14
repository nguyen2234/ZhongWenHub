import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type {
  SupportAccountStatus,
  SupportScope,
  SupportShift,
  SupportStaffFilters,
  SupportWorkStatus,
} from '../types/support-staff.types';
import {
  ALL_SUPPORT_SCOPES,
  ALL_SUPPORT_SHIFTS,
  SUPPORT_SCOPE_META,
  SUPPORT_SHIFT_META,
} from '../types/support-staff.types';

export interface SupportStaffToolbarProps {
  filters: SupportStaffFilters;
  onFilterChange: (newFilters: SupportStaffFilters) => void;
  onResetFilters: () => void;
}

export const SupportStaffToolbar: React.FC<SupportStaffToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.accountStatus !== 'ALL' ||
    filters.workStatus !== 'ALL' ||
    filters.supportScope !== 'ALL' ||
    filters.shift !== 'ALL';

  return (
    <div
      className="support-toolbar-container"
      role="search"
      aria-label="Bộ lọc tìm kiếm nhân viên hỗ trợ"
    >
      <div className="support-toolbar-left">
        {/* Search Input */}
        <div className="support-search-input-wrap">
          <Search size={15} className="support-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="support-search-input"
            placeholder="Tìm theo tên hoặc email..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            aria-label="Tìm kiếm theo tên hoặc email"
          />
        </div>

        {/* Account Status Filter */}
        <select
          className="support-filter-select"
          value={filters.accountStatus}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              accountStatus: e.target.value as 'ALL' | SupportAccountStatus,
            })
          }
          aria-label="Lọc theo trạng thái tài khoản"
        >
          <option value="ALL">Tất cả tài khoản</option>
          <option value="ACTIVE">TK: Hoạt động</option>
          <option value="PENDING">TK: Chờ kích hoạt</option>
          <option value="LOCKED">TK: Bị khóa</option>
          <option value="INACTIVE">TK: Ngừng HĐ</option>
        </select>

        {/* Work Status Filter */}
        <select
          className="support-filter-select"
          value={filters.workStatus}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              workStatus: e.target.value as 'ALL' | SupportWorkStatus,
            })
          }
          aria-label="Lọc theo trạng thái làm việc"
        >
          <option value="ALL">Tất cả trạng thái trực</option>
          <option value="AVAILABLE">Đang sẵn sàng</option>
          <option value="BUSY">Đang bận</option>
          <option value="OFF_DUTY">Hết ca / Ngoại tuyến</option>
          <option value="ON_LEAVE">Nghỉ phép</option>
        </select>

        {/* Support Scope Filter (Data-driven) */}
        <select
          className="support-filter-select"
          value={filters.supportScope}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              supportScope: e.target.value as 'ALL' | SupportScope,
            })
          }
          aria-label="Lọc theo phạm vi hỗ trợ"
        >
          <option value="ALL">Tất cả phạm vi</option>
          {ALL_SUPPORT_SCOPES.map((scope) => (
            <option key={scope} value={scope}>
              {SUPPORT_SCOPE_META[scope]?.shortLabel || scope}
            </option>
          ))}
        </select>

        {/* Shift Filter (Data-driven) */}
        <select
          className="support-filter-select"
          value={filters.shift}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              shift: e.target.value as 'ALL' | SupportShift,
            })
          }
          aria-label="Lọc theo ca làm việc"
        >
          <option value="ALL">Tất cả ca trực</option>
          {ALL_SUPPORT_SHIFTS.map((sh) => (
            <option key={sh} value={sh}>
              {SUPPORT_SHIFT_META[sh]?.shortLabel || sh}
            </option>
          ))}
        </select>

        {/* Reset Filter Action */}
        {isFiltered && (
          <button
            type="button"
            className="btn-toolbar-reset"
            onClick={onResetFilters}
            aria-label="Đặt lại toàn bộ bộ lọc"
          >
            <RotateCcw size={13} />
            Đặt lại
          </button>
        )}
      </div>
    </div>
  );
};
