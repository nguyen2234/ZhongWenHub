import React from 'react';
import { Search, RotateCcw } from 'lucide-react';
import type {
  TeacherAccountStatus,
  TeacherFilters,
  TeacherSpecialization,
  TeacherTeachingStatus,
  TeachingLevel,
} from '../types/teacher.types';

export interface TeacherToolbarProps {
  filters: TeacherFilters;
  onFilterChange: (newFilters: TeacherFilters) => void;
  onResetFilters: () => void;
}

export const TeacherToolbar: React.FC<TeacherToolbarProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
}) => {
  const isFiltered =
    Boolean(filters.search.trim()) ||
    filters.accountStatus !== 'ALL' ||
    filters.teachingStatus !== 'ALL' ||
    filters.teachingLevel !== 'ALL' ||
    filters.specialization !== 'ALL';

  return (
    <div className="teacher-toolbar-container" role="search" aria-label="Bộ lọc tìm kiếm giáo viên">
      <div className="teacher-toolbar-left">
        {/* Search Input */}
        <div className="teacher-search-input-wrap">
          <Search size={15} className="teacher-search-icon" aria-hidden="true" />
          <input
            type="text"
            className="teacher-search-input"
            placeholder="Tìm theo tên hoặc email..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            aria-label="Tìm kiếm theo tên hoặc email"
          />
        </div>

        {/* Account Status Filter */}
        <select
          className="teacher-filter-select"
          value={filters.accountStatus}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              accountStatus: e.target.value as 'ALL' | TeacherAccountStatus,
            })
          }
          aria-label="Lọc theo trạng thái tài khoản"
        >
          <option value="ALL">Tất cả tài khoản</option>
          <option value="ACTIVE">TK: Đang hoạt động</option>
          <option value="PENDING">TK: Chờ duyệt</option>
          <option value="LOCKED">TK: Bị khóa</option>
          <option value="INACTIVE">TK: Ngừng hoạt động</option>
        </select>

        {/* Teaching Status Filter */}
        <select
          className="teacher-filter-select"
          value={filters.teachingStatus}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              teachingStatus: e.target.value as 'ALL' | TeacherTeachingStatus,
            })
          }
          aria-label="Lọc theo trạng thái giảng dạy"
        >
          <option value="ALL">Tất cả trạng thái dạy</option>
          <option value="ACTIVE">Đang giảng dạy</option>
          <option value="ON_LEAVE">Tạm nghỉ</option>
          <option value="INACTIVE">Ngừng giảng dạy</option>
        </select>

        {/* Teaching Level Filter */}
        <select
          className="teacher-filter-select"
          value={filters.teachingLevel}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              teachingLevel: e.target.value as 'ALL' | TeachingLevel,
            })
          }
          aria-label="Lọc theo cấp HSK giảng dạy"
        >
          <option value="ALL">Tất cả cấp HSK</option>
          <option value="HSK 1">HSK 1</option>
          <option value="HSK 2">HSK 2</option>
          <option value="HSK 3">HSK 3</option>
          <option value="HSK 4">HSK 4</option>
          <option value="HSK 5">HSK 5</option>
          <option value="HSK 6">HSK 6</option>
          <option value="HSK 7–9">HSK 7–9</option>
        </select>

        {/* Specialization Filter */}
        <select
          className="teacher-filter-select"
          value={filters.specialization}
          onChange={(e) =>
            onFilterChange({
              ...filters,
              specialization: e.target.value as 'ALL' | TeacherSpecialization,
            })
          }
          aria-label="Lọc theo chuyên môn"
        >
          <option value="ALL">Tất cả chuyên môn</option>
          <option value="GRAMMAR">Ngữ pháp</option>
          <option value="VOCABULARY">Từ vựng</option>
          <option value="PRONUNCIATION">Phát âm & Thanh điệu</option>
          <option value="CONVERSATION">Hội thoại khẩu ngữ</option>
          <option value="LISTENING">Luyện nghe phản xạ</option>
          <option value="WRITING">Luyện viết đoạn văn</option>
          <option value="HSKK">Khẩu ngữ HSKK</option>
          <option value="HSK_EXAM">Luyện thi HSK</option>
        </select>
      </div>

      {isFiltered && (
        <button
          type="button"
          className="btn-reset-teacher-filters"
          onClick={onResetFilters}
          title="Xóa toàn bộ bộ lọc và tìm kiếm"
        >
          <RotateCcw size={12} style={{ display: 'inline', marginRight: 4 }} />
          Đặt lại bộ lọc
        </button>
      )}
    </div>
  );
};
