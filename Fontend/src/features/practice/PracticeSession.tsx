import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Zap } from 'lucide-react';
import type { SharedExerciseItem } from '../exercise-engine';
import { ExerciseRenderer } from '../exercise-engine';
import type { PracticeSessionResult, PracticeMode } from './types';
import { PracticeResult } from './components/PracticeResult';
import { useAITutor, ContextBuilder } from '../ai-tutor';

interface PracticeSessionProps {
  mode: PracticeMode;
  title: string;
  subtitle: string;
  hskLevel: number;
  exercises: SharedExerciseItem[];
  onExit: () => void;
  onContinueRecommended?: () => void;
  onReviewMistakes?: () => void;
}

export const PracticeSession: React.FC<PracticeSessionProps> = ({
  mode,
  title,
  subtitle,
  hskLevel,
  exercises,
  onExit,
  onContinueRecommended,
  onReviewMistakes,
}) => {
  const { openAITutor } = useAITutor();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Exercise interaction states
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [selectedRight, setSelectedRight] = useState<string | null>(null);

  // Submission & evaluation states
  const [hasChecked, setHasChecked] = useState(false);
  const [isCurrentCorrect, setIsCurrentCorrect] = useState(false);

  // Session aggregate counters
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeList, setMistakeList] = useState<{ exercise: SharedExerciseItem; answer: string }[]>([]);
  const [startTime] = useState<number>(() => Date.now());
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [completedResult, setCompletedResult] = useState<PracticeSessionResult | null>(null);

  const currentExercise = exercises[currentIndex];

  // Initialize or reset tokens & options whenever index changes
  const initExercise = (index: number) => {
    const ex = exercises[index];
    if (!ex) return;
    setSelectedOption(null);
    setHasChecked(false);
    setIsCurrentCorrect(false);

    if (ex.type === 'sentence-order' && ex.sentenceTokens) {
      setAvailableTokens([...ex.sentenceTokens]);
      setOrderedTokens([]);
    } else if (ex.type === 'matching' && ex.matchingPairs) {
      setMatchedPairs([]);
      setSelectedLeft(null);
      setSelectedRight(null);
    }
  };

  useEffect(() => {
    initExercise(currentIndex);
  }, [currentIndex]);

  // Token handlers
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

  // Matching handlers
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
        setCorrectCount((prev) => prev + 1);
      }
    } else {
      setTimeout(() => {
        setSelectedLeft(null);
        setSelectedRight(null);
      }, 400);
    }
  };

  // Check Answer Handler
  const handleCheck = () => {
    if (!currentExercise || hasChecked) return;

    let right = false;
    let givenAnswer = '';

    if (currentExercise.type === 'sentence-order') {
      const assembled = orderedTokens.join('');
      right = assembled === currentExercise.correctSentence;
      givenAnswer = assembled;
    } else if (currentExercise.type === 'matching') {
      right = matchedPairs.length === (currentExercise.matchingPairs?.length || 0);
      givenAnswer = 'matched pairs';
    } else {
      right = selectedOption === currentExercise.correctOptionIndex;
      givenAnswer = (selectedOption !== null && currentExercise.options?.[selectedOption]) || '';
    }

    setIsCurrentCorrect(right);
    setHasChecked(true);

    if (right) {
      setCorrectCount((prev) => prev + 1);
    } else {
      setMistakeList((prev) => [...prev, { exercise: currentExercise, answer: givenAnswer }]);
    }
  };

  // Proceed to Next Question or Final Results
  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate results
      const totalTimeSec = Math.max(5, Math.round((Date.now() - startTime) / 1000));
      const accuracyPct = Math.round((correctCount / exercises.length) * 100);
      const earnedXp = correctCount * 3 + 10;

      // Group weak points
      const weakPointsMap: Record<string, number> = {};
      mistakeList.forEach((m) => {
        const point = m.exercise.grammarPoint || m.exercise.title;
        weakPointsMap[point] = (weakPointsMap[point] || 0) + 1;
      });

      const weakPoints = Object.entries(weakPointsMap).map(([title, count]) => ({
        title,
        count,
      }));

      const finalResult: PracticeSessionResult = {
        sessionId: 'sess-' + Date.now(),
        mode,
        skillTitle: title,
        hskLevel,
        totalQuestions: exercises.length,
        correctAnswers: correctCount,
        accuracy: accuracyPct,
        timeSpentSeconds: totalTimeSec,
        xpEarned: earnedXp,
        weakPoints,
        mistakeIds: mistakeList.map((m) => m.exercise.id),
      };

      setCompletedResult(finalResult);
      setSessionCompleted(true);
    }
  };

  // Can check state
  const canCheck =
    currentExercise.type === 'sentence-order'
      ? orderedTokens.length > 0 && availableTokens.length === 0
      : currentExercise.type === 'matching'
      ? matchedPairs.length === (currentExercise.matchingPairs?.length || 0)
      : selectedOption !== null;

  // Render Completed Result Screen
  if (sessionCompleted && completedResult) {
    return (
      <PracticeResult
        result={completedResult}
        onContinueRecommended={() => {
          if (onContinueRecommended) onContinueRecommended();
          else onExit();
        }}
        onReviewMistakes={() => {
          if (onReviewMistakes) onReviewMistakes();
          else onExit();
        }}
        onBackToCenter={onExit}
      />
    );
  }

  const progressPercent = Math.round(((currentIndex + 1) / exercises.length) * 100);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* =====================================================================
          MINIMALIST FOCUS MODE HEADER (No Main Navbar, No Sidebar)
          ===================================================================== */}
      <header
        style={{
          height: '60px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          padding: '0 var(--space-4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 40,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: 'var(--radius-full)',
              border: '1px solid var(--border)',
              backgroundColor: 'var(--background)',
              color: 'var(--muted)',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title="Thoát phiên luyện tập"
          >
            <X size={18} />
          </button>

          <div>
            <div style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--foreground)' }}>
              {title}
            </div>
            <div style={{ fontSize: '10px', color: 'var(--muted)', fontWeight: 500 }}>
              {subtitle} · HSK {hskLevel}
            </div>
          </div>
        </div>

        {/* Counter & Progress bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', minWidth: '160px', maxWidth: '300px', flex: 1, justifyContent: 'center' }}>
          <span style={{ fontSize: 'var(--text-xs)', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>
            {currentIndex + 1} / {exercises.length}
          </span>
          <div
            style={{
              flex: 1,
              height: '7px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--border)',
              overflow: 'hidden',
            }}
          >
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

        {/* Secondary XP badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 'var(--text-xs)',
            fontWeight: 700,
            color: 'var(--streak)',
            backgroundColor: 'var(--streak-bg)',
            padding: '3px 10px',
            borderRadius: 'var(--radius-full)',
          }}
        >
          <Zap size={13} />
          <span>+20 XP</span>
        </div>
      </header>

      {/* =====================================================================
          EXERCISE CANVAS (Shared Engine Renderer)
          ===================================================================== */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 'var(--space-6) var(--space-4) 100px var(--space-4)',
          maxWidth: '680px',
          width: '100%',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            width: '100%',
            borderRadius: 'var(--radius-2xl)',
            backgroundColor: 'var(--surface)',
            border: '1.5px solid var(--border)',
            padding: 'var(--space-6)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
          }}
        >
          <ExerciseRenderer
            exercise={currentExercise}
            hasChecked={hasChecked}
            isCorrect={isCurrentCorrect}
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
            onAskAI={(ctx) => {
              const aiCtx = ContextBuilder.build('practice', {
                hskLevel,
                lessonTitle: title,
                grammarPoints: ctx.grammarPoint ? [ctx.grammarPoint] : undefined,
                exerciseContext: {
                  exerciseId: ctx.exerciseId,
                  question: ctx.question,
                  userAnswer: ctx.userAnswer,
                  correctAnswer: ctx.correctAnswer,
                  explanation: ctx.explanation,
                },
              });
              openAITutor(aiCtx, `Tại sao trong câu "${ctx.question}" tôi chọn "${ctx.userAnswer}" lại sai? Giải thích giúp tôi.`);
            }}
          />
        </div>
      </main>

      {/* =====================================================================
          BOTTOM BAR IN THUMB ZONE (Mobile First Sticky Action Bar)
          ===================================================================== */}
      <footer
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'var(--surface)',
          borderTop: '1px solid var(--border)',
          padding: 'var(--space-3) var(--space-4)',
          zIndex: 50,
          boxShadow: '0 -4px 16px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '680px',
            margin: '0 auto',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'var(--space-3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--muted)' }}>
              {hasChecked
                ? isCurrentCorrect
                  ? '🎉 Hoàn hảo!'
                  : '⚠️ Hãy xem lại giải thích'
                : 'Chọn câu trả lời để kiểm tra'}
            </span>
          </div>

          <div>
            {!hasChecked ? (
              <button
                type="button"
                disabled={!canCheck}
                onClick={handleCheck}
                style={{
                  minWidth: '140px',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: canCheck ? 'var(--primary)' : 'var(--border)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: canCheck ? 'pointer' : 'not-allowed',
                  transition: 'all 0.15s ease',
                  boxShadow: canCheck ? '0 4px 12px rgba(67, 56, 202, 0.25)' : 'none',
                }}
              >
                KIỂM TRA
              </button>
            ) : (
              <button
                type="button"
                onClick={handleNext}
                style={{
                  minWidth: '150px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '12px 28px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--primary)',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: 'var(--text-sm)',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(67, 56, 202, 0.3)',
                }}
              >
                <span>{currentIndex < exercises.length - 1 ? 'TIẾP TỤC' : 'XEM KẾT QUẢ'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
