import React, { useState } from 'react';
import { BookOpen, AlertTriangle, Sparkles } from 'lucide-react';
import { type GrammarData } from '../types';
import { AudioPlayerButton } from '../components/AudioPlayerButton';
import { AnswerFeedback } from '../components/AnswerFeedback';

interface GrammarStepProps {
  grammar: GrammarData;
}

export const GrammarStep: React.FC<GrammarStepProps> = ({ grammar }) => {
  const [selectedPracticeOption, setSelectedPracticeOption] = useState<number | null>(null);
  const [hasCheckedPractice, setHasCheckedPractice] = useState(false);

  const handleSelectOption = (idx: number) => {
    if (!hasCheckedPractice) {
      setSelectedPracticeOption(idx);
    }
  };

  const isPracticeCorrect = selectedPracticeOption === grammar.quickPractice.correctIndex;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', width: '100%' }}>
      {/* Step Header */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '2px 10px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 'var(--space-1)' }}>
          <BookOpen size={14} />
          <span>NGỮ PHÁP TRỌNG TÂM</span>
        </div>
        <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 700, margin: 'var(--space-1) 0', color: 'var(--foreground)' }}>
          {grammar.title}
        </h2>
        <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
          {grammar.subtitle}
        </p>
      </div>

      {/* Grammar Pattern Formula Box (Visual Hierarchy) */}
      <div
        style={{
          padding: 'var(--space-5)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 'var(--space-3)',
          boxShadow: '0 2px 12px rgba(0, 0, 0, 0.04)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          CẤU TRÚC MẪU CÂU (PATTERN FORMULA)
        </span>

        {/* Pattern blocks row */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-2)',
          }}
        >
          {grammar.patternBlocks.map((block, i) => (
            <React.Fragment key={i}>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: 'var(--space-2) var(--space-4)',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: block.label === '想' ? 'var(--primary-light)' : 'var(--background)',
                  border: block.label === '想' ? '2px solid var(--primary)' : '1px solid var(--border)',
                  minWidth: '80px',
                }}
              >
                <span
                  style={{
                    fontSize: block.label === '想' ? 'var(--text-lg)' : 'var(--text-sm)',
                    fontWeight: 700,
                    color: block.label === '想' ? 'var(--primary)' : 'var(--foreground)',
                    fontFamily: block.label === '想' ? 'var(--font-hanzi)' : 'inherit',
                  }}
                >
                  {block.label}
                </span>
                {block.sublabel && (
                  <span style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 500 }}>
                    {block.sublabel}
                  </span>
                )}
              </div>

              {i < grammar.patternBlocks.length - 1 && (
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--muted)' }}>
                  +
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        <p style={{ margin: 0, fontSize: 'var(--text-xs)', color: 'var(--foreground)', lineHeight: 1.5, textAlign: 'center', maxWidth: '600px', marginTop: 'var(--space-1)' }}>
          {grammar.explanation}
        </p>
      </div>

      {/* Examples Grid */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
          CÂU VÍ DỤ ĐIỂN HÌNH
        </span>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {grammar.examples.map((ex, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3)',
                borderRadius: 'var(--radius-lg)',
                backgroundColor: 'var(--background)',
                border: '1px solid var(--border)',
              }}
            >
              <div>
                <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--foreground)' }}>
                  {ex.hanzi}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>
                  {ex.pinyin}
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
                  &quot;{ex.meaning}&quot;
                </div>
              </div>

              <AudioPlayerButton textToSpeak={ex.hanzi} variant="icon-only" size="sm" />
            </div>
          ))}
        </div>
      </div>

      {/* Common Mistake Alert */}
      {grammar.commonMistake && (
        <div
          style={{
            padding: 'var(--space-3-5) var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
          }}
        >
          <AlertTriangle size={18} style={{ color: 'var(--warning)', marginTop: '2px', flexShrink: 0 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', fontSize: 'var(--text-xs)' }}>
            <span style={{ fontWeight: 700, color: 'var(--warning)' }}>Lưu ý lỗi thường gặp:</span>
            <span style={{ color: 'var(--danger)', textDecoration: 'line-through' }}>{grammar.commonMistake.wrong}</span>
            <span style={{ color: 'var(--success)', fontWeight: 600 }}>{grammar.commonMistake.right}</span>
            <span style={{ color: 'var(--foreground)', marginTop: '2px', lineHeight: 1.4 }}>{grammar.commonMistake.note}</span>
          </div>
        </div>
      )}

      {/* Quick Practice (Interactive Mini Test) */}
      <div
        style={{
          padding: 'var(--space-4) var(--space-5)',
          borderRadius: 'var(--radius-xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--primary-light)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 'var(--text-sm)', fontWeight: 700, color: 'var(--foreground)' }}>
            Luyện tập nhanh tại chỗ
          </span>
        </div>

        <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--foreground)' }}>
          {grammar.quickPractice.question}
        </div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 500 }}>
          {grammar.quickPractice.pinyin}
        </div>

        {/* Options */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 'var(--space-2)', marginTop: 'var(--space-1)' }}>
          {grammar.quickPractice.options.map((opt, idx) => {
            const isSelected = selectedPracticeOption === idx;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectOption(idx)}
                style={{
                  padding: 'var(--space-3)',
                  borderRadius: 'var(--radius-lg)',
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--background)',
                  color: isSelected ? 'var(--primary)' : 'var(--foreground)',
                  fontFamily: 'var(--font-hanzi)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  cursor: hasCheckedPractice ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>

        {!hasCheckedPractice ? (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
            <button
              type="button"
              disabled={selectedPracticeOption === null}
              onClick={() => setHasCheckedPractice(true)}
              style={{
                padding: '6px 16px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: selectedPracticeOption === null ? 'var(--border)' : 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: 'var(--text-xs)',
                cursor: selectedPracticeOption === null ? 'default' : 'pointer',
              }}
            >
              Kiểm tra nhanh
            </button>
          </div>
        ) : (
          <AnswerFeedback
            isCorrect={isPracticeCorrect}
            explanation={grammar.quickPractice.explanation}
            correctAnswerText={grammar.quickPractice.options[grammar.quickPractice.correctIndex]}
            userAnswerText={selectedPracticeOption !== null ? grammar.quickPractice.options[selectedPracticeOption] : undefined}
          />
        )}
      </div>
    </div>
  );
};
