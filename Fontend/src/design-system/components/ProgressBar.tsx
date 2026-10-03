import React from 'react';

export interface ProgressBarProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  variant?: 'primary' | 'streak' | 'xp' | 'success';
  showPercentage?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  variant = 'primary',
  showPercentage = true,
}) => {
  const percentage = Math.min(100, Math.max(0, Math.round((value / max) * 100)));
  const fillVariantClass = variant === 'primary' ? '' : `fill-${variant}`;

  return (
    <div className="ds-progress-container">
      {(label || showPercentage) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', fontWeight: 500, color: 'var(--muted)' }}>
          {label && <span>{label}</span>}
          {showPercentage && <span style={{ color: 'var(--foreground)', fontWeight: 600 }}>{percentage}%</span>}
        </div>
      )}
      <div className="ds-progress-track">
        <div
          className={`ds-progress-fill ${fillVariantClass}`.trim()}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
