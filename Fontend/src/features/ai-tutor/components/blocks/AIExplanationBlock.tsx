import React from 'react';
import { Lightbulb, Info } from 'lucide-react';
import type { AIExplanationBlockData } from '../../types';

interface AIExplanationBlockProps {
  data: AIExplanationBlockData;
}

export const AIExplanationBlock: React.FC<AIExplanationBlockProps> = ({ data }) => {
  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-2)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <Lightbulb size={16} style={{ color: 'var(--warning)', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 'var(--text-xs)',
            fontWeight: 800,
            color: 'var(--foreground)',
            textTransform: 'uppercase',
            letterSpacing: '0.4px',
          }}
        >
          {data.title || 'GIẢI THÍCH NGỮ PHÁP'}
        </span>
      </div>

      <div
        style={{
          fontSize: 'var(--text-xs)',
          color: 'var(--foreground)',
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
        }}
      >
        {data.content}
      </div>

      {data.note && (
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--muted)',
            backgroundColor: 'var(--background)',
            padding: 'var(--space-2) var(--space-2-5)',
            borderRadius: 'var(--radius-lg)',
            borderLeft: '3px solid var(--primary)',
            marginTop: '2px',
          }}
        >
          <Info size={13} style={{ color: 'var(--primary)', marginTop: '2px', flexShrink: 0 }} />
          <span>{data.note}</span>
        </div>
      )}
    </div>
  );
};
