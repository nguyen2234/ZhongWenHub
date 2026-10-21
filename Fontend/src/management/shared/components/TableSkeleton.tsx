import React from 'react';
import '../styles/management-table.css';

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  isMobileCards?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 5,
  isMobileCards = false,
}) => {
  if (isMobileCards) {
    return (
      <div className="mgmt-mobile-list" style={{ display: 'flex' }} aria-busy="true" aria-label="Đang tải dữ liệu">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={`skel-card-${i}`} className="mgmt-mobile-card" style={{ opacity: 0.8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
              <div className="mgmt-skeleton-bar" style={{ width: '45%' }} />
              <div className="mgmt-skeleton-bar" style={{ width: '20%' }} />
            </div>
            <div className="mgmt-skeleton-bar" style={{ width: '70%', height: '12px', marginTop: '4px' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', margin: '8px 0' }}>
              <div className="mgmt-skeleton-bar" style={{ height: '24px' }} />
              <div className="mgmt-skeleton-bar" style={{ height: '24px' }} />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div aria-busy="true" aria-label="Đang tải dữ liệu" style={{ width: '100%' }}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={`skel-row-${rIdx}`} className="mgmt-skeleton-row">
          {Array.from({ length: columns }).map((_, cIdx) => {
            const widthPercent = cIdx === 0 ? 30 : cIdx === columns - 1 ? 15 : 20;
            return (
              <div
                key={`skel-cell-${rIdx}-${cIdx}`}
                className="mgmt-skeleton-bar"
                style={{ width: `${widthPercent}%` }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};
