import React from 'react';
import { Search } from 'lucide-react';
import type { HskLevelCode, UserFilters, UserStatus } from '../types/user.types';

export interface UserToolbarProps {
  filters: UserFilters;
  onFilterChange: (newFilters: UserFilters) => void;
  onResetFilters: () => void;
}

const HSK_OPTIONS: HskLevelCode[] = [
  'HSK 1',
  'HSK 2',
  'HSK 3',
  'HSK 4',
  'HSK 5',
  'HSK 6',
  'HSK 7–9',
];

const STATUS_OPTIONS: Array<{ value: 'ALL' | UserStatus; label: string }> = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'LOCKED', label: 'Bị khóa' },
];

export const UserToolbar: React.FC<UserToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const isFiltered =
    filters.search.trim() !== '' ||
    filters.status !== 'ALL' ||
    filters.hskLevel !== 'ALL';

  return (
    <div className="user-toolbar-container">
      <div className="user-toolbar-left">
        {/* Search */}
        <div className="user-search-input-wrap">
          <Search size={15} className="user-search-icon" />
          <input
            type="text"
            className="user-search-input"
            placeholder="Tìm theo tên hoặc email..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            aria-label="Tìm theo tên hoặc email"
          />
        </div>

        {/* Status Filter */}
        <select
          className="user-filter-select"
          value={filters.status}
          onChange={(e) =>
            onFilterChange({ ...filters, status: e.target.value as 'ALL' | UserStatus })
          }
          aria-label="Lọc theo trạng thái tài khoản"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* HSK Filter (Data-Driven) */}
        <select
          className="user-filter-select"
          value={filters.hskLevel}
          onChange={(e) =>
            onFilterChange({ ...filters, hskLevel: e.target.value as 'ALL' | HskLevelCode })
          }
          aria-label="Lọc theo cấp độ HSK"
        >
          <option value="ALL">Tất cả trình độ HSK</option>
          {HSK_OPTIONS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>

        {/* Reset Button */}
        {isFiltered && (
          <button
            type="button"
            className="btn-reset-filters"
            onClick={onResetFilters}
            aria-label="Đặt lại toàn bộ bộ lọc"
          >
            ✕ Đặt lại bộ lọc
          </button>
        )}
      </div>
    </div>
  );
};
