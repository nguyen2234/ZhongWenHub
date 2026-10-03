import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import type { AICorrectionBlockData } from '../../types';

interface AICorrectionBlockProps {
  data: AICorrectionBlockData;
}

export const AICorrectionBlock: React.FC<AICorrectionBlockProps> = ({ data }) => {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <div
          style={{
            width: '20px',
            height: '20px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Check size={12} />
        </div>
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            color: 'var(--foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          PHÂN TÍCH & SỬA LỖI CÂU
        </span>
      </div>

      {/* Comparison Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
          backgroundColor: 'var(--background)',
          padding: 'var(--space-3)',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Original Sentence with Diff highlight */}
        <div>
          <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase' }}>
            CÂU CỦA BẠN:
          </div>
          <div
            style={{
              fontFamily: 'var(--font-hanzi)',
              fontSize: 'var(--text-base)',
              fontWeight: 600,
              marginTop: '2px',
            }}
          >
            {data.diffItems.map((item, idx) => {
              if (item.type === 'removed') {
                return (
                  <span
                    key={idx}
                    style={{
                      color: 'var(--danger)',
                      backgroundColor: 'var(--danger-bg)',
                      padding: '1px 4px',
                      borderRadius: 'var(--radius-sm)',
                      textDecoration: 'line-through',
                      margin: '0 2px',
                    }}
                    title="Từ thừa hoặc sai ngữ cảnh"
                  >
                    {item.text}
                  </span>
                );
              }
              return <span key={idx}>{item.text}</span>;
            })}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--muted)' }}>
          <ArrowRight size={14} />
          <span style={{ fontSize: '11px', fontWeight: 600 }}>GỢI Ý CHUẨN TỪ TRỢ GIẢNG:</span>
        </div>

        {/* Corrected with Typography Hierarchy */}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-hanzi)',
              fontSize: 'var(--text-lg)',
              fontWeight: 700,
              color: 'var(--success)',
            }}
          >
            {data.correctedSentence}
          </div>
          <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--primary)', marginTop: '2px' }}>
            {data.pinyin}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', marginTop: '1px' }}>
            &quot;{data.vietnamese}&quot;
          </div>
        </div>
      </div>

      {/* Explanation */}
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--foreground)', lineHeight: 1.5 }}>
        💡 <strong>Giải thích:</strong> {data.explanation}
      </div>
    </div>
  );
};
