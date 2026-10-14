import React from 'react';
import { Activity, UserPlus, FileText, CalendarCheck, Settings } from 'lucide-react';
import type { RecentClassActivity } from '../../types/dashboard.types';

export interface RecentActivityListProps {
  activities: RecentClassActivity[];
}

export const RecentActivityList: React.FC<RecentActivityListProps> = ({ activities }) => {
  const getIcon = (type: string) => {
    switch (type) {
      case 'ENROLLMENT':
        return <UserPlus size={14} style={{ color: '#059669' }} />;
      case 'SUBMISSION':
        return <FileText size={14} style={{ color: 'var(--primary)' }} />;
      case 'SCHEDULE':
        return <CalendarCheck size={14} style={{ color: '#0284c7' }} />;
      default:
        return <Settings size={14} style={{ color: 'var(--muted)' }} />;
    }
  };

  return (
    <div className="tp-card">
      <div className="tp-card-header">
        <div>
          <h2 className="tp-card-title">
            <Activity size={18} style={{ color: 'var(--primary)' }} />
            Hoạt Động Gần Đây
          </h2>
          <div className="tp-card-subtitle">Nhật ký sự kiện trong các lớp</div>
        </div>
      </div>

      {activities.length === 0 ? (
        <div
          style={{
            padding: 'var(--space-6)',
            textAlign: 'center',
            color: 'var(--muted)',
            fontSize: 'var(--text-sm)',
          }}
        >
          Chưa có hoạt động nào được ghi nhận.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {activities.map((act) => (
            <div
              key={act.id}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 'var(--space-3)',
                paddingBottom: 'var(--space-3)',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                {getIcon(act.type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 'var(--space-2)',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: 700,
                      color: 'var(--foreground)',
                    }}
                  >
                    {act.title}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--muted)', flexShrink: 0 }}>
                    {act.timeAgo}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '11px',
                    color: 'var(--muted)',
                    marginTop: '2px',
                    lineHeight: 1.4,
                  }}
                >
                  {act.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
