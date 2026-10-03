import React from 'react';

export interface ListRowProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  leading?: React.ReactNode;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  trailing?: React.ReactNode;
}

export const ListRow: React.FC<ListRowProps> = ({
  leading,
  title,
  subtitle,
  trailing,
  className = '',
  ...props
}) => {
  return (
    <div className={`ds-list-row ${className}`.trim()} {...props}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: 0 }}>
        {leading && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center' }}>{leading}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--foreground)' }}>
            {title}
          </span>
          {subtitle && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
              {subtitle}
            </span>
          )}
        </div>
      </div>

      {trailing && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>{trailing}</div>}
    </div>
  );
};
