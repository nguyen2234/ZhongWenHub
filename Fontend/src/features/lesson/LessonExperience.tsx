import React, { useState, useEffect } from 'react';
import type { LessonData, StepMetadata } from './types';
import type { LessonProgressDTO } from './types/lesson-progress.types';
import type { UserLearningSummaryDTO } from './types/user-learning-summary.types';
import { LessonHeader } from './components/LessonHeader';
import { LessonActionBar } from './components/LessonActionBar';
import { IntroStep } from './steps/IntroStep';
import { VocabularyStep } from './steps/VocabularyStep';
import { GrammarStep } from './steps/GrammarStep';
import { DialogueStep } from './steps/DialogueStep';
import { ListeningStep } from './steps/ListeningStep';
import { ExerciseStep } from './steps/ExerciseStep';
import { QuizStep } from './steps/QuizStep';
import { LessonComplete } from './steps/LessonComplete';
import { useAITutor, ContextBuilder } from '../ai-tutor';

export interface LessonExperienceProps {
  lessonData: LessonData;
  initialProgress?: LessonProgressDTO;
  learningSummary?: UserLearningSummaryDTO;
  mode?: 'standalone' | 'embedded';
  onBackToLearningPath: () => void;
  onNextLesson?: () => void;
  onStepChange?: (stepIndex: number, maxUnlocked: number) => void;
  onLessonComplete?: (quizScore: number, totalQuestions: number, xpEarned: number) => void;
  onRestartLesson?: () => void;
}

const STEP_METADATA_LIST: StepMetadata[] = [
  { id: 'intro', label: '1. Giới thiệu', shortLabel: 'Giới thiệu' },
  { id: 'vocabulary', label: '2. Từ vựng', shortLabel: 'Từ vựng' },
  { id: 'grammar', label: '3. Ngữ pháp', shortLabel: 'Ngữ pháp' },
  { id: 'dialogue', label: '4. Hội thoại', shortLabel: 'Hội thoại' },
  { id: 'listening', label: '5. Luyện nghe', shortLabel: 'Luyện nghe' },
  { id: 'exercise', label: '6. Luyện tập', shortLabel: 'Luyện tập' },
  { id: 'quiz', label: '7. Mini Quiz', shortLabel: 'Quiz' },
];

