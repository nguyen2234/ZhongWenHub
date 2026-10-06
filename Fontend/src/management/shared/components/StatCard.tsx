import React from 'react';
import type { StatCardData } from '../types';

export interface StatCardProps extends StatCardData {
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeType = 'neutral',
  icon,
  description,
  onClick,
}) => {
  const getChangeColor = () => {
    if (changeType === 'positive') return 'var(--success)';
    if (changeType === 'negative') return 'var(--danger)';
    return 'var(--muted)';
  };

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-4)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>{title}</span>
        {icon && <div style={{ color: 'var(--primary)' }}>{icon}</div>}
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--foreground)' }}>
        {value}
      </div>
      {(change || description) && (
        <div style={{ marginTop: 'var(--space-2)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {change && (
            <span style={{ color: getChangeColor(), fontWeight: 700 }}>
              {change}
            </span>
          )}
          {description && <span style={{ color: 'var(--muted)' }}>{description}</span>}
        </div>
      )}
    </div>
  );
};
