import React, { useState } from 'react';
import { Target, CheckCircle2 } from 'lucide-react';
import type { AIPracticeBlockData } from '../../types';
import { ExerciseRenderer } from '../../../exercise-engine';

interface AIPracticeBlockProps {
  data: AIPracticeBlockData;
}

export const AIPracticeBlock: React.FC<AIPracticeBlockProps> = ({ data }) => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>(() => data.exercise.sentenceTokens || []);
  const [matchedPairs] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  const [hasChecked, setHasChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSelectToken = (tok: string, idx: number) => {
    if (hasChecked) return;
    setOrderedTokens((prev) => [...prev, tok]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveToken = (tok: string, idx: number) => {
    if (hasChecked) return;
    setOrderedTokens((prev) => prev.filter((_, i) => i !== idx));
    setAvailableTokens((prev) => [...prev, tok]);
  };

  const handleCheck = () => {
    if (data.exercise.type === 'sentence-order') {
      const assembled = orderedTokens.join('');
      const ok = assembled === data.exercise.correctSentence;
      setIsCorrect(ok);
      setHasChecked(true);
    } else {
      const ok = selectedOption === data.exercise.correctOptionIndex;
      setIsCorrect(ok);
      setHasChecked(true);
    }
  };

  const canCheck =
    data.exercise.type === 'sentence-order'
      ? orderedTokens.length > 0 && availableTokens.length === 0
      : selectedOption !== null;

  return (
    <div
      style={{
        borderRadius: 'var(--radius-xl)',
        backgroundColor: 'var(--surface)',
        border: '1.5px solid var(--primary)',
        padding: 'var(--space-4)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--space-3)',
        boxShadow: '0 4px 14px rgba(67, 56, 202, 0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Target size={16} style={{ color: 'var(--primary)' }} />
          <span
            style={{
              fontSize: 'var(--text-xs)',
              fontWeight: 800,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
            }}
          >
            THỬ SỨC MINI DRILL DO AI TẠO
          </span>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--streak)', fontWeight: 700 }}>
          +{data.exercise.xpReward || 5} XP
        </span>
      </div>

      {/* Reuse shared ExerciseRenderer */}
      <ExerciseRenderer
        exercise={data.exercise}
        hasChecked={hasChecked}
        isCorrect={isCorrect}
        selectedOption={selectedOption}
        onSelectOption={setSelectedOption}
        orderedTokens={orderedTokens}
        availableTokens={availableTokens}
        onSelectToken={handleSelectToken}
        onRemoveToken={handleRemoveToken}
        matchedPairs={matchedPairs}
        selectedLeft={selectedLeft}
        selectedRight={selectedRight}
        onLeftClick={(id) => setSelectedLeft(id)}
        onRightClick={(id) => setSelectedRight(id)}
      />

      {/* Check action */}
      {!hasChecked && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--space-2)' }}>
          <button
            type="button"
            disabled={!canCheck}
            onClick={handleCheck}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 20px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: canCheck ? 'var(--primary)' : 'var(--border)',
              color: '#ffffff',
              border: 'none',
              fontSize: 'var(--text-xs)',
              fontWeight: 700,
              cursor: canCheck ? 'pointer' : 'not-allowed',
            }}
          >
            <CheckCircle2 size={13} />
            <span>KIỂM TRA CÂU NÀY</span>
          </button>
        </div>
      )}
    </div>
  );
};
