import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  footer?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  title,
  icon,
  action,
  footer,
  children,
  className = '',
  ...props
}) => {
  return (
    <section className={`ds-card ${className}`.trim()} {...props}>
      {(title || action) && (
        <header className="ds-card-header">
          <div className="ds-card-title-group">
            {icon && <span style={{ display: 'inline-flex', color: 'var(--primary)' }}>{icon}</span>}
            {title && <h3 className="ds-card-title">{title}</h3>}
          </div>
          {action && <div className="ds-card-action">{action}</div>}
        </header>
      )}

      <div className="ds-card-body">{children}</div>

      {footer && (
        <footer style={{ marginTop: 'var(--space-4)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--border)' }}>
          {footer}
        </footer>
      )}
    </section>
  );
};
