import React from 'react';
import { Flame, Check, BookOpen } from 'lucide-react';
import { type VocabularyItem, type UserVocabularyState } from '../types';
import { AudioPlayerButton } from '../../lesson/components/AudioPlayerButton';
import { HSKLevel } from '../../../design-system';

interface VocabularyCardProps {
  vocabulary: VocabularyItem;
  userState?: UserVocabularyState;
  onClick: () => void;
}

export const VocabularyCard: React.FC<VocabularyCardProps> = ({
  vocabulary,
  userState,
  onClick,
}) => {
  const isDueToday = userState?.isDueToday ?? false;
  const isMastered = userState?.status === 'mastered';
  const firstExample = vocabulary.examples[0];

  return (
    <div
      onClick={onClick}
      style={{
        padding: 'var(--space-4)',
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface)',
        border: isDueToday ? '1.5px solid var(--streak-border)' : '1px solid var(--border)',
        boxShadow: isDueToday ? '0 2px 10px rgba(234, 88, 12, 0.08)' : '0 1px 4px rgba(0, 0, 0, 0.02)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: 'var(--space-3)',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        position: 'relative',
      }}
    >
      {/* Top badges: HSK level, Review status badge */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <HSKLevel level={vocabulary.hskLevel} />
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
            {vocabulary.wordType}
          </span>
        </div>

        {/* Review status badge */}
        <div>
          {isDueToday ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--streak-bg)',
                color: 'var(--streak)',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <Flame size={12} />
              <span>Cần ôn</span>
            </span>
          ) : isMastered ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--success-bg)',
                color: 'var(--success)',
                fontSize: '10px',
                fontWeight: 700,
              }}
            >
              <Check size={12} />
              <span>Đã thuộc</span>
            </span>
          ) : (
            <span
              style={{
                padding: '2px 8px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--neutral-bg)',
                color: 'var(--muted)',
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              Đang học
            </span>
          )}
        </div>
      </div>

      {/* Main Core: 1. Hanzi -> 2. Pinyin -> 3. Vietnamese */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
            <span
              style={{
                fontFamily: 'var(--font-hanzi)',
                fontSize: 'var(--hanzi-card)',
                fontWeight: 700,
                color: 'var(--foreground)',
                letterSpacing: '0.02em',
                lineHeight: 1.1,
              }}
            >
              {vocabulary.hanzi}
            </span>
            <span
              style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                color: 'var(--primary)',
              }}
            >
              {vocabulary.pinyin}
            </span>
          </div>

          {/* Quick Audio button */}
          <div onClick={(e) => e.stopPropagation()}>
            <AudioPlayerButton textToSpeak={vocabulary.hanzi} variant="icon-only" size="sm" />
          </div>
        </div>

        <div style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)', fontWeight: 500, marginTop: '2px' }}>
          {vocabulary.primaryMeaning}
        </div>
      </div>

      {/* Example Preview */}
      {firstExample && (
        <div
          style={{
            padding: 'var(--space-2) var(--space-3)',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            fontSize: '11px',
          }}
        >
          <span style={{ fontFamily: 'var(--font-hanzi)', fontWeight: 600, color: 'var(--foreground)' }}>
            {firstExample.hanzi}
          </span>
          <span style={{ color: 'var(--muted)', marginLeft: '6px' }}>
            &quot;{firstExample.meaning}&quot;
          </span>
        </div>
      )}

      {/* Bottom Footer: Lesson Source */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '10px', color: 'var(--muted)' }}>
        <BookOpen size={12} />
        <span>Nguồn: {vocabulary.lessonSource}</span>
      </div>
    </div>
  );
};
