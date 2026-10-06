import React from 'react';
import { Link } from 'react-router-dom';
import type { SupportOverview } from '../types/dashboard.types';
import { StatusBadge } from '../../shared/components';

export interface SupportOverviewCardProps {
  overview: SupportOverview;
}

export const SupportOverviewCard: React.FC<SupportOverviewCardProps> = ({ overview }) => {
  return (
    <div className="operations-card">
      <div className="operations-card-header">
        <div>
          <h3 className="operations-card-title">Tổng quan hỗ trợ kỹ thuật</h3>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
            Thời gian phản hồi trung bình: <strong>{overview.avgResponseTime}</strong> • Tỷ lệ xử lý: <strong>{overview.resolvedRate}%</strong>
          </p>
        </div>
        <Link to="/management/support/tickets" className="operations-card-action">
          Hộp thư hỗ trợ
        </Link>
      </div>

      <div className="support-stats-pills">
        <div className="support-pill">
          <div className="support-pill-count" style={{ color: '#2563eb' }}>
            {overview.openCount}
          </div>
          <div className="support-pill-label">Yêu cầu mới</div>
        </div>

        <div className="support-pill">
          <div className="support-pill-count" style={{ color: '#ca8a04' }}>
            {overview.pendingCount}
          </div>
          <div className="support-pill-label">Đang giải quyết</div>
        </div>

        <div className="support-pill">
          <div className="support-pill-count" style={{ color: '#dc2626' }}>
            {overview.urgentCount}
          </div>
          <div className="support-pill-label">Cần xử lý gấp</div>
        </div>
      </div>

      <div className="urgent-tickets-list">
        {overview.urgentTickets.map((ticket) => {
          const priorityVariant = ticket.priority === 'urgent' ? 'danger' : 'warning';
          const priorityLabel = ticket.priority === 'urgent' ? 'Gấp' : 'Cao';

          return (
            <div key={ticket.id} className="urgent-ticket-item">
              <div>
                <div className="ticket-subject">{ticket.subject}</div>
                <div className="ticket-meta">
                  <span>{ticket.code}</span> • <span>{ticket.requesterName}</span> • <span>{ticket.timeAgo}</span>
                </div>
              </div>
              <StatusBadge label={priorityLabel} variant={priorityVariant} size="sm" />
            </div>
          );
        })}
      </div>
    </div>
  );
};
