import React from 'react';
import { Search, Plus, LayoutGrid, List } from 'lucide-react';
import type { HskLevel } from '../../../admin/content/types';
import type {
  ClassFilters,
  ClassLifecycleStatus,
  LocationType,
} from '../../types/class.types';

export interface ClassToolbarProps {
  filters: ClassFilters;
  onFilterChange: (filters: ClassFilters) => void;
  hskLevels: HskLevel[];
  viewMode: 'table' | 'grid';
  onViewModeChange: (mode: 'table' | 'grid') => void;
  onCreateClassClick: () => void;
}

export const ClassToolbar: React.FC<ClassToolbarProps> = ({
  filters,
  onFilterChange,
  hskLevels,
  viewMode,
  onViewModeChange,
  onCreateClassClick,
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

  return (
    <div className="tp-toolbar-container">
      {/* Search Input */}
      <div style={{ position: 'relative', flex: '1 1 260px', minWidth: '220px' }}>
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={internalSearch}
          onChange={(e) => setInternalSearch(e.target.value)}
          placeholder="Tìm theo tên hoặc mã lớp (vd: CLS-HSK3)..."
          className="tp-input"
          style={{ paddingLeft: '36px', height: '38px', fontSize: 'var(--text-xs)' }}
        />
      </div>

      {/* Filter Dropdowns */}
      <div className="tp-filter-group">
        {/* Dynamic HSK Level Filter */}
        <select
          value={filters.hskLevelId}
          onChange={(e) => onFilterChange({ ...filters, hskLevelId: e.target.value })}
          className="tp-select"
          aria-label="Lọc theo cấp độ HSK"
        >
          <option value="ALL">Tất cả cấp độ HSK</option>
          {hskLevels.map((lvl) => (
            <option key={lvl.id} value={lvl.id}>
              {lvl.name} ({lvl.levelCode})
            </option>
          ))}
        </select>

        {/* Class Lifecycle Status Filter */}
        <select
          value={filters.status}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              status: e.target.value as 'ALL' | ClassLifecycleStatus,
            })
          }
          className="tp-select"
          aria-label="Lọc theo trạng thái lớp"
        >
          <option value="ALL">Tất cả trạng thái</option>
          <option value="ACTIVE">Đang giảng dạy (Active)</option>
          <option value="UPCOMING">Sắp diễn ra (Upcoming)</option>
          <option value="DRAFT">Bản nháp (Draft)</option>
          <option value="COMPLETED">Đã kết thúc (Completed)</option>
          <option value="ARCHIVED">Đã lưu trữ (Archived)</option>
        </select>

        {/* Location Type Filter */}
        <select
          value={filters.locationType}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              locationType: e.target.value as 'ALL' | LocationType,
            })
          }
          className="tp-select"
          aria-label="Lọc theo hình thức lớp"
        >
          <option value="ALL">Tất cả hình thức</option>
          <option value="ONLINE">Trực tuyến (Online)</option>
          <option value="OFFLINE">Trực tiếp (Offline)</option>
          <option value="HYBRID">Kết hợp (Hybrid)</option>
        </select>

        {/* View Mode Toggle */}
        <div
          style={{
            display: 'inline-flex',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-strong)',
            backgroundColor: 'var(--surface)',
            padding: '2px',
          }}
        >
          <button
            type="button"
            onClick={() => onViewModeChange('table')}
            style={{
              height: '32px',
              padding: '0 8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: viewMode === 'table' ? 'var(--primary-light)' : 'transparent',
              color: viewMode === 'table' ? 'var(--primary)' : 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Dạng Bảng"
            aria-label="Xem dạng bảng"
          >
            <List size={16} />
          </button>
          <button
            type="button"
            onClick={() => onViewModeChange('grid')}
            style={{
              height: '32px',
              padding: '0 8px',
              border: 'none',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: viewMode === 'grid' ? 'var(--primary-light)' : 'transparent',
              color: viewMode === 'grid' ? 'var(--primary)' : 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Dạng Lưới Thẻ"
            aria-label="Xem dạng lưới thẻ"
          >
            <LayoutGrid size={16} />
          </button>
        </div>

        {/* Create Class Action Button */}
        <button
          type="button"
          onClick={onCreateClassClick}
          className="ds-btn ds-btn-primary ds-btn-sm"
          style={{ height: '38px', gap: '6px' }}
        >
          <Plus size={16} /> Tạo Lớp Mới
        </button>
      </div>
    </div>
  );
};
