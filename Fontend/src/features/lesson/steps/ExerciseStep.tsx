import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import type { ExerciseItem } from '../types';
import { ExerciseRenderer, gradeExerciseSubmission } from '../../exercise-engine';

interface ExerciseStepProps {
  exercises: ExerciseItem[];
  onCompleteAllExercises?: () => void;
}

export const ExerciseStep: React.FC<ExerciseStepProps> = ({
  exercises,
  onCompleteAllExercises,
}) => {
  const [currentExIndex, setCurrentExIndex] = useState(0);

  // States for multiple-choice / fill-blank / translation
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');

  // State for sentence-order
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);

  // State for matching
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  // Submission state
  const [hasChecked, setHasChecked] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);

  const currentExercise = exercises[currentExIndex];

  // Initialize state when switching exercises
  const initExercise = (index: number) => {
    const ex = exercises[index];
    if (!ex) return;
    setSelectedOption(null);
    setTextAnswer('');
    setHasChecked(false);
    setIsCurrentCorrect(false);

    if (ex.type === 'sentence-order' && ex.sentenceTokens && (!ex.options || ex.options.length === 0)) {
      setAvailableTokens([...ex.sentenceTokens]);
      setOrderedTokens([]);
    } else {
      setAvailableTokens([]);
      setOrderedTokens([]);
    }

    if (ex.type === 'matching' && ex.matchingPairs) {
      setMatchedPairs([]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  useEffect(() => {
    setCurrentExIndex(0);
  }, [exercises]);

  useEffect(() => {
    initExercise(currentExIndex);
  }, [currentExIndex, exercises]);

  if (!currentExercise) {
    return null;
  }

  // Switch exercise
  const handleNextExercise = () => {
    if (currentExIndex < exercises.length - 1) {
      setCurrentExIndex(currentExIndex + 1);
    } else {
      onCompleteAllExercises?.();
    }
  };

  // Handlers for sentence-order
  const handleSelectToken = (token: string, tokenIdx: number) => {
    if (hasChecked) return;
    setOrderedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== tokenIdx));
  };

  const handleRemoveToken = (token: string, tokenIdx: number) => {
    if (hasChecked) return;
    setOrderedTokens((prev) => prev.filter((_, i) => i !== tokenIdx));
    setAvailableTokens((prev) => [...prev, token]);
  };

  // Handlers for matching
  const handleLeftClick = (id: string) => {
    if (hasChecked || matchedPairs.includes(id)) return;
    setSelectedLeft(id);
    if (selectedRight) {
      checkMatching(id, selectedRight);
    }
  };

  const handleRightClick = (id: string) => {
    if (hasChecked || matchedPairs.includes(id)) return;
    setSelectedRight(id);
    if (selectedLeft) {
      checkMatching(selectedLeft, id);
    }
  };

  const checkMatching = (leftId: string, rightId: string) => {
    if (leftId === rightId) {
      const updated = [...matchedPairs, leftId];
      setMatchedPairs(updated);
      setSelectedLeft(null);
      setSelectedRight(null);

      if (updated.length === (currentExercise.matchingPairs?.length || 0)) {
        setIsCurrentCorrect(true);
        setHasChecked(true);
        if (currentExIndex >= exercises.length - 1) {
          onCompleteAllExercises?.();
        }
      }
    } else {
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 400);
    }
  };

  // General Check Answer
  const handleCheck = () => {
    const { isCorrect } = gradeExerciseSubmission(currentExercise, {
      selectedOption,
      orderedTokens,
      matchedPairs,
      textAnswer,
    });
    setIsCurrentCorrect(isCorrect);
    setHasChecked(true);
    if (currentExIndex >= exercises.length - 1) {
      onCompleteAllExercises?.();
    }
  };

  const usesTokenBuilder =
    currentExercise.type === 'sentence-order' &&
    Array.isArray(currentExercise.sentenceTokens) &&
    currentExercise.sentenceTokens.length > 0 &&
    (!currentExercise.options || currentExercise.options.length === 0);

  const hasOptions = Array.isArray(currentExercise.options) && currentExercise.options.length > 0;

  const canCheck = usesTokenBuilder
    ? orderedTokens.length > 0 && availableTokens.length === 0
    : currentExercise.type === 'matching'
    ? matchedPairs.length === (currentExercise.matchingPairs?.length || 0)
    : hasOptions
    ? selectedOption !== null
    : textAnswer.trim().length > 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', width: '100%', alignItems: 'center' }}>
      {/* Exercise Sub-stepper header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '640px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles size={16} style={{ color: 'var(--primary)' }} />
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--muted)', textTransform: 'uppercase' }}>
            LUYỆN TẬP TƯƠNG TÁC ({currentExIndex + 1} / {exercises.length})
          </span>
        </div>

        {/* Mini progress dots */}
        <div style={{ display: 'flex', gap: '4px' }}>
          {exercises.map((_, idx) => (
            <span
              key={idx}
              style={{
                width: idx === currentExIndex ? '16px' : '6px',
                height: '6px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: idx === currentExIndex ? 'var(--primary)' : idx < currentExIndex ? 'var(--success)' : 'var(--border)',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>
      </div>

      {/* Main Exercise Card using shared ExerciseRenderer */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          borderRadius: 'var(--radius-2xl)',
          backgroundColor: 'var(--surface)',
          border: '1.5px solid var(--border)',
          padding: 'var(--space-5) var(--space-6)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-4)',
          boxShadow: '0 4px 18px rgba(0, 0, 0, 0.04)',
        }}
      >
        <ExerciseRenderer
          exercise={currentExercise}
          hasChecked={hasChecked}
          isCorrect={isCurrentCorrect}
          textAnswer={textAnswer}
          onTextAnswerChange={setTextAnswer}
          selectedOption={selectedOption}
          onSelectOption={setSelectedOption}
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

        {/* Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
          {!hasChecked && currentExercise.type !== 'matching' ? (
            <button
              type="button"
              disabled={!canCheck}
              onClick={handleCheck}
              style={{
                padding: '8px 24px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: canCheck ? 'var(--primary)' : 'var(--border)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                cursor: canCheck ? 'pointer' : 'default',
              }}
            >
              Kiểm tra
            </button>
          ) : hasChecked && currentExIndex < exercises.length - 1 ? (
            <button
              type="button"
              onClick={handleNextExercise}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'var(--primary)',
                color: '#ffffff',
                border: 'none',
                fontWeight: 700,
                fontSize: 'var(--text-sm)',
                cursor: 'pointer',
              }}
            >
              <span>Bài tiếp theo</span>
              <ArrowRight size={15} />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};
