import React, { useState, useEffect } from 'react';
import type { LessonData, StepMetadata } from './types';
import { lesson8Data } from './data/lesson8';
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

interface LessonExperienceProps {
  lessonData?: LessonData;
  onBackToLearningPath: () => void;
  onNextLesson?: () => void;
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
  lessonData = lesson8Data,
  onBackToLearningPath,
  onNextLesson,
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [maxUnlockedStepIndex, setMaxUnlockedStepIndex] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);

  // Quiz Score tracking
  const [quizScore, setQuizScore] = useState(4); // default demonstration or updated on quiz finish
  const totalQuizQuestions = lessonData.quiz.length;

  const { setContext } = useAITutor();
  const [currentVocabHanzi, setCurrentVocabHanzi] = useState<string>(lessonData.vocabulary[0].hanzi);

  // Update contextual AI state whenever current step changes
  useEffect(() => {
    const currentStep = STEP_METADATA_LIST[currentStepIndex];
    const ctx = ContextBuilder.build('lesson', {
      hskLevel: lessonData.hskLevel,
      lessonId: lessonData.id,
      lessonTitle: `${lessonData.hanziTitle} (${lessonData.pinyinTitle})`,
      currentStep: currentStep.label,
      grammarPoints: [lessonData.grammar.patternFormula],
      vocabularyWord: currentStepIndex === 1 ? { hanzi: currentVocabHanzi, pinyin: 'hē', meaning: 'uống' } : undefined,
    });
    setContext(ctx);

    return () => setContext(null);
  }, [currentStepIndex, lessonData, currentVocabHanzi, setContext]);

  // Navigate to step (only allowed if unlocked or already completed)
  const handleSelectStep = (index: number) => {
    if (index <= maxUnlockedStepIndex) {
      setCurrentStepIndex(index);
      setIsCompleted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Next step handler
  const handleNextStep = () => {
    if (currentStepIndex < STEP_METADATA_LIST.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      if (nextIndex > maxUnlockedStepIndex) {
        setMaxUnlockedStepIndex(nextIndex);
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Completed last step (Quiz) -> show Complete Screen
      setIsCompleted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Previous step handler
  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
      setIsCompleted(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Quiz completion
  const handleCompleteQuiz = (score: number) => {
    setQuizScore(score);
    setIsCompleted(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Restart lesson
  const handleRestartLesson = () => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--background)',
      }}
    >
      {/* 1. COMPACT LESSON HEADER (Learning Mode Only) */}
      <LessonHeader
        hskLevel={lessonData.hskLevel}
        unitNumber={lessonData.unitNumber}
        lessonNumber={lessonData.lessonNumber}
        hanziTitle={lessonData.hanziTitle}
        pinyinTitle={lessonData.pinyinTitle}
        currentStepIndex={currentStepIndex}
        totalSteps={STEP_METADATA_LIST.length}
        streakDays={lessonData.streakDays}
        xpReward={lessonData.xpReward}
        steps={STEP_METADATA_LIST}
        maxUnlockedStepIndex={maxUnlockedStepIndex}
        onBackToLearningPath={onBackToLearningPath}
        onSelectStep={handleSelectStep}
      />

      {/* 2. MAIN LEARNING CANVAS (Max-width 760-850px centered) */}
      <main
        style={{
          flex: 1,
          width: '100%',
          maxWidth: '850px',
          margin: '0 auto',
          padding: 'var(--space-6) var(--space-4) var(--space-8) var(--space-4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {isCompleted ? (
          <LessonComplete
            lesson={lessonData}
            quizScore={quizScore}
            totalQuizQuestions={totalQuizQuestions}
            onRestartLesson={handleRestartLesson}
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

      {/* 3. STICKY BOTTOM ACTION BAR (Hidden when lesson is complete) */}
      {!isCompleted && (
        <LessonActionBar
          canGoBack={currentStepIndex > 0}
          onGoBack={handlePrevStep}
          onNext={handleNextStep}
          isCompleted={currentStepIndex === STEP_METADATA_LIST.length - 1}
        />
      )}
    </div>
  );
};
