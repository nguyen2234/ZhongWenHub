import React from 'react';
import { X } from 'lucide-react';
import type { AITutorContext } from '../types';
import { StickerIllustration } from '../../../design-system';

interface AITutorHeaderProps {
  context?: AITutorContext | null;
  onClose: () => void;
  onClearContext?: () => void;
}

export const AITutorHeader: React.FC<AITutorHeaderProps> = ({
  onClose,
}) => {
  return (
    <header
      className="ai-tutor-drawer-header"
      style={{
        padding: '12px 16px',
        borderBottom: '1px solid #e2e8f0',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px',
        flexShrink: 0,
      }}
    >
      {/* Left: Preserved AI ZhongWen character icon, Title & Minimal Subtitle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-lg)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <StickerIllustration name="aiTutor" size="sm" decorative />
        </div>
        <div style={{ minWidth: 0 }}>
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--text-sm)',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.25,
            }}
          >
            Trợ giảng AI ZhongWen
          </h3>
          <span
            style={{
              display: 'block',
              fontSize: '11px',
              color: '#64748b',
              fontWeight: 500,
              lineHeight: 1.3,
            }}
          >
            AI Contextual Tutor
          </span>
        </div>
      </div>

      {/* Right: Close Button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Đóng Trợ giảng AI"
        title="Đóng trợ giảng"
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '9999px',
          border: '1px solid #e2e8f0',
          backgroundColor: '#f8fafc',
          color: '#64748b',
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 0.15s ease, color 0.15s ease',
        }}
      >
        <X size={16} />
      </button>
    </header>
  );
};
