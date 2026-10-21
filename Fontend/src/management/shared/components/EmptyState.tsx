import React from 'react';
import { Inbox } from 'lucide-react';
import '../styles/management-table.css';

export interface ManagementEmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  isFiltered?: boolean;
  onClearFilters?: () => void;
}

export const EmptyState: React.FC<ManagementEmptyStateProps> = ({
  title,
  description,
  action,
  icon,
  isFiltered = false,
  onClearFilters,
}) => {
  const displayTitle = title || (isFiltered ? 'Không tìm thấy kết quả phù hợp' : 'Chưa có dữ liệu');
  const displayDesc =
    description ||
    (isFiltered
      ? 'Hãy thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh lại các bộ lọc đang chọn.'
      : 'Hiện tại chưa có bản ghi nào trong hệ thống.');

  return (
    <div className="mgmt-state-container" role="status" aria-live="polite">
      {icon ? (
        <div className="mgmt-state-icon" aria-hidden="true">{icon}</div>
      ) : (
        <Inbox className="mgmt-state-icon" aria-hidden="true" />
      )}
      <h3 className="mgmt-state-title">{displayTitle}</h3>
      <p className="mgmt-state-desc">{displayDesc}</p>
      {onClearFilters && (
        <button
          type="button"
          onClick={onClearFilters}
          className="mgmt-mobile-action-btn"
          style={{ marginTop: '8px' }}
        >
          Xóa tất cả bộ lọc
        </button>
      )}
      {action && <div className="mgmt-state-action">{action}</div>}
    </div>
  );
};
