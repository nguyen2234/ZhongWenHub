import React from 'react';

export interface AuthDividerProps {
  text?: string;
}

export const AuthDivider: React.FC<AuthDividerProps> = ({ text = 'hoặc tiếp tục bằng email' }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        margin: 'var(--space-4) 0',
        width: '100%',
        gap: 'var(--space-3)',
      }}
    >
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-strong)' }} />
      <span
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--muted)',
          textTransform: 'lowercase',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        {text}
      </span>
      <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border-strong)' }} />
    </div>
  );
};
