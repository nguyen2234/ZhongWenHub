import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ConfirmLeaveDialogProps {
  isOpen: boolean;
  onContinueEditing: () => void;
  onDiscardAndLeave: () => void;
}

export const ConfirmLeaveDialog: React.FC<ConfirmLeaveDialogProps> = ({
  isOpen,
  onContinueEditing,
  onDiscardAndLeave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        zIndex: 80,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 'var(--space-4)',
      }}
    >
      <div
        style={{
          backgroundColor: 'var(--surface)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '460px',
          padding: 'var(--space-6)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 'var(--space-4)',
        }}
      >
        <div
          style={{
            width: '48px',
            height: '48px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: '#fee2e2',
            color: '#b91c1c',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AlertTriangle size={24} />
        </div>

        <div>
          <h3 style={{ margin: '0 0 var(--space-2) 0', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
            Xác nhận rời khỏi trình soạn bài
          </h3>
          <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)', lineHeight: 1.5 }}>
            Bạn có thay đổi chưa lưu. Nếu rời trình soạn bài, các thay đổi này sẽ bị mất.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', width: '100%', marginTop: 'var(--space-2)' }}>
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            style={{ flex: 1 }}
            onClick={onContinueEditing}
          >
            Tiếp tục chỉnh sửa
          </button>
          <button
            type="button"
            className="ds-btn ds-btn-outline"
            style={{ flex: 1, borderColor: 'var(--danger)', color: 'var(--danger)' }}
            onClick={onDiscardAndLeave}
          >
            Rời đi và bỏ thay đổi
          </button>
        </div>
      </div>
    </div>
  );
};
