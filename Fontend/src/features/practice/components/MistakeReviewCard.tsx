import React from 'react';
import { RotateCcw, AlertTriangle, ArrowRight } from 'lucide-react';
import type { MistakeRecord } from '../types';

interface MistakeReviewCardProps {
  mistakes: MistakeRecord[];
  onStartReview: () => void;
}

export const MistakeReviewCard: React.FC<MistakeReviewCardProps> = ({
  mistakes,
  onStartReview,
}) => {
  const grammarCount = mistakes.filter((m) => m.skill === 'grammar').length;
  const vocabCount = mistakes.filter((m) => m.skill === 'vocabulary').length;
  const listenCount = mistakes.filter((m) => m.skill === 'listening').length;
  const otherCount = mistakes.length - (grammarCount + vocabCount + listenCount);

  return (
    <div
      style={{
        borderRadius: 'var(--radius-2xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        padding: 'var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        boxShadow: '0 4px 14px rgba(0,0,0,0.02)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--danger)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <RotateCcw size={17} />
            </div>
            <div>
              <h4 style={{ margin: 0, fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
                Luyện lại lỗi sai
              </h4>
              <span style={{ fontSize: '11px', color: 'var(--danger)', fontWeight: 700 }}>
                {mistakes.length} câu cần củng cố lại
              </span>
            </div>
          </div>

          <div
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--danger-bg)',
              color: 'var(--danger)',
              fontSize: '11px',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <AlertTriangle size={12} />
            <span>Ưu tiên cao</span>
          </div>
        </div>

        {/* Breakdown chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
          >
            Ngữ pháp: <strong style={{ color: 'var(--danger)' }}>{grammarCount}</strong>
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
          >
            Từ vựng: <strong style={{ color: 'var(--primary)' }}>{vocabCount}</strong>
          </span>
          <span
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--background)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            }}
          >
            Nghe: <strong style={{ color: 'var(--warning)' }}>{listenCount}</strong>
          </span>
          {otherCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--background)',
                color: 'var(--muted)',
                border: '1px solid var(--border)',
              }}
            >
              Khác: <strong>{otherCount}</strong>
            </span>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 'var(--space-2)' }}>
        <button
          type="button"
          onClick={onStartReview}
          disabled={mistakes.length === 0}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: mistakes.length > 0 ? 'var(--danger-bg)' : 'var(--background)',
            border: `1.5px solid ${mistakes.length > 0 ? 'var(--danger-border)' : 'var(--border)'}`,
            color: mistakes.length > 0 ? 'var(--danger)' : 'var(--muted)',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            cursor: mistakes.length > 0 ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease',
          }}
        >
          <span>LUYỆN LẠI ({mistakes.length})</span>
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
