import React from 'react';
import { Check, Loader2, AlertCircle } from 'lucide-react';
import type { AutosaveStatus } from '../../hooks/useAssignmentAutosave';

interface AutosaveIndicatorProps {
  status: AutosaveStatus;
  lastSavedAt: string | null;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({ status, lastSavedAt }) => {
  if (status === 'IDLE' && !lastSavedAt) {
    return null;
  }

  let text = 'Đã lưu nháp';
  if (lastSavedAt) {
    text = `Đã lưu ${lastSavedAt}`;
  }

  let icon = <Check size={12} style={{ color: '#059669' }} />;
  let color = 'var(--muted)';

  if (status === 'SAVING') {
    text = 'Đang lưu nháp...';
    icon = <Loader2 size={12} style={{ color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />;
    color = 'var(--primary)';
  } else if (status === 'PENDING') {
    text = 'Đang chờ lưu...';
    color = 'var(--muted)';
  } else if (status === 'FAILED') {
    text = 'Lỗi lưu nháp (đang thử lại)';
    icon = <AlertCircle size={12} style={{ color: 'var(--danger)' }} />;
    color = 'var(--danger)';
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        fontSize: '11px',
        color,
        fontWeight: 500,
        transition: 'all 0.2s ease',
      }}
    >
      {icon}
      <span>{text}</span>
    </div>
  );
};
