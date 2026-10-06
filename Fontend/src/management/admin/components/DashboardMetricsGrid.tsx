import React from 'react';
import type { StatMetricItem } from '../types/dashboard.types';

export interface DashboardMetricsGridProps {
  metrics: StatMetricItem[];
}

export const DashboardMetricsGrid: React.FC<DashboardMetricsGridProps> = ({ metrics }) => {
  const renderIcon = (type: StatMetricItem['iconType']) => {
    switch (type) {
      case 'learners':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'activity':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        );
      case 'teachers':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        );
      case 'lessons':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m16 6 4 14" />
            <path d="M12 6v14" />
            <path d="M8 8v12" />
            <path d="M4 4v16" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="dashboard-metrics-grid">
      {metrics.map((item) => {
        const trendClass = item.deltaInRange.trend;
        return (
          <div key={item.id} className="admin-metric-card">
            <div>
              <div className="admin-metric-header">
                <h4 className="admin-metric-title">{item.title}</h4>
                <div className="admin-metric-icon">
                  {renderIcon(item.iconType)}
                </div>
              </div>
              <div className="admin-metric-value">{item.currentTotal}</div>
              <div className="admin-metric-total-label">{item.totalLabel}</div>
            </div>

            <div className="admin-metric-delta-row">
              <span className={`admin-metric-delta-tag ${trendClass}`}>
                {trendClass === 'positive' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="18 15 12 9 6 15" />
                  </svg>
                )}
                {trendClass === 'negative' && (
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                )}
                {item.deltaInRange.percentageText}
              </span>
              <span className="admin-metric-delta-context">
                {item.deltaInRange.timeContext}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
