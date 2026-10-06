import React from 'react';
import type { RecentActivity } from '../types/dashboard.types';

export interface RecentActivityFeedProps {
  activities: RecentActivity[];
}

export const RecentActivityFeed: React.FC<RecentActivityFeedProps> = ({ activities }) => {
  return (
    <div className="operations-card">
      <div className="operations-card-header">
        <h3 className="operations-card-title">Nhật ký hoạt động gần đây</h3>
        <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
          Hệ thống & Đào tạo
        </span>
      </div>

      <div className="activity-timeline">
        {activities.map((item) => (
          <div key={item.id} className="timeline-item">
            <div className="timeline-dot" />
            <div className="timeline-content">
              <span className="timeline-actor">{item.actorName}</span>{' '}
              <span style={{ color: 'var(--muted)', fontSize: '11px' }}>({item.actorRole})</span>{' '}
              <span>{item.actionText}</span>{' '}
              <span className="timeline-target">"{item.targetName}"</span>
            </div>
            <div className="timeline-time">{item.timestamp}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
