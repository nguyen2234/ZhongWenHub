import React from 'react';
import { HelpCircle } from 'lucide-react';
import { type VocabularyItem } from '../types';
import { AudioPlayerButton } from '../../lesson/components/AudioPlayerButton';
import { HSKLevel } from '../../../design-system';

interface FlashcardProps {
  vocabulary: VocabularyItem;
  isRevealed: boolean;
  onReveal: () => void;
}

export const Flashcard: React.FC<FlashcardProps> = ({
  vocabulary,
  isRevealed,
  onReveal,
}) => {
  const example = vocabulary.examples[0];

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '560px',
        minHeight: '360px',
        borderRadius: 'var(--radius-2xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--border)',
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.06)',
        padding: 'var(--space-6) var(--space-5)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        textAlign: 'center',
        position: 'relative',
        transition: 'all 0.25s ease',
      }}
    >
      {/* Top Tag: HSK Level & Word Type */}
      <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <HSKLevel level={vocabulary.hskLevel} />
        <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600 }}>
          {vocabulary.wordType}
        </span>
      </div>

      {/* Main Flashcard Content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-2)', width: '100%', margin: 'auto 0' }}>
        {/* Dominant Chinese Character (Hanzi) */}
        <div
          style={{
            fontFamily: 'var(--font-hanzi)',
            fontSize: 'var(--hanzi-display-xl)',
            fontWeight: 700,
            color: 'var(--foreground)',
            lineHeight: 1.1,
            letterSpacing: '0.04em',
            margin: 'var(--space-1) 0',
          }}
        >
          {vocabulary.hanzi}
        </div>

        {/* Pronunciation Audio Player */}
        <div style={{ marginBottom: 'var(--space-2)' }}>
          <AudioPlayerButton textToSpeak={vocabulary.hanzi} variant="primary" label="Nghe phát âm" size="md" />
        </div>

        {/* Conditional View: FRONT (Hidden) vs BACK (Revealed) */}
        {!isRevealed ? (
          /* FRONT VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
              <HelpCircle size={16} />
              <span>Bạn có nhớ cách đọc và ý nghĩa của từ này?</span>
            </div>

            <button
              type="button"
              onClick={onReveal}
              style={{
                padding: '10px 32px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontSize: 'var(--text-base)',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
                transition: 'all 0.15s ease',
              }}
            >
              XEM ĐÁP ÁN (Phím Space)
            </button>
          </div>
        ) : (
          /* BACK VIEW (REVEALED) */
          <div
            style={{
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 'var(--space-2)',
              animation: 'fadeIn 0.25s ease',
            }}
          >
            {/* Pinyin */}
            <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--primary)', letterSpacing: '0.02em' }}>
              {vocabulary.pinyin}
            </div>

            {/* Vietnamese Meaning */}
            <div style={{ fontSize: 'var(--text-xl)', fontWeight: 600, color: 'var(--foreground)' }}>
              {vocabulary.primaryMeaning}
            </div>

            {/* Example sentence box */}
            {example && (
              <div
                style={{
                  width: '100%',
                  marginTop: 'var(--space-3)',
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--border)',
                  textAlign: 'left',
                }}
              >
                <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
                  {example.hanzi}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                  {example.pinyin}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', fontStyle: 'italic', marginTop: '2px' }}>
                  &quot;{example.meaning}&quot;
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
        Nguồn: {vocabulary.lessonSource}
      </div>
    </div>
  );
};
