import React from 'react';

export interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const AuthCard: React.FC<AuthCardProps> = ({ children, className = '', style }) => {
  return (
    <div
      className={'auth-card ' + className.trim()}
      style={{
        width: '100%',
        maxWidth: '440px',
        margin: '0 auto',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        padding: 'clamp(20px, 4vw, 36px)',
        border: '1px solid var(--border-strong)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.05)',
        ...style,
      }}
    >
      {children}
    </div>
  );
};
