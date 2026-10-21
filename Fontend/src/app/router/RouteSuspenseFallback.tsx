import React from 'react';

/**
 * Lightweight, zero-shift suspense fallback for route-level code splitting.
 */
export const RouteSuspenseFallback: React.FC = () => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        width: '100%',
        color: 'var(--text-secondary, #64748b)',
        fontSize: '0.95rem',
      }}
      role="status"
      aria-label="Đang tải trang..."
    >
      <div
        style={{
          width: '26px',
          height: '26px',
          border: '3px solid #e2e8f0',
          borderTopColor: 'var(--primary, #E60012)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
          marginRight: '12px',
        }}
      />
      <span>Đang tải nội dung...</span>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};
