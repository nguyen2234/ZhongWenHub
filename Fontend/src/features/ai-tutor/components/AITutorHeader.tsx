import React from 'react';
import { Sparkles, X } from 'lucide-react';
import type { AITutorContext } from '../types';
import { ContextBuilder } from '../services/ContextBuilder';

interface AITutorHeaderProps {
  context: AITutorContext | null;
  onClose: () => void;
  onClearContext: () => void;
}

export const AITutorHeader: React.FC<AITutorHeaderProps> = ({
  context,
  onClose,
  onClearContext,
}) => {
  const info = ContextBuilder.getReadableHeader(context);

  return (
    <header
      style={{
        padding: 'var(--space-3-5) var(--space-4)',
        borderBottom: '1px solid var(--border)',
        backgroundColor: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {/* Top Row: AI Brand, Close & Clear Context */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-lg)',
              backgroundColor: 'var(--primary)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(67, 56, 202, 0.3)',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: 'var(--text-sm)', fontWeight: 800, color: 'var(--foreground)' }}>
              Trợ giảng AI ZhongWen
            </h3>
            <span style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 600 }}>
              AI Contextual Tutor · HSK 1-6
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          {context && context.source !== 'general' && (
            <button
              type="button"
              onClick={onClearContext}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--muted)',
                cursor: 'pointer',
                fontWeight: 600,
                transition: 'all 0.15s ease',
              }}
              title="Xóa context hiện tại để chuyển sang chế độ gia sư tự do"
            >
              Xóa context ✕
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor: 'var(--background)',
              color: 'var(--muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Đóng trợ giảng"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Context Badge Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'var(--background)',
          padding: '6px 10px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          fontSize: '11px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <strong style={{ color: 'var(--foreground)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {info.title}
          </strong>
          <span style={{ color: 'var(--muted)', fontSize: '10px', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
            {info.sublabel}
          </span>
        </div>

        {info.tag && (
          <span
            style={{
              padding: '2px 6px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(99, 102, 241, 0.1)',
              color: 'var(--primary)',
              fontWeight: 700,
              fontSize: '10px',
              flexShrink: 0,
            }}
          >
            {info.tag}
          </span>
        )}
      </div>
    </header>
  );
};
