import React from 'react';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';
import type { HskLevel } from '../../../admin/content/types';
import type { AssignmentFilters, AssignmentStatus } from '../../types';

interface AssignmentToolbarProps {
  filters: AssignmentFilters;
  onFilterChange: (filters: AssignmentFilters) => void;
  hskLevels: HskLevel[];
  ownedClasses: Array<{ id: string; name: string }>;
  onCreateClick: () => void;
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
}

export const AssignmentToolbar: React.FC<AssignmentToolbarProps> = ({
  filters,
  onFilterChange,
  hskLevels,
  ownedClasses,
  onCreateClick,
  viewMode,
  onViewModeChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleHskChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, hskLevelId: e.target.value });
  };

  const handleClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, classId: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      status: e.target.value as AssignmentStatus | 'ALL',
    });
  };

  return (
    <div className="tp-toolbar-container">
      <div className="tp-search-box">
        <Search size={16} className="tp-search-icon" />
        <input
          type="text"
          className="tp-input tp-search-input"
          placeholder="Tìm theo tiêu đề bài tập..."
          value={filters.search}
          onChange={handleSearchChange}
        />
      </div>

      <div className="tp-filter-group">
        {/* HSK Level Filter */}
        <select
          className="tp-select"
          value={filters.hskLevelId}
          onChange={handleHskChange}
          aria-label="Lọc theo cấp độ HSK"
        >
          <option value="ALL">Tất cả cấp độ</option>
          {hskLevels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name}
            </option>
          ))}
        </select>

        {/* Class Filter */}
        <select
          className="tp-select"
          value={filters.classId}
          onChange={handleClassChange}
          aria-label="Lọc theo lớp học"
        >
          <option value="ALL">Tất cả lớp học</option>
          {ownedClasses.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name}
            </option>
          ))}
        </select>

        {/* Status Filter */}
        <select
          className="tp-select"
          value={filters.status}
          onChange={handleStatusChange}
          aria-label="Lọc theo trạng thái"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="DRAFT">Bản nháp</option>
          <option value="PUBLISHED">Đã phát hành</option>
          <option value="CLOSED">Đã đóng nộp</option>
          <option value="ARCHIVED">Đã lưu trữ</option>
        </select>

        {/* View Switcher */}
        <div className="tp-view-toggle">
          <button
            type="button"
            className={`tp-toggle-btn ${viewMode === 'table' ? 'tp-toggle-btn--active' : ''}`}
            onClick={() => onViewModeChange('table')}
            title="Dạng bảng (Desktop)"
            aria-label="Chế độ bảng"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            className={`tp-toggle-btn ${viewMode === 'grid' ? 'tp-toggle-btn--active' : ''}`}
            onClick={() => onViewModeChange('grid')}
            title="Dạng thẻ (Lưới)"
            aria-label="Chế độ lưới"
          >
            <LayoutGrid size={16} />
          </button>
        </div>

        {/* Create Button */}
        <button
          type="button"
          className="tp-btn tp-btn--primary"
          onClick={onCreateClick}
        >
          <Plus size={16} />
          <span>Tạo bài tập mới</span>
        </button>
      </div>
    </div>
  );
};
