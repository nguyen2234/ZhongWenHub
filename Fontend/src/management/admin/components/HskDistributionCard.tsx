import React from 'react';
import type { HskDistributionItem } from '../types/dashboard.types';

export interface HskDistributionCardProps {
  distribution: HskDistributionItem[];
}

export const HskDistributionCard: React.FC<HskDistributionCardProps> = ({ distribution }) => {
  const totalLearners = distribution.reduce((acc, curr) => acc + curr.learnerCount, 0);

  return (
    <div className="hsk-distribution-card">
      <div className="hsk-distribution-header">
        <div>
          <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            Phân bổ trình độ HSK
          </h3>
          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: '3px 0 0 0' }}>
            Tổng số: {totalLearners.toLocaleString()} học viên đang theo học
          </p>
        </div>
        <span
          style={{
            fontSize: '11px',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--primary-light)',
            color: 'var(--primary)',
          }}
        >
          {distribution.length} cấp độ
        </span>
      </div>

      <div className="hsk-list-container">
        {distribution.map((item) => {
          return (
            <div key={item.levelId} className="hsk-item-row">
              <div className="hsk-item-info">
                <div className="hsk-item-label-group">
                  <span className="hsk-level-badge">{item.label}</span>
                  {item.stageNote && (
                    <span className="hsk-stage-note">{item.stageNote}</span>
                  )}
                </div>

                <div className="hsk-item-count-group">
                  <span className="hsk-item-learners">
                    {item.learnerCount.toLocaleString()}
                  </span>
                  <span className="hsk-item-percent">{item.percentage}%</span>
                </div>
              </div>

              <div className="hsk-progress-track">
                <div
                  className="hsk-progress-bar"
                  style={{
                    width: `${Math.min(100, Math.max(1, item.percentage))}%`,
                    backgroundColor: item.colorVar || 'var(--primary)',
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          marginTop: 'var(--space-4)',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border-subtle)',
          fontSize: '11px',
          color: 'var(--muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Phổ cập cao nhất: <strong>HSK 1 - HSK 2 (55%)</strong></span>
        <span>Chuẩn mới HSK 3.0</span>
      </div>
    </div>
  );
};
