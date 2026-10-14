import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Bookmark } from 'lucide-react';
import { ExerciseRenderer } from '../../../exercise-engine';
import type { SharedExerciseItem } from '../../../exercise-engine/types';
import type {
  StudentRunnerQuestionDTO,
  StudentQuestionAnswer,
} from '../../types/student-homework.types';

interface RunnerQuestionHostProps {
  question: StudentRunnerQuestionDTO;
  questionIndex: number;
  totalQuestions: number;
  currentAnswer?: StudentQuestionAnswer;
  isFlagged: boolean;
  onAnswerChange: (val: any) => void;
  onToggleFlag: () => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
}

export const RunnerQuestionHost: React.FC<RunnerQuestionHostProps> = ({
  question,
  questionIndex,
  totalQuestions,
  currentAnswer,
  isFlagged,
  onAnswerChange,
  onToggleFlag,
  onNext,
  onPrev,
  isFirst,
  isLast,
}) => {
  // Controlled internal states for ExerciseRenderer
  const [selectedOption, setSelectedOption] = useState<number | null>(() => {
    return typeof currentAnswer?.value === 'number' ? currentAnswer.value : null;
  });

  const [textAnswer, setTextAnswer] = useState<string>(() => {
    return typeof currentAnswer?.value === 'string' ? currentAnswer.value : '';
  });

  const [orderedTokens, setOrderedTokens] = useState<string[]>(() => {
    return Array.isArray(currentAnswer?.value) ? currentAnswer.value : [];
  });

  const [availableTokens, setAvailableTokens] = useState<string[]>(() => {
    if (question.sentenceTokens) {
      const chosen = Array.isArray(currentAnswer?.value) ? currentAnswer.value : [];
      // Remaining tokens
      const remaining = [...question.sentenceTokens];
      chosen.forEach((c) => {
        const idx = remaining.indexOf(c);
        if (idx !== -1) remaining.splice(idx, 1);
      });
      return remaining;
    }
    return [];
  });

  const [matchedPairs, setMatchedPairs] = useState<string[]>(() => {
    if (Array.isArray(currentAnswer?.value)) {
      return currentAnswer.value;
    }
    return [];
  });

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  // Sync state whenever question changes or answer updates
  useEffect(() => {
    const val = currentAnswer?.value;

    if (typeof val === 'number') {
      setSelectedOption(val);
    } else {
      setSelectedOption(null);
    }

    if (typeof val === 'string') {
      setTextAnswer(val);
    } else {
      setTextAnswer('');
    }

    if (Array.isArray(val) && question.exerciseType === 'sentence-order') {
      setOrderedTokens(val);
      if (question.sentenceTokens) {
        const remaining = [...question.sentenceTokens];
        val.forEach((c) => {
          const idx = remaining.indexOf(c);
          if (idx !== -1) remaining.splice(idx, 1);
        });
        setAvailableTokens(remaining);
      }
    } else if (question.exerciseType === 'sentence-order' && question.sentenceTokens) {
      setOrderedTokens([]);
      setAvailableTokens([...question.sentenceTokens]);
    }

    if (Array.isArray(val) && question.exerciseType === 'matching') {
      setMatchedPairs(val);
    } else {
      setMatchedPairs([]);
    }

    setSelectedLeft(null);
    setSelectedRight(null);
  }, [question.id, currentAnswer?.value, question.exerciseType, question.sentenceTokens]);

  // Handlers for Multiple Choice / Options
  const handleSelectOption = (idx: number) => {
    setSelectedOption(idx);
    onAnswerChange(idx);
  };

  // Handlers for Free Text
  const handleTextChange = (val: string) => {
    setTextAnswer(val);
    onAnswerChange(val);
  };

  // Handlers for Sentence Tokens
  const handleSelectToken = (tok: string, idx: number) => {
    const newOrdered = [...orderedTokens, tok];
    const newAvail = availableTokens.filter((_, i) => i !== idx);
    setOrderedTokens(newOrdered);
    setAvailableTokens(newAvail);
    onAnswerChange(newOrdered);
  };

  const handleRemoveToken = (tok: string, idx: number) => {
    const newOrdered = orderedTokens.filter((_, i) => i !== idx);
    const newAvail = [...availableTokens, tok];
    setOrderedTokens(newOrdered);
    setAvailableTokens(newAvail);
    onAnswerChange(newOrdered);
  };

  // Handlers for Matching Pairs in Exam Mode
  const handleLeftClick = (id: string) => {
    if (matchedPairs.includes(id)) {
      // Toggle unpair
      const updated = matchedPairs.filter((x) => x !== id);
      setMatchedPairs(updated);
      onAnswerChange(updated);
      setSelectedLeft(null);
      return;
    }

    setSelectedLeft(id);
    if (selectedRight) {
      // Create user pairing
      const updated = Array.from(new Set([...matchedPairs, id, selectedRight]));
      setMatchedPairs(updated);
      onAnswerChange(updated);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const handleRightClick = (id: string) => {
    if (matchedPairs.includes(id)) {
      const updated = matchedPairs.filter((x) => x !== id);
      setMatchedPairs(updated);
      onAnswerChange(updated);
      setSelectedRight(null);
      return;
    }

    setSelectedRight(id);
    if (selectedLeft) {
      const updated = Array.from(new Set([...matchedPairs, selectedLeft, id]));
      setMatchedPairs(updated);
      onAnswerChange(updated);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  // Adapt to SharedExerciseItem for ExerciseRenderer
  const sharedExercise: SharedExerciseItem = {
    id: question.id,
    type: question.exerciseType,
    title: question.title,
    instruction: question.instruction,
    promptHanzi: question.promptHanzi,
    promptPinyin: question.promptPinyin,
    promptVietnamese: question.promptVietnamese,
    audioUrl: question.audioUrl,
    options: question.options,
    sentenceTokens: question.sentenceTokens,
    matchingPairs: question.matchingPairs,
    explanation: '', // NEVER pass explanation
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
        backgroundColor: 'var(--surface)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        padding: 'var(--space-6)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
      }}
    >
      {/* Question Header Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: 'var(--space-3)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: 'var(--text-sm)',
              fontWeight: 800,
              color: 'var(--primary)',
              backgroundColor: 'var(--primary-light)',
              padding: '3px 10px',
              borderRadius: 'var(--radius-full)',
            }}
          >
            Câu {questionIndex + 1} / {totalQuestions}
          </span>
          <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)', fontWeight: 600 }}>
            ({question.points} điểm)
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleFlag}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '5px 12px',
            borderRadius: 'var(--radius-full)',
            border: isFlagged ? '1.5px solid #d97706' : '1px solid var(--border)',
            backgroundColor: isFlagged ? 'rgba(245, 158, 11, 0.12)' : 'transparent',
            color: isFlagged ? '#d97706' : 'var(--muted)',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Bookmark size={13} fill={isFlagged ? 'currentColor' : 'none'} />
          <span>{isFlagged ? 'Đã gắn cờ xem lại' : 'Gắn cờ câu này'}</span>
        </button>
      </div>

      {/* Embedded ExerciseRenderer in EXAM MODE */}
      <div style={{ minHeight: '260px' }}>
        <ExerciseRenderer
          mode="exam"
          exercise={sharedExercise}
          hasChecked={false}
          isCorrect={false}
          selectedOption={selectedOption}
          onSelectOption={handleSelectOption}
          textAnswer={textAnswer}
          onTextAnswerChange={handleTextChange}
          orderedTokens={orderedTokens}
          availableTokens={availableTokens}
          onSelectToken={handleSelectToken}
          onRemoveToken={handleRemoveToken}
          matchedPairs={matchedPairs}
          selectedLeft={selectedLeft}
          selectedRight={selectedRight}
          onLeftClick={handleLeftClick}
          onRightClick={handleRightClick}
        />
      </div>

      {/* Navigation Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-4)',
          borderTop: '1px solid var(--border)',
        }}
      >
        <button
          type="button"
          disabled={isFirst}
          onClick={onPrev}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 18px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: 'transparent',
            color: isFirst ? 'var(--muted)' : 'var(--foreground)',
            border: '1px solid var(--border)',
            fontSize: 'var(--text-sm)',
            fontWeight: 600,
            cursor: isFirst ? 'not-allowed' : 'pointer',
            opacity: isFirst ? 0.5 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          <ArrowLeft size={16} />
          <span>Câu trước</span>
        </button>

        <button
          type="button"
          disabled={isLast}
          onClick={onNext}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 20px',
            borderRadius: 'var(--radius-lg)',
            backgroundColor: isLast ? 'var(--neutral-bg)' : 'var(--primary)',
            color: isLast ? 'var(--muted)' : '#ffffff',
            border: 'none',
            fontSize: 'var(--text-sm)',
            fontWeight: 700,
            cursor: isLast ? 'not-allowed' : 'pointer',
            opacity: isLast ? 0.6 : 1,
            transition: 'all 0.15s ease',
          }}
        >
          <span>Câu tiếp theo</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};
