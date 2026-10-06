import React from 'react';
import type { UserSummaryKPIs } from '../types/user.types';

export interface UserSummaryStripProps {
  kpis: UserSummaryKPIs;
}

export const UserSummaryStrip: React.FC<UserSummaryStripProps> = ({ kpis }) => {
  return (
    <div className="user-summary-strip" role="region" aria-label="Thống kê nhanh học viên">
      <div className="summary-strip-item">
        <span className="summary-strip-dot" style={{ backgroundColor: 'var(--primary)' }} />
        <div className="summary-strip-content">
          <span className="summary-strip-val">{kpis.totalLearners.toLocaleString()}</span>
          <span className="summary-strip-lbl">Tổng học viên</span>
        </div>
      </div>

      <div className="summary-strip-item">
        <span className="summary-strip-dot" style={{ backgroundColor: '#16a34a' }} />
        <div className="summary-strip-content">
          <span className="summary-strip-val">{kpis.activeLearners.toLocaleString()}</span>
          <span className="summary-strip-lbl">Đang hoạt động</span>
        </div>
      </div>

      <div className="summary-strip-item">
        <span className="summary-strip-dot" style={{ backgroundColor: '#dc2626' }} />
        <div className="summary-strip-content">
          <span className="summary-strip-val">{kpis.lockedLearners.toLocaleString()}</span>
          <span className="summary-strip-lbl">Bị khóa</span>
        </div>
      </div>

      <div className="summary-strip-item">
        <span className="summary-strip-dot" style={{ backgroundColor: '#0284c7' }} />
        <div className="summary-strip-content">
          <span className="summary-strip-val">+{kpis.newLearners30d.toLocaleString()}</span>
          <span className="summary-strip-lbl">Mới trong 30 ngày</span>
        </div>
      </div>
    </div>
  );
};
