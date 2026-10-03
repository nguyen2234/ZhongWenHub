import React from 'react';
import { Check, Sparkles, RotateCcw, Lock } from 'lucide-react';

export type LessonStatusType = 'completed' | 'in_progress' | 'review' | 'locked';

export interface LessonStatusProps extends React.HTMLAttributes<HTMLSpanElement> {
  status: LessonStatusType;
}

export const LessonStatus: React.FC<LessonStatusProps> = ({
  status,
  className = '',
  style,
  ...props
}) => {
  const configs: Record<LessonStatusType, { label: string; icon: React.ReactNode; color: string; bg: string; border: string }> = {
    completed: {
      label: 'Hoàn thành',
      icon: <Check size={12} />,
      color: 'var(--success)',
      bg: 'var(--success-bg)',
      border: 'var(--success-border)',
    },
    in_progress: {
      label: 'Đang học',
      icon: <Sparkles size={12} />,
      color: 'var(--primary)',
      bg: 'var(--primary-light)',
      border: 'transparent',
    },
    review: {
      label: 'Cần ôn tập',
      icon: <RotateCcw size={12} />,
      color: 'var(--warning)',
      bg: 'var(--warning-bg)',
      border: 'var(--warning-border)',
    },
    locked: {
      label: 'Đã khóa',
      icon: <Lock size={12} />,
      color: 'var(--neutral)',
      bg: 'var(--neutral-bg)',
      border: 'var(--neutral-border)',
    },
  };

  const current = configs[status] || configs.in_progress;

  return (
    <span
      className={`ds-lesson-status ${className}`.trim()}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: 'var(--radius-full)',
        fontSize: 'var(--text-xs)',
        fontWeight: 600,
        color: current.color,
        backgroundColor: current.bg,
        border: `1px solid ${current.border}`,
        ...style,
      }}
      {...props}
    >
      {current.icon}
      <span>{current.label}</span>
    </span>
  );
};
