import React from 'react';

export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  breadcrumb?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  actions,
  breadcrumb,
}) => {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      {breadcrumb && <div style={{ marginBottom: 'var(--space-2)' }}>{breadcrumb}</div>}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
            {title}
          </h1>
          {subtitle && (
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '4px', margin: 0 }}>
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>{actions}</div>}
      </div>
    </div>
  );
};
