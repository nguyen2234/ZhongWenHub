import React from 'react';

export type HSKLevelType = 1 | 2 | 3 | 4 | 5 | 6 | 7 | '7-9';

export interface HSKLevelProps extends React.HTMLAttributes<HTMLSpanElement> {
  level: HSKLevelType;
  showFullLabel?: boolean;
}

export const HSKLevel: React.FC<HSKLevelProps> = ({
  level,
  showFullLabel = false,
  className = '',
  style,
  ...props
}) => {
  const levelStyles: Record<string, { color: string; bg: string; border: string }> = {
    '1': { color: 'var(--hsk1)', bg: 'var(--hsk1-bg)', border: 'var(--hsk1-border)' },
    '2': { color: 'var(--hsk2)', bg: 'var(--hsk2-bg)', border: 'var(--hsk2-border)' },
    '3': { color: 'var(--hsk3)', bg: 'var(--hsk3-bg)', border: 'var(--hsk3-border)' },
    '4': { color: 'var(--hsk4)', bg: 'var(--hsk4-bg)', border: 'var(--hsk4-border)' },
    '5': { color: 'var(--hsk5)', bg: 'var(--hsk5-bg)', border: 'var(--hsk5-border)' },
    '6': { color: 'var(--hsk6)', bg: 'var(--hsk6-bg)', border: 'var(--hsk6-border)' },
    '7': { color: 'var(--hsk7-9)', bg: 'var(--hsk7-9-bg)', border: 'var(--hsk7-9-border)' },
    '7-9': { color: 'var(--hsk7-9)', bg: 'var(--hsk7-9-bg)', border: 'var(--hsk7-9-border)' },
  };

  const key = String(level);
  const current = levelStyles[key] || levelStyles['1'];

  const labelText = key === '7' || key === '7-9' ? 'HSK 7–9' : `HSK ${level}`;
  const fullLabelText = key === '7' || key === '7-9' ? 'Cấp độ HSK 7–9' : `Cấp độ HSK ${level}`;

  return (
    <span
      className={`ds-hsk-badge ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 700,
        letterSpacing: '0.02em',
        color: current.color,
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        ...style,
      }}
      {...props}
    >
      {showFullLabel ? fullLabelText : labelText}
    </span>
  );
};
