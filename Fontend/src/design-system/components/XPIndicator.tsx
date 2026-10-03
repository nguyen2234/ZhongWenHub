import React from 'react';
import { Award, Zap } from 'lucide-react';

export interface XPIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
  amount: number;
  label?: string;
  variant?: 'pill' | 'badge' | 'card';
  bonusText?: string;
}

export const XPIndicator: React.FC<XPIndicatorProps> = ({
  amount,
  label,
  variant = 'pill',
  bonusText,
  className = '',
  style,
  ...props
}) => {
  if (variant === 'pill') {
    return (
      <div
        className={`ds-xp-pill ${className}`.trim()}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          padding: '4px 10px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--xp-bg)',
          border: '1px solid var(--xp-border)',
          color: 'var(--xp)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          ...style,
        }}
        {...props}
      >
        <Award size={15} />
        <span>{amount.toLocaleString()} XP</span>
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '3px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-full)',
          backgroundColor: 'var(--xp-bg)',
          color: 'var(--xp)',
          fontSize: 'var(--text-xs)',
          fontWeight: 700,
          border: '1px solid var(--xp-border)',
          ...style,
        }}
        {...props}
      >
        <Zap size={12} />
        <span>+{amount} XP</span>
      </span>
    );
  }

  // Card Variant
  return (
    <div
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--xp-bg)',
        border: '1px solid var(--xp-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        ...style,
      }}
      {...props}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--xp)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Award size={22} />
        </div>
        <div>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 500 }}>
            {label || 'Điểm kinh nghiệm tích lũy'}
          </div>
          <div style={{ fontSize: 'var(--text-xl)', fontWeight: 800, color: 'var(--xp)', lineHeight: 1.1 }}>
            {amount.toLocaleString()} <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>XP</span>
          </div>
        </div>
      </div>

      {bonusText && (
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 600,
            padding: '4px 8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#ffffff',
            color: 'var(--xp)',
            border: '1px solid var(--xp-border)',
          }}
        >
          {bonusText}
        </span>
      )}
    </div>
  );
};
