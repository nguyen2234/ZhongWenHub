import React, { useState } from 'react';
import { Volume2, RotateCcw, AlertCircle, Bookmark } from 'lucide-react';
import type { SharedExerciseItem, AIExplanationContext } from '../types';
import { AnswerFeedback } from './AnswerFeedback';
import { isExerciseTypeSupported } from '../utils/exercise-capability';

export type ExerciseRendererMode = 'practice' | 'exam';

export interface ExerciseRendererProps {
  exercise: SharedExerciseItem;
  hasChecked?: boolean;
  isCorrect?: boolean;
  mode?: ExerciseRendererMode; // Default: 'practice'

  // Question review flag for exam mode
  isFlagged?: boolean;
  onToggleFlag?: () => void;

  // Free-text answer input (for fill-blank or translation without predefined options)
  textAnswer?: string;
  onTextAnswerChange?: (val: string) => void;

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
  hasChecked = false,
  isCorrect = false,
  mode = 'practice',
  isFlagged,
  onToggleFlag,
  textAnswer = '',
  onTextAnswerChange,
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

  const isExam = mode === 'exam';
  // In exam mode, immediate answer checking and explanation revelation are STRICTLY disabled
  const showCheckedFeedback = !isExam && Boolean(hasChecked);
  const capability = isExerciseTypeSupported(exercise.type);

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

  // Prepare AI Context (practice mode only)
  let userAnswerStr = '';
  let correctAnswerStr = exercise.correctSentence || '';
  if (exercise.options && selectedOption !== null) {
    userAnswerStr = exercise.options[selectedOption] || '';
    if (exercise.correctOptionIndex !== undefined) {
      correctAnswerStr = exercise.options[exercise.correctOptionIndex] || '';
    }
  } else if (exercise.type === 'sentence-order') {
    userAnswerStr = orderedTokens.join('');
  } else if (textAnswer) {
    userAnswerStr = textAnswer;
  }

  const aiContext: AIExplanationContext = {
    exerciseId: exercise.id,
    question: exercise.title + ' - ' + (exercise.promptHanzi || exercise.instruction),
    userAnswer: userAnswerStr,
    correctAnswer: isExam ? '' : correctAnswerStr,
    explanation: isExam ? '' : exercise.explanation,
    grammarPoint: exercise.grammarPoint,
    vocabularyIds: exercise.vocabularyIds,
    hskLevel: exercise.hskLevel,
    lessonId: exercise.lessonId,
  };

