import React, { useState, useEffect, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { ExerciseRenderer } from '../../../../features/exercise-engine/components/ExerciseRenderer';
import type { SharedExerciseItem } from '../../../../features/exercise-engine/types';
import type { AdminExerciseItem } from '../types/admin-content.types';

export interface AdminExerciseEnginePreviewHostProps {
  exercise: AdminExerciseItem;
}

export const AdminExerciseEnginePreviewHost: React.FC<AdminExerciseEnginePreviewHostProps> = ({
  exercise,
}) => {
  // Map AdminExerciseItem to SharedExerciseItem for the engine
  const sharedItem: SharedExerciseItem = useMemo(() => {
    return {
      id: exercise.id,
      type: exercise.type,
      title: exercise.title,
      instruction: exercise.instruction,
      hskLevel: exercise.hskLevel,
      difficulty: exercise.difficulty,
      skill: exercise.skill,
      promptHanzi: exercise.promptHanzi,
      promptPinyin: exercise.promptPinyin,
      promptVietnamese: exercise.promptVietnamese,
      audioUrl: exercise.audioUrl,
      options: exercise.options,
      correctOptionIndex: exercise.correctOptionIndex,
      matchingPairs: exercise.matchingPairs,
      sentenceTokens: exercise.sentenceTokens,
      correctSentence: exercise.correctSentence,
      explanation: exercise.explanation,
      xpReward: exercise.xpReward,
    };
  }, [exercise]);

  // Interactive state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Initialize interactive tokens on exercise change
  useEffect(() => {
    setSelectedOption(null);
    setOrderedTokens([]);
    setAvailableTokens(exercise.sentenceTokens ? [...exercise.sentenceTokens] : []);
    setMatchedPairs([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setHasChecked(false);
    setIsCorrect(false);
  }, [exercise]);

  const handleSelectOption = (idx: number) => {
    if (hasChecked) return;
    setSelectedOption(idx);
  };

  const handleSelectToken = (token: string, idx: number) => {
    if (hasChecked) return;
    setOrderedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveToken = (token: string, idx: number) => {
    if (hasChecked) return;
    setOrderedTokens((prev) => prev.filter((_, i) => i !== idx));
    setAvailableTokens((prev) => [...prev, token]);
  };

  const handleLeftClick = (id: string) => {
    if (hasChecked) return;
    setSelectedLeft(id);
    if (selectedRight) {
      // Check match
      if (id === selectedRight) {
        setMatchedPairs((prev) => [...prev, id]);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const handleRightClick = (id: string) => {
    if (hasChecked) return;
    setSelectedRight(id);
    if (selectedLeft) {
      if (id === selectedLeft) {
        setMatchedPairs((prev) => [...prev, id]);
      }
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  const handleCheckAnswer = () => {
    let correct = false;
    if (exercise.type === 'multiple-choice' || exercise.type === 'fill-blank' || exercise.type === 'listen-choice' || exercise.type === 'chinese-to-vietnamese' || exercise.type === 'vietnamese-to-chinese') {
      correct = selectedOption === exercise.correctOptionIndex;
    } else if (exercise.type === 'sentence-order') {
      const built = orderedTokens.join('');
      const target = (exercise.correctSentence || '').replace(/[。？！\s]/g, '');
      correct = built.replace(/[。？！\s]/g, '') === target;
    } else if (exercise.type === 'matching') {
      const totalPairs = exercise.matchingPairs?.length || 0;
      correct = matchedPairs.length === totalPairs && totalPairs > 0;
    }
    setIsCorrect(correct);
    setHasChecked(true);
  };

  const handleReset = () => {
    setSelectedOption(null);
    setOrderedTokens([]);
    setAvailableTokens(exercise.sentenceTokens ? [...exercise.sentenceTokens] : []);
    setMatchedPairs([]);
    setSelectedLeft(null);
    setSelectedRight(null);
    setHasChecked(false);
    setIsCorrect(false);
  };

  return (
    <div
      style={{
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        backgroundColor: 'var(--surface)',
        padding: 'var(--space-4)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-4)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '8px',
        }}
      >
        <span
          style={{
            fontSize: '11px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: 'var(--primary)',
            letterSpacing: '0.05em',
          }}
        >
          Exercise Engine Live Host ({exercise.type})
        </span>

        <button
          type="button"
          className="ds-btn ds-btn-ghost"
          onClick={handleReset}
          style={{ height: '28px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
        >
          <RotateCcw size={12} />
          <span>Làm lại từ đầu</span>
        </button>
      </div>

      {/* Official Exercise Engine Component */}
      <ExerciseRenderer
        exercise={sharedItem}
        hasChecked={hasChecked}
        isCorrect={isCorrect}
        selectedOption={selectedOption}
        onSelectOption={handleSelectOption}
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

      {/* Control Buttons */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 'var(--space-2)',
          borderTop: '1px dashed var(--border)',
        }}
      >
        <div style={{ fontSize: '11px', color: 'var(--muted)' }}>
          {hasChecked ? (
            <span style={{ fontWeight: 600, color: isCorrect ? '#059669' : '#DC2626' }}>
              {isCorrect ? '✓ Học viên trả lời đúng' : '✗ Học viên trả lời sai'}
            </span>
          ) : (
            'Thao tác trực tiếp để kiểm thử trải nghiệm của học viên'
          )}
        </div>

        {!hasChecked ? (
          <button
            type="button"
            className="ds-btn ds-btn-primary"
            onClick={handleCheckAnswer}
            style={{ height: '32px', fontSize: 'var(--text-xs)', padding: '0 16px' }}
          >
            Kiểm tra đáp án
          </button>
        ) : (
          <button
            type="button"
            className="ds-btn ds-btn-secondary"
            onClick={handleReset}
            style={{ height: '32px', fontSize: 'var(--text-xs)', padding: '0 16px' }}
          >
            Thử lại
          </button>
        )}
      </div>
    </div>
  );
};
