import React from 'react';

export interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  badge?: string;
}

export const AuthHeader: React.FC<AuthHeaderProps> = ({ title, subtitle, badge }) => {
  return (
    <div style={{ marginBottom: 'var(--space-5)', textAlign: 'left' }}>
      {badge && (
        <span
          style={{
            display: 'inline-block',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--primary)',
            backgroundColor: 'var(--primary-light)',
            padding: '2px 8px',
            borderRadius: 'var(--radius-full)',
            marginBottom: 'var(--space-2)',
          }}
        >
          {badge}
        </span>
      )}
      <h1
        style={{
          fontSize: '1.625rem',
          fontWeight: 700,
          color: 'var(--foreground)',
          letterSpacing: '-0.025em',
          lineHeight: 1.25,
          margin: 0,
          marginBottom: 'var(--space-1-5)',
        }}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--muted)',
            lineHeight: 1.5,
            margin: 0,
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
};