  const isFreeTextType =
    (!exercise.options || exercise.options.length === 0) &&
    (exercise.type === 'fill-blank' ||
      exercise.type === 'chinese-to-vietnamese' ||
      exercise.type === 'vietnamese-to-chinese');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%' }}>
      {/* Title, Instruction & Optional Exam Review Flag */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 'var(--space-3)' }}>
        <div>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 700, color: 'var(--foreground)', margin: '0 0 4px 0' }}>
            {exercise.title}
          </h2>
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
            {exercise.instruction}
          </div>
        </div>

        {onToggleFlag && (
          <button
            type="button"
            onClick={onToggleFlag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-full)',
              border: isFlagged ? '1.5px solid #d97706' : '1px solid var(--border)',
              backgroundColor: isFlagged ? 'rgba(245, 158, 11, 0.12)' : 'var(--surface)',
              color: isFlagged ? '#d97706' : 'var(--muted)',
              fontSize: '11px',
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title={isFlagged ? 'Bỏ gắn cờ' : 'Đánh dấu câu này để xem lại trước khi nộp'}
          >
            <Bookmark size={13} fill={isFlagged ? 'currentColor' : 'none'} />
            <span>{isFlagged ? 'Đã gắn cờ' : 'Gắn cờ'}</span>
          </button>
        )}
      </div>

      {/* 0. Fallback Banner for Unsupported Exercise Types */}
      {!capability.supported && (
        <div
          style={{
            padding: 'var(--space-4)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'rgba(245, 158, 11, 0.08)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 'var(--space-3)',
          }}
        >
          <AlertCircle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--foreground)' }}>
            <div style={{ fontWeight: 700, marginBottom: '2px', color: '#b45309' }}>
              Dạng bài tập cần thiết bị thu âm / vẽ nét chuyên dụng ({exercise.type})
            </div>
            <div style={{ color: 'var(--muted)', fontSize: 'var(--text-xs)', lineHeight: 1.5 }}>
              {capability.reason || 'Dạng câu hỏi này sẽ được cập nhật bộ thu âm / nét viết ở Phase 3.'} Câu hỏi được bảo lưu nguyên vẹn trong bài thi và sẽ được giảng viên đánh giá thủ công hoặc chấm điểm bổ sung.
            </div>
          </div>
        </div>
      )}

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

          {/* Transcript only revealed after checked (Practice Mode Only) */}
          {showCheckedFeedback && exercise.promptHanzi && (
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

      {/* 3. Options Grid (Multiple Choice, Fill in blank with options, Listen & Choose, Translation with options) */}
      {exercise.options && exercise.options.length > 0 && (
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

            // In exam mode, never reveal correct/incorrect colors
            if (showCheckedFeedback) {
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
                disabled={showCheckedFeedback}
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
                  cursor: showCheckedFeedback ? 'default' : 'pointer',
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

      {/* 3B. Free-Text Input (for fill-blank / translations WITHOUT predefined options) */}
      {isFreeTextType && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <textarea
            value={textAnswer}
            disabled={showCheckedFeedback}
            onChange={(e) => onTextAnswerChange?.(e.target.value)}
            placeholder={
              exercise.type === 'fill-blank'
                ? 'Nhập từ hoặc cụm từ thích hợp vào đây...'
                : 'Nhập bản dịch của bạn vào đây...'
            }
            rows={3}
            style={{
              width: '100%',
              padding: 'var(--space-3) var(--space-4)',
              borderRadius: 'var(--radius-xl)',
              border: textAnswer.trim() ? '2px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: 'var(--surface)',
              color: 'var(--foreground)',
              fontSize: 'var(--text-base)',
              fontFamily: exercise.type === 'vietnamese-to-chinese' ? 'var(--font-hanzi)' : 'inherit',
              resize: 'vertical',
              outline: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
              transition: 'border-color 0.15s ease',
            }}
          />
          {textAnswer.trim() && (
            <div style={{ fontSize: '11px', color: 'var(--muted)', textAlign: 'right' }}>
              {textAnswer.length} ký tự
            </div>
          )}
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
                  disabled={showCheckedFeedback}
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
                    cursor: showCheckedFeedback ? 'default' : 'pointer',
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
                disabled={showCheckedFeedback}
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
                  cursor: showCheckedFeedback ? 'default' : 'pointer',
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

              let border = isSelected ? '2px solid var(--primary)' : '1px solid var(--border)';
              let bg = isSelected ? 'var(--primary-light)' : 'var(--surface)';
              let textColor = 'var(--foreground)';

              if (isMatched) {
                if (showCheckedFeedback) {
                  border = '1.5px solid var(--success-border)';
                  bg = 'var(--success-bg)';
                  textColor = 'var(--success)';
                } else {
                  // In exam mode, paired items show active indicator without green feedback
                  border = '1.5px solid var(--primary)';
                  bg = 'var(--primary-light)';
                  textColor = 'var(--primary)';
                }
              }

              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={showCheckedFeedback || (isMatched && !isExam)}
                  onClick={() => onLeftClick(pair.id)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    border,
                    backgroundColor: bg,
                    color: textColor,
                    fontFamily: 'var(--font-hanzi)',
                    fontSize: 'var(--text-lg)',
                    fontWeight: 700,
                    cursor: showCheckedFeedback ? 'default' : 'pointer',
                    opacity: isMatched && !isExam ? 0.8 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pair.hanzi} {isMatched && showCheckedFeedback && '✓'}
                </button>
              );
            })}
          </div>

          {/* Right column (Vietnamese meaning) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
            {exercise.matchingPairs.map((pair) => {
              const isMatched = matchedPairs.includes(pair.id);
              const isSelected = selectedRight === pair.id;

              let border = isSelected ? '2px solid var(--primary)' : '1px solid var(--border)';
              let bg = isSelected ? 'var(--primary-light)' : 'var(--surface)';
              let textColor = 'var(--foreground)';

              if (isMatched) {
                if (showCheckedFeedback) {
                  border = '1.5px solid var(--success-border)';
                  bg = 'var(--success-bg)';
                  textColor = 'var(--success)';
                } else {
                  border = '1.5px solid var(--primary)';
                  bg = 'var(--primary-light)';
                  textColor = 'var(--primary)';
                }
              }

              return (
                <button
                  key={pair.id}
                  type="button"
                  disabled={showCheckedFeedback || (isMatched && !isExam)}
                  onClick={() => onRightClick(pair.id)}
                  style={{
                    padding: 'var(--space-3)',
                    borderRadius: 'var(--radius-lg)',
                    border,
                    backgroundColor: bg,
                    color: textColor,
                    fontSize: 'var(--text-sm)',
                    fontWeight: 600,
                    cursor: showCheckedFeedback ? 'default' : 'pointer',
                    opacity: isMatched && !isExam ? 0.8 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  {pair.meaning} {isMatched && showCheckedFeedback && '✓'}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. Unified Answer Feedback Component with AI Hook (Practice Mode Only) */}
      {showCheckedFeedback && (
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
