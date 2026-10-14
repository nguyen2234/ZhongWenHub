import React from 'react';
import { Clock, AlertTriangle } from 'lucide-react';

interface RunnerTimerProps {
  formattedTime: string;
  isWarning5Min: boolean;
  isWarning1Min: boolean;
  isExpired: boolean;
}

export const RunnerTimer: React.FC<RunnerTimerProps> = ({
  formattedTime,
  isWarning5Min,
  isWarning1Min,
  isExpired,
}) => {
  let bg = 'var(--background)';
  let borderColor = 'var(--border)';
  let textColor = 'var(--foreground)';
  let iconColor = 'var(--primary)';

  if (isExpired) {
    bg = 'rgba(239, 68, 68, 0.15)';
    borderColor = 'var(--danger)';
    textColor = 'var(--danger)';
    iconColor = 'var(--danger)';
  } else if (isWarning1Min) {
    bg = 'rgba(239, 68, 68, 0.12)';
    borderColor = 'var(--danger)';
    textColor = 'var(--danger)';
    iconColor = 'var(--danger)';
  } else if (isWarning5Min) {
    bg = 'rgba(245, 158, 11, 0.12)';
    borderColor = '#d97706';
    textColor = '#d97706';
    iconColor = '#d97706';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 14px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: bg,
        border: `1.5px solid ${borderColor}`,
        color: textColor,
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '0.5px',
        transition: 'all 0.2s ease',
      }}
      title={isWarning1Min ? 'Sắp hết giờ làm bài!' : isWarning5Min ? 'Còn dưới 5 phút!' : 'Thời gian còn lại'}
    >
      {isWarning1Min || isExpired ? (
        <AlertTriangle size={15} style={{ color: iconColor }} />
      ) : (
        <Clock size={15} style={{ color: iconColor }} />
      )}
      <span>{isExpired ? 'Hết giờ làm bài' : formattedTime}</span>
    </div>
  );
};
