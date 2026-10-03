import React from 'react';
import { Sparkles } from 'lucide-react';

interface AITutorFloatingButtonProps {
  onClick: () => void;
  hasContext?: boolean;
}

export const AITutorFloatingButton: React.FC<AITutorFloatingButtonProps> = ({
  onClick,
  hasContext,
}) => {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 45,
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 20px',
        borderRadius: 'var(--radius-full)',
        backgroundColor: 'var(--primary)',
        color: '#ffffff',
        border: 'none',
        fontSize: 'var(--text-sm)',
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 8px 24px rgba(67, 56, 202, 0.4)',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 12px 28px rgba(67, 56, 202, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(67, 56, 202, 0.4)';
      }}
      title="Mở Trợ giảng AI ZhongWen"
    >
      <Sparkles size={18} />
      <span>Hỏi AI</span>
      {hasContext && (
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--warning)',
            boxShadow: '0 0 6px var(--warning)',
          }}
          title="Đang có ngữ cảnh học tập"
        />
      )}
    </button>
  );
};
