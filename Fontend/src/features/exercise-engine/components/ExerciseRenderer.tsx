import React, { useState } from 'react';
import { Volume2, RotateCcw } from 'lucide-react';
import type { SharedExerciseItem, AIExplanationContext } from '../types';
import { AnswerFeedback } from './AnswerFeedback';

export interface ExerciseRendererProps {
  exercise: SharedExerciseItem;
  hasChecked: boolean;
  isCorrect: boolean;
  onAnswerChange?: (isReady: boolean, currentAnswer: string | number | string[]) => void;
  onAskAI?: (context: AIExplanationContext) => void;
  selectedOption: number | null;
  onSelectOption: (idx: number) => void;
  orderedTokens: string[];
  availableTokens: string[];
  onSelectToken: (token: string, idx: number) => void;
  onRemoveToken: (token: string, idx: number) => void;
  matchedPairs: string[];
  selectedLeft: string | null;
  selectedRight: string | null;
  onLeftClick: (id: string) => void;
  onRightClick: (id: string) => void;
}

export const ExerciseRenderer: React.FC<ExerciseRendererProps> = ({
  exercise,
  hasChecked,
  isCorrect,
  onAskAI,
  selectedOption,
  onSelectOption,
  orderedTokens,
  availableTokens,
  onSelectToken,
  onRemoveToken,
  matchedPairs,
  selectedLeft,
  selectedRight,
  onLeftClick,
  onRightClick,
}) => {
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    // Simulating speech synthesis
    if ('speechSynthesis' in window && exercise.promptHanzi) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(exercise.promptHanzi);
      utterance.lang = 'zh-CN';
      utterance.rate = 0.85;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 1200);
    }
  };

  // Prepare AI Context
  let userAnswerStr = '';
  let correctAnswerStr = exercise.correctSentence || '';
  if (exercise.options && selectedOption !== null) {
    userAnswerStr = exercise.options[selectedOption] || '';
    if (exercise.correctOptionIndex !== undefined) {
      correctAnswerStr = exercise.options[exercise.correctOptionIndex] || '';
    }
  } else if (exercise.type === 'sentence-order') {
    userAnswerStr = orderedTokens.join('');
  }

  const aiContext: AIExplanationContext = {
    exerciseId: exercise.id,
    question: exercise.title + ' - ' + (exercise.promptHanzi || exercise.instruction),
    userAnswer: userAnswerStr,
    correctAnswer: correctAnswerStr,
    explanation: exercise.explanation,
    grammarPoint: exercise.grammarPoint,
    vocabularyIds: exercise.vocabularyIds,
    hskLevel: exercise.hskLevel,
    lessonId: exercise.lessonId,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Title & Instruction */}
      <div>
        <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
          {exercise.title}
        </h2>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
          {exercise.instruction}
        </div>
      </div>

      {/* 1. Audio Focus Mode for 'listen-choice' */}
      {exercise.type === 'listen-choice' && (
        <div
          style={{
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <button
            type="button"
            onClick={handlePlayAudio}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: isPlayingAudio ? 'var(--primary)' : 'var(--primary-light)',
              color: isPlayingAudio ? '#ffffff' : 'var(--primary)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(67, 56, 202, 0.2)',
              transition: 'all 0.2s ease',
            }}
            title="Phát âm thanh mẫu"
          >
            <Volume2 size={30} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
            <RotateCcw size={13} />
            <span>Chạm để nghe lại phát âm mẫu</span>
          </div>

          {/* Transcript only revealed after checked */}
          {hasChecked && exercise.promptHanzi && (
            <div style={{ textAlign: 'center', marginTop: 'var(--space-2)', animation: 'fadeIn 0.2s ease' }}>
              <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-lg)', fontWeight: 700, color: 'var(--foreground)' }}>
                {exercise.promptHanzi}
              </div>
              {exercise.promptPinyin && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 600 }}>
                  {exercise.promptPinyin}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* 2. Visual Prompt (Hanzi / Pinyin / Vietnamese) for reading, grammar, translation */}
      {exercise.type !== 'listen-choice' && exercise.promptHanzi && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontFamily: 'var(--font-hanzi)', fontSize: 'var(--text-xl)', fontWeight: 700, color: 'var(--foreground)' }}>
            {exercise.promptHanzi}
          </div>
          {exercise.promptPinyin && (
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
              {exercise.promptPinyin}
            </div>
          )}
          {exercise.promptVietnamese && (
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', marginTop: '2px' }}>
              &quot;{exercise.promptVietnamese}&quot;
            </div>
          )}
        </div>
      )}

      {/* Prompt Vietnamese only (e.g. for vietnamese-to-chinese) */}
      {!exercise.promptHanzi && exercise.promptVietnamese && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--background)',
            border: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)' }}>
            &quot;{exercise.promptVietnamese}&quot;
          </div>
        </div>
      )}

      {/* 3. Options Grid (Multiple Choice, Fill in blank, Listen & Choose, Translation) */}
      {exercise.options && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: exercise.type === 'fill-blank' ? 'repeat(auto-fit, minmax(130px, 1fr))' : '1fr',
            gap: 'var(--space-2)',
          }}
        >
          {exercise.options.map((opt, idx) => {
            const isSelected = selectedOption === idx;
            let border = isSelected ? '2px solid var(--primary)' : '1px solid var(--border)';
            let bg = isSelected ? 'var(--primary-light)' : 'var(--surface)';

            if (hasChecked) {
              if (idx === exercise.correctOptionIndex) {
                border = '2px solid var(--success-border)';
                bg = 'var(--success-bg)';
              } else if (isSelected && idx !== exercise.correctOptionIndex) {
                border = '2px solid var(--danger-border)';
                bg = 'var(--danger-bg)';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={hasChecked}
                onClick={() => onSelectOption(idx)}
                style={{
                  padding: 'var(--space-3) var(--space-4)',
                  borderRadius: 'var(--radius-xl)',
                  border,
                  backgroundColor: bg,
                  color: 'var(--foreground)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-2)',
                  fontSize: exercise.type === 'fill-blank' ? 'var(--text-lg)' : 'var(--text-sm)',
                  fontFamily: exercise.type === 'fill-blank' ? 'var(--font-hanzi)' : 'inherit',
                  fontWeight: 600,
                  cursor: hasChecked ? 'default' : 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                }}
              >
                <span
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: isSelected ? 'var(--primary)' : 'var(--neutral-bg)',
                    color: isSelected ? '#ffffff' : 'var(--muted)',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontWeight: 700,
                  }}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span>{opt}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 4. Sentence Order Tokens Builder */}
      {exercise.type === 'sentence-order' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
          {/* Assembled sentence drop area */}
          <div
            style={{
              minHeight: '64px',
              padding: 'var(--space-3)',
              borderRadius: 'var(--radius-xl)',
              border: '2px dashed var(--border-strong)',
              backgroundColor: 'var(--background)',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              gap: 'var(--space-2)',
            }}
          >
            {orderedTokens.length === 0 ? (
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', margin: 'auto' }}>
                Chạm vào các từ bên dưới để đưa lên đây
              </span>
            ) : (
              orderedTokens.map((tok, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={hasChecked}
                  onClick={() => onRemoveToken(tok, i)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 'var(--radius-lg)',
                    backgroundColor: 'var(--primary)',
                    color: '#ffffff',
                    border: 'none',
                    fontFamily: 'var(--font-hanzi)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    cursor: hasChecked ? 'default' : 'pointer',
                    boxShadow: '0 2px 6px rgba(67, 56, 202, 0.25)',
                  }}
                >
                  {tok}
                </button>
              ))
            )}
          </div>

          {/* Available tokens pool */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)', justifyContent: 'center' }}>
            {availableTokens.map((tok, i) => (
              <button
                key={i}
                type="button"
                disabled={hasChecked}
                onClick={() => onSelectToken(tok, i)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--surface)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--foreground)',
                  fontFamily: 'var(--font-hanzi)',
                  fontSize: 'var(--text-lg)',
                  fontWeight: 700,
                  cursor: hasChecked ? 'default' : 'pointer',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                }}
              >
                {tok}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Matching Pairs UI */}
      {exercise.type === 'matching' && exercise.matchingPairs && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
          {/* Left column (Hanzi) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {exercise.matchingPairs.map((pair) => {
              const isMatched = matchedPairs.includes(pair.id);
              const isSelected = selectedLeft === pair.id;
              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => onLeftClick(pair.id)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    border: isMatched
                      ? '1.5px solid var(--success-border)'
                      : isSelected
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border)',
                    backgroundColor: isMatched
                      ? 'var(--success-bg)'
                      : isSelected
                      ? 'var(--primary-light)'
                      : 'var(--surface)',
                    color: isMatched ? 'var(--success)' : 'var(--foreground)',
                    fontFamily: 'var(--font-hanzi)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    cursor: isMatched ? 'default' : 'pointer',
                    opacity: isMatched ? 0.8 : 1,
                  }}
                >
                  {pair.hanzi} {isMatched && '✓'}
                </button>
              );
            })}
          </div>

          {/* Right column (Vietnamese meaning) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {exercise.matchingPairs.map((pair) => {
              const isMatched = matchedPairs.includes(pair.id);
              const isSelected = selectedRight === pair.id;
              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={isMatched}
                  onClick={() => onRightClick(pair.id)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    border: isMatched
                      ? '1.5px solid var(--success-border)'
                      : isSelected
                      ? '2px solid var(--primary)'
                      : '1px solid var(--border)',
                    backgroundColor: isMatched
                      ? 'var(--success-bg)'
                      : isSelected
                      ? 'var(--primary-light)'
                      : 'var(--surface)',
                    color: isMatched ? 'var(--success)' : 'var(--foreground)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    cursor: isMatched ? 'default' : 'pointer',
                    opacity: isMatched ? 0.8 : 1,
                  }}
                >
                  {pair.meaning} {isMatched && '✓'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Unified Answer Feedback Component with AI Hook */}
      {hasChecked && (
        <AnswerFeedback
          isCorrect={isCorrect}
          explanation={exercise.explanation}
          correctAnswerText={correctAnswerStr}
          userAnswerText={userAnswerStr}
          grammarPoint={exercise.grammarPoint}
          xpEarned={exercise.xpReward || 2}
          aiContext={aiContext}
          onAskAI={onAskAI}
        />
      )}
    </div>
  );
};
