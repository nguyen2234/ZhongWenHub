import React from 'react';
import type { SupportStaffSummaryKPIs } from '../types/support-staff.types';

export interface SupportStaffSummaryStripProps {
  kpis: SupportStaffSummaryKPIs;
}

export const SupportStaffSummaryStrip: React.FC<SupportStaffSummaryStripProps> = ({ kpis }) => {
  return (
    <div className="support-summary-strip" role="region" aria-label="Thống kê nhanh nhân viên hỗ trợ">
      <div className="support-strip-item">
        <span className="support-strip-dot" style={{ backgroundColor: 'var(--primary)' }} />
        <div className="support-strip-content">
          <span className="support-strip-val">{kpis.totalStaff.toLocaleString()}</span>
          <span className="support-strip-lbl">Tổng nhân viên hỗ trợ</span>
        </div>
      </div>

      <div className="support-strip-item">
        <span className="support-strip-dot" style={{ backgroundColor: '#16a34a' }} />
        <div className="support-strip-content">
          <span className="support-strip-val">{kpis.availableStaff.toLocaleString()}</span>
          <span className="support-strip-lbl">Đang sẵn sàng</span>
        </div>
      </div>

      <div className="support-strip-item">
        <span className="support-strip-dot" style={{ backgroundColor: '#d97706' }} />
        <div className="support-strip-content">
          <span className="support-strip-val">{kpis.busyStaff.toLocaleString()}</span>
          <span className="support-strip-lbl">Đang bận</span>
        </div>
      </div>

      <div className="support-strip-item">
        <span className="support-strip-dot" style={{ backgroundColor: '#0284c7' }} />
        <div className="support-strip-content">
          <span className="support-strip-val">{kpis.totalOpenTickets.toLocaleString()}</span>
          <span className="support-strip-lbl">Ticket đang mở</span>
        </div>
      </div>
    </div>
  );
};
