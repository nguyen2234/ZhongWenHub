import React from 'react';
import type { ContentScale } from '../types/dashboard.types';

export interface ContentScaleCardProps {
  contentScale: ContentScale;
  rangeLabel: string;
}

export const ContentScaleCard: React.FC<ContentScaleCardProps> = ({
  contentScale,
  rangeLabel,
}) => {
  const items = [
    contentScale.vocabulary,
    contentScale.grammar,
    contentScale.characters,
    contentScale.lessons,
    contentScale.exercises,
  ];

  return (
    <div className="operations-card">
      <div className="operations-card-header">
        <div>
          <h3 className="operations-card-title">Quy mô kho học liệu</h3>
          <p style={{ fontSize: '11px', color: 'var(--muted)', margin: '2px 0 0 0' }}>
            Tổng tài nguyên đào tạo và mức bổ sung trong {rangeLabel}
          </p>
        </div>
      </div>

      <div className="content-scale-grid">
        {items.map((item) => (
          <div key={item.key} className="content-scale-cell">
            <div className="content-scale-val">
              {item.totalCount.toLocaleString()}
            </div>
            <div className="content-scale-label">
              {item.label}
            </div>
            <div className="content-scale-delta">
              +{item.addedInRange} {item.unit}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
