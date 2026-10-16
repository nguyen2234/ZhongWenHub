import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { LessonExperience } from '../LessonExperience';
import { lessonContentService } from '../services';
import { LessonPlayerAdapter } from '../adapters/lesson-player.adapter';
import type { LessonDetailDTO } from '../types/lesson-content.types';
import type { LessonProgressDTO } from '../types/lesson-progress.types';
import { Button } from '../../../design-system';
import { useLearningState } from '../../learning';
import { findNextLessonId } from '../../learning/data/curriculumData';

export interface LessonPageProps {
  onBackToLearningPath?: () => void;
  onNextLesson?: () => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({
  onBackToLearningPath,
  onNextLesson,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { lessonId } = useParams<{ lessonId?: string }>();
  const searchParams = new URLSearchParams(location.search);
  const queryId = searchParams.get('id');

  const {
    state: learningState,
    updateLessonStep: updateLearningStep,
    completeLesson: completeLearningLesson,
    restartLesson: restartLearningLesson,
    startLesson: initLearningLesson,
  } = useLearningState();

  const activeLessonId = lessonId || queryId || learningState.currentLessonId || 'les-8';

  const [lessonDetail, setLessonDetail] = useState<LessonDetailDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load lesson content and ensure lesson initialized in learning state
  useEffect(() => {
    let isCancelled = false;

    async function fetchLessonData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const detailData = await lessonContentService.getLessonDetail(activeLessonId);

        if (!isCancelled) {
          setLessonDetail(detailData);
          initLearningLesson(activeLessonId);
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          console.error('[LessonPage] Error loading lesson data:', err);
          setErrorMessage('Không thể tải bài học. Vui lòng thử lại.');
          setIsLoading(false);
        }
      }
    }

    fetchLessonData();

    return () => {
      isCancelled = true;
    };
  }, [activeLessonId, initLearningLesson]);

  // Read current lesson progress from reactive learning state
  const progress: LessonProgressDTO = useMemo(() => {
    const existing = learningState.lessonProgress[activeLessonId];
    if (existing) return existing;

    return {
      lessonId: activeLessonId,
      userId: learningState.studentId,
      status: 'IN_PROGRESS',
      currentStepIndex: 0,
      maxUnlockedStepIndex: 0,
      quizScore: 0,
      totalQuizQuestions: 5,
      xpEarned: 0,
      updatedAt: new Date().toISOString(),
    };
  }, [learningState.lessonProgress, activeLessonId, learningState.studentId]);

  // Handle step progression with shared LearningStateService
  const handleStepChange = useCallback(
    (stepIndex: number, maxUnlocked: number) => {
      if (!lessonDetail) return;
      updateLearningStep({
        lessonId: lessonDetail.id,
        currentStepIndex: stepIndex,
        maxUnlockedStepIndex: maxUnlocked,
      });
    },
    [lessonDetail, updateLearningStep]
  );

  // Handle lesson completion with shared LearningStateService (awards XP once idempotently)
  const handleLessonComplete = useCallback(
    (score: number, totalQuestions: number, xpReward: number) => {
      if (!lessonDetail) return;
      completeLearningLesson({
        lessonId: lessonDetail.id,
        quizScore: score,
        totalQuizQuestions: totalQuestions,
        xpEarned: xpReward,
      });
    },
    [lessonDetail, completeLearningLesson]
  );

  // Handle lesson restart
  const handleRestartLesson = useCallback(() => {
    if (!lessonDetail) return;
    restartLearningLesson(lessonDetail.id);
  }, [lessonDetail, restartLearningLesson]);

  const handleBack = onBackToLearningPath ?? (() => navigate('/learning-path'));
  const handleNext =
    onNextLesson ??
    (() => {
      const nextId = findNextLessonId(activeLessonId);
      if (nextId) {
        initLearningLesson(nextId);
        navigate(`/lesson?id=${nextId}`);
      } else {
        navigate('/learning-path');
      }
    });

  // Transform normalized LessonDetailDTO into student presentation model
  const playerLessonData = useMemo(() => {
    if (!lessonDetail) return null;
    return LessonPlayerAdapter.adaptLessonDetail(lessonDetail, learningState.streakDays);
  }, [lessonDetail, learningState.streakDays]);

  const learningSummary = useMemo(() => ({
    xpTotal: learningState.xpTotal,
    streakDays: learningState.streakDays,
    dailyGoalProgress: 3,
    dailyGoalTarget: 5,
  }), [learningState.xpTotal, learningState.streakDays]);

  // 1. Loading State
  if (isLoading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-3)',
          backgroundColor: 'var(--background)',
          color: 'var(--muted)',
        }}
      >
        <Loader2
          size={36}
          style={{ animation: 'spin 1s linear infinite', color: 'var(--primary)' }}
        />
        <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>
          Đang tải nội dung bài học...
        </p>
      </div>
    );
  }

  // 2. Error State
  if (errorMessage || !playerLessonData) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--space-4)',
          backgroundColor: 'var(--background)',
          padding: 'var(--space-4)',
        }}
      >
        <div
          style={{
            padding: 'var(--space-6)',
            borderRadius: 'var(--radius-xl)',
            backgroundColor: 'var(--surface)',
            border: '1px solid var(--border)',
            maxWidth: '420px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 'var(--space-3)',
          }}
        >
          <AlertCircle size={40} style={{ color: 'var(--error, #ef4444)' }} />
          <h2 style={{ fontSize: 'var(--text-lg)', fontWeight: 700 }}>
            Không thể tải bài học
          </h2>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--muted)' }}>
            {errorMessage || 'Dữ liệu bài học không khả dụng.'}
          </p>
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-2)' }}>
            <Button variant="primary" onClick={() => window.location.reload()}>
              Thử lại
            </Button>
            <Button variant="secondary" onClick={handleBack}>
              Quay lại lộ trình
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Render LessonExperience with prepared data & services
  return (
    <LessonExperience
      lessonData={playerLessonData}
      initialProgress={progress || undefined}
      learningSummary={learningSummary || undefined}
      onBackToLearningPath={handleBack}
      onNextLesson={handleNext}
      onStepChange={handleStepChange}
      onLessonComplete={handleLessonComplete}
      onRestartLesson={handleRestartLesson}
    />
  );
};

export default LessonPage;
