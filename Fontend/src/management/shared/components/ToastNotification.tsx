import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastMessage {
  id?: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ToastNotificationProps {
  toast: ToastMessage | null;
  onClose: () => void;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast, onClose }) => {
  useEffect(() => {
    if (!toast) return;
    const duration = toast.duration ?? 4000;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const getStyleAndIcon = () => {
    switch (toast.type) {
      case 'success':
        return {
          icon: <CheckCircle2 size={18} style={{ color: '#16a34a', flexShrink: 0 }} />,
          bg: '#f0fdf4',
          border: '#bbf7d0',
          color: '#166534',
        };
      case 'error':
        return {
          icon: <AlertCircle size={18} style={{ color: '#dc2626', flexShrink: 0 }} />,
          bg: '#fef2f2',
          border: '#fecaca',
          color: '#991b1b',
        };
      case 'warning':
        return {
          icon: <AlertTriangle size={18} style={{ color: '#d97706', flexShrink: 0 }} />,
          bg: '#fffbeb',
          border: '#fde68a',
          color: '#92400e',
        };
      case 'info':
      default:
        return {
          icon: <Info size={18} style={{ color: '#2563eb', flexShrink: 0 }} />,
          bg: '#eff6ff',
          border: '#bfdbfe',
          color: '#1e40af',
        };
    }
  };

  const meta = getStyleAndIcon();

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        maxWidth: '420px',
        minWidth: '280px',
        backgroundColor: meta.bg,
        border: `1px solid ${meta.border}`,
        borderRadius: 'var(--radius-lg, 8px)',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        animation: 'slideUpToast 0.25s ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {meta.icon}
        <span
          style={{
            fontSize: '13px',
            fontWeight: 600,
            color: meta.color,
            lineHeight: 1.4,
          }}
        >
          {toast.message}
        </span>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng thông báo"
        style={{
          border: 'none',
          background: 'none',
          padding: '4px',
          cursor: 'pointer',
          color: meta.color,
          display: 'flex',
          alignItems: 'center',
          opacity: 0.75,
        }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.75')}
      >
        <X size={15} />
      </button>
    </div>
  );
};