export const LessonExperience: React.FC<LessonExperienceProps> = ({
  lessonData,
  initialProgress,
  learningSummary,
  mode = 'standalone',
  onBackToLearningPath,
  onNextLesson,
  onStepChange,
  onLessonComplete,
  onRestartLesson,
}) => {
  // Initialize progress state from LessonProgressDTO
  const [currentStepIndex, setCurrentStepIndex] = useState(
    initialProgress?.currentStepIndex ?? 0
  );
  const [maxUnlockedStepIndex, setMaxUnlockedStepIndex] = useState(
    initialProgress?.maxUnlockedStepIndex ?? 0
  );
  const [isCompleted, setIsCompleted] = useState(
    initialProgress?.status === 'COMPLETED'
  );

  // Quiz Score tracking
  const [quizScore, setQuizScore] = useState(
    initialProgress?.quizScore ?? 4
  );
  const totalQuizQuestions = lessonData.quiz.length;

  // Global user learning state (streakDays separated from lesson progress)
  const streakDays = learningSummary?.streakDays ?? lessonData.streakDays ?? 8;

  const { setContext } = useAITutor();
  const [currentVocabHanzi, setCurrentVocabHanzi] = useState<string>(
    lessonData.vocabulary[0]?.hanzi || '喝'
  );

  // Update contextual AI state whenever current step changes
  useEffect(() => {
    const currentStep = STEP_METADATA_LIST[currentStepIndex];
    const ctx = ContextBuilder.build('lesson', {
      hskLevel: lessonData.hskLevel,
      lessonId: lessonData.id,
      lessonTitle: `${lessonData.hanziTitle} (${lessonData.pinyinTitle})`,
      currentStep: currentStep.label,
      grammarPoints: [lessonData.grammar.patternFormula],
      vocabularyWord:
        currentStepIndex === 1
          ? { hanzi: currentVocabHanzi, pinyin: 'hē', meaning: 'uống' }
          : undefined,
    });
    setContext(ctx);

    return () => setContext(null);
  }, [currentStepIndex, lessonData, currentVocabHanzi, setContext]);

  // Navigate to step (only allowed if unlocked or already completed)
  const handleSelectStep = (index: number) => {
    if (index <= maxUnlockedStepIndex) {
      setCurrentStepIndex(index);
      setIsCompleted(false);
      onStepChange?.(index, maxUnlockedStepIndex);
      if (mode === 'standalone') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Next step handler
  const handleNextStep = () => {
    if (currentStepIndex < STEP_METADATA_LIST.length - 1) {
      const nextIndex = currentStepIndex + 1;
      const nextMaxUnlocked = Math.max(maxUnlockedStepIndex, nextIndex);
      setCurrentStepIndex(nextIndex);
      if (nextIndex > maxUnlockedStepIndex) {
        setMaxUnlockedStepIndex(nextIndex);
      }
      onStepChange?.(nextIndex, nextMaxUnlocked);
      if (mode === 'standalone') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      // Completed last step (Quiz) -> show Complete Screen
      setIsCompleted(true);
      onLessonComplete?.(quizScore, totalQuizQuestions, lessonData.xpReward);
      if (mode === 'standalone') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Previous step handler
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      setIsCompleted(false);
      onStepChange?.(prevIndex, maxUnlockedStepIndex);
      if (mode === 'standalone') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  // Handle Quiz completion
  const handleCompleteQuiz = (score: number) => {
    setQuizScore(score);
    setIsCompleted(true);
    onLessonComplete?.(score, totalQuizQuestions, lessonData.xpReward);
    if (mode === 'standalone') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Restart lesson
  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
    onRestartLesson?.();
    if (mode === 'standalone') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Composed lesson model for LessonComplete (streakDays composed from UserLearningSummaryDTO)
  const completeLessonViewModel: LessonData = {
    ...lessonData,
    streakDays,
  };

  return (
    <div
      style={{
        minHeight: mode === 'embedded' ? 'auto' : '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: mode === 'embedded' ? '#ffffff' : 'var(--background)',
        borderRadius: mode === 'embedded' ? '16px' : '0',
        border: mode === 'embedded' ? '1.5px solid #e2e8f0' : 'none',
        overflow: 'hidden',
        boxShadow: mode === 'embedded' ? '0 2px 12px rgba(0, 0, 0, 0.03)' : 'none',
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* 1. LESSON HEADER */}
      {mode === 'standalone' ? (
        <LessonHeader
          hskLevel={lessonData.hskLevel}
          unitNumber={lessonData.unitNumber}
          lessonNumber={lessonData.lessonNumber}
          hanziTitle={lessonData.hanziTitle}
          pinyinTitle={lessonData.pinyinTitle}
          currentStepIndex={currentStepIndex}
          totalSteps={STEP_METADATA_LIST.length}
          streakDays={streakDays}
          xpReward={lessonData.xpReward}
          steps={STEP_METADATA_LIST}
          maxUnlockedStepIndex={maxUnlockedStepIndex}
          onBackToLearningPath={onBackToLearningPath}
          onSelectStep={handleSelectStep}
        />
      ) : (
        <div
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 800,
                color: 'var(--primary, #E60012)',
                backgroundColor: '#FFF0F1',
                padding: '3px 8px',
                borderRadius: '6px',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Bước {currentStepIndex + 1}/{STEP_METADATA_LIST.length}
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#0f172a' }}>
              {STEP_METADATA_LIST[currentStepIndex]?.label}
            </span>
          </div>

          {/* Quick step navigation pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {STEP_METADATA_LIST.map((step, idx) => {
              const isUnlocked = idx <= maxUnlockedStepIndex;
              const isActive = idx === currentStepIndex;
              return (
                <button
                  key={step.id}
                  type="button"
                  disabled={!isUnlocked}
                  onClick={() => handleSelectStep(idx)}
                  style={{
                    height: '26px',
                    padding: '0 8px',
                    borderRadius: '6px',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    backgroundColor: isActive
                      ? 'var(--primary, #E60012)'
                      : isUnlocked
                      ? '#f1f5f9'
                      : '#f8fafc',
                    color: isActive ? '#ffffff' : isUnlocked ? '#475569' : '#cbd5e1',
                    transition: 'all 0.15s ease',
                  }}
                  title={step.label}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. MAIN LEARNING CANVAS */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: mode === 'embedded' ? '100%' : '850px',
          margin: '0 auto',
          padding: mode === 'embedded'
            ? '20px 20px 28px'
            : 'var(--space-6) var(--space-4) var(--space-8) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          boxSizing: 'border-box',
        }}
      >
        {isCompleted ? (
          <LessonComplete
            lesson={completeLessonViewModel}
            quizScore={quizScore}
            totalQuizQuestions={totalQuizQuestions}
            onRestartLesson={handleRestart}
            onBackToLearningPath={onBackToLearningPath}
            onNextLesson={onNextLesson}
          />
        ) : (
          <>
            {currentStepIndex === 0 && <IntroStep lesson={lessonData} />}
            {currentStepIndex === 1 && (
              <VocabularyStep
                vocabulary={lessonData.vocabulary}
                onWordIndexChange={(word) => setCurrentVocabHanzi(word)}
              />
            )}
            {currentStepIndex === 2 && <GrammarStep grammar={lessonData.grammar} />}
            {currentStepIndex === 3 && <DialogueStep dialogue={lessonData.dialogue} />}
            {currentStepIndex === 4 && <ListeningStep listening={lessonData.listening} />}
            {currentStepIndex === 5 && (
              <ExerciseStep
                exercises={lessonData.exercises}
                onCompleteAllExercises={handleNextStep}
              />
            )}
            {currentStepIndex === 6 && (
              <QuizStep quiz={lessonData.quiz} onCompleteQuiz={handleCompleteQuiz} />
            )}
          </>
        )}
      </main>

      {/* 3. BOTTOM ACTION BAR (Hidden when lesson is complete) */}
      {!isCompleted && (
        <div style={{ position: 'relative', width: '100%' }}>
          <LessonActionBar
            canGoBack={currentStepIndex > 0}
            onGoBack={handlePrevStep}
            onNext={handleNextStep}
            isCompleted={currentStepIndex === STEP_METADATA_LIST.length - 1}
          />
        </div>
      )}
    </div>
  );
};
