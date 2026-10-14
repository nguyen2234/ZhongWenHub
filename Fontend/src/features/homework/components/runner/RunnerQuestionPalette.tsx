import React from 'react';
import type { StudentQuestionAnswer } from '../../types/student-homework.types';

interface RunnerQuestionPaletteProps {
  totalQuestions: number;
  currentIndex: number;
  answers: Record<string, StudentQuestionAnswer>;
  flaggedIds: Set<string>;
  questionIds: string[];
  onSelectIndex: (index: number) => void;
}

export const RunnerQuestionPalette: React.FC<RunnerQuestionPaletteProps> = ({
  totalQuestions,
  currentIndex,
  answers,
  flaggedIds,
  questionIds,
  onSelectIndex,
}) => {
  const isQuestionAnswered = (qId: string): boolean => {
    const val = answers[qId]?.value;
    if (val === null || val === undefined) return false;
    if (typeof val === 'string') return val.trim().length > 0;
    if (Array.isArray(val)) return val.length > 0;
    if (typeof val === 'object') return Object.keys(val).length > 0;
    return true;
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        padding: 'var(--space-4)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)', margin: 0 }}>
          Danh sách câu hỏi
        </h3>
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
          {totalQuestions} câu
        </span>
      </div>

      {/* Grid of question buttons */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5, 1fr)',
          gap: '8px',
        }}
      >
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const qId = questionIds[idx] || `q-${idx}`;
          const isCurrent = currentIndex === idx;
          const isAnswered = isQuestionAnswered(qId);
          const isFlagged = flaggedIds.has(qId);

          let bg = 'var(--background)';
          let border = '1px solid var(--border)';
          let color = 'var(--foreground)';

          if (isAnswered) {
            bg = 'var(--primary-light)';
            border = '1px solid var(--primary)';
            color = 'var(--primary)';
          }

          if (isCurrent) {
            bg = 'var(--primary)';
            border = '2px solid var(--primary)';
            color = '#ffffff';
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              style={{
                position: 'relative',
                height: '42px',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: bg,
                border,
                color,
                fontWeight: 700,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.12s ease',
              }}
              title={`Câu ${idx + 1}${isAnswered ? ' (Đã trả lời)' : ' (Chưa làm)'}${isFlagged ? ' · Đã gắn cờ' : ''}`}
            >
              <span>{idx + 1}</span>

              {/* Flag badge */}
              {isFlagged && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    width: '10px',
                    height: '10px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: '#d97706',
                    border: '1.5px solid var(--surface)',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '6px',
          paddingTop: 'var(--space-3)',
          borderTop: '1px solid var(--border)',
          fontSize: '11px',
          color: 'var(--muted)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary)',
            }}
          />
          <span>Đang làm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--primary-light)',
              border: '1px solid var(--primary)',
            }}
          />
          <span>Đã trả lời</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'var(--background)',
              border: '1px solid var(--border)',
            }}
          />
          <span>Chưa làm</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: '#d97706',
            }}
          />
          <span>Đã gắn cờ</span>
        </div>
      </div>
    </div>
  );
};
