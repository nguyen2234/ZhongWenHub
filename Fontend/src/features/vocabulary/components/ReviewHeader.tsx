import React from 'react';
import { X, Sparkles } from 'lucide-react';

interface ReviewHeaderProps {
  currentIndex: number;
  totalCards: number;
  onExit: () => void;
}

export const ReviewHeader: React.FC<ReviewHeaderProps> = ({
  currentIndex,
  totalCards,
  onExit,
}) => {
  const progressPercent = totalCards > 0 ? Math.round(((currentIndex + 1) / totalCards) * 100) : 0;

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        padding: 'var(--space-2-5) var(--space-4)',
      }}
    >
      <div
        style={{
          maxWidth: '680px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-2)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {/* Exit Focus Mode button */}
          <button
            type="button"
            onClick={onExit}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--muted)',
              fontSize: 'var(--text-xs)',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            <X size={14} />
            <span>Thoát</span>
          </button>

          {/* Title in center */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={14} style={{ color: 'var(--streak)' }} />
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Ôn tập Spaced Repetition
            </span>
          </div>

          {/* Counter 7 / 18 */}
          <div
            style={{
              padding: '2px 8px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--primary-light)',
              color: 'var(--primary)',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
            }}
          >
            {currentIndex + 1} / {totalCards}
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: '5px', backgroundColor: 'var(--border)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              backgroundColor: 'var(--primary)',
              borderRadius: 'var(--radius-full)',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
      </div>
    </header>
  );
};
