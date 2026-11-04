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
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Ngưng hoạt động' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'LOCKED', label: 'Bị khóa' },
];

const ROLE_FILTER_OPTIONS: Array<{ value: 'ALL' | string; label: string }> = [
  { value: 'ALL', label: 'Tất cả vai trò' },
  { value: 'STUDENT', label: 'Học viên' },
  { value: 'TEACHER', label: 'Giáo viên' },
  { value: 'CONTENT_MANAGER', label: 'Quản lý nội dung' },
  { value: 'SUPPORT', label: 'Hỗ trợ viên' },
  { value: 'ADMIN', label: 'Quản trị viên' },
];

export const UserToolbar: React.FC<UserToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const [internalSearch, setInternalSearch] = React.useState(filters.search);

  React.useEffect(() => {
    setInternalSearch(filters.search);
  }, [filters.search]);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (internalSearch !== filters.search) {
        onFilterChange({ ...filters, search: internalSearch });
      }
    }, 250);
    return () => clearTimeout(handler);
  }, [internalSearch, filters, onFilterChange]);

  const isFiltered =
    filters.search.trim() !== '' ||
    filters.status !== 'ALL' ||
    filters.hskLevel !== 'ALL' ||
    (filters.role && filters.role !== 'ALL');

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
            value={internalSearch}
            onChange={(e) => setInternalSearch(e.target.value)}
            aria-label="Tìm theo tên hoặc email"
          />
        </div>

        {/* Role Filter */}
        <select
          className="user-filter-select"
          value={filters.role || 'ALL'}
          onChange={(e) =>
            onFilterChange({ ...filters, role: e.target.value })
          }
          aria-label="Lọc theo vai trò người dùng"
        >
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

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
