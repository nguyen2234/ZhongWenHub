import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { LessonExperience } from '../LessonExperience';
import {
  lessonContentService,
  lessonProgressService,
  userLearningService,
} from '../services';
import { LessonPlayerAdapter } from '../adapters/lesson-player.adapter';
import type { LessonDetailDTO } from '../types/lesson-content.types';
import type { LessonProgressDTO } from '../types/lesson-progress.types';
import type { UserLearningSummaryDTO } from '../types/user-learning-summary.types';
import { Button } from '../../../design-system';

export interface LessonPageProps {
  onBackToLearningPath?: () => void;
  onNextLesson?: () => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({
  onBackToLearningPath,
  onNextLesson,
}) => {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId?: string }>();
  const activeLessonId = lessonId || 'les-8';

  const [lessonDetail, setLessonDetail] = useState<LessonDetailDTO | null>(null);
  const [progress, setProgress] = useState<LessonProgressDTO | null>(null);
  const [learningSummary, setLearningSummary] = useState<UserLearningSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load lesson content, user lesson progress, and account learning summary
  useEffect(() => {
    let isCancelled = false;

    async function fetchLessonData() {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const [detailData, progressData, summaryData] = await Promise.all([
          lessonContentService.getLessonDetail(activeLessonId),
          lessonProgressService.getLessonProgress(activeLessonId),
          userLearningService.getUserLearningSummary(),
        ]);

        if (!isCancelled) {
          setLessonDetail(detailData);
          setProgress(progressData);
          setLearningSummary(summaryData);
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
  }, [activeLessonId]);

  // Handle step progression with LessonProgressService
  const handleStepChange = useCallback(
    async (stepIndex: number, maxUnlocked: number) => {
      if (!lessonDetail) return;
      try {
        const updatedProgress = await lessonProgressService.updateStepProgress({
          lessonId: lessonDetail.id,
          currentStepIndex: stepIndex,
          maxUnlockedStepIndex: maxUnlocked,
        });
        setProgress(updatedProgress);
      } catch (err) {
        console.error('[LessonPage] Error updating step progress:', err);
      }
    },
    [lessonDetail]
  );

  // Handle lesson completion with LessonProgressService & UserLearningService
  const handleLessonComplete = useCallback(
    async (score: number, totalQuestions: number, xpReward: number) => {
      if (!lessonDetail) return;
      try {
        const updatedProgress = await lessonProgressService.completeLesson({
          lessonId: lessonDetail.id,
          quizScore: score,
          totalQuizQuestions: totalQuestions,
          xpEarned: xpReward,
        });
        setProgress(updatedProgress);

        const updatedSummary = await userLearningService.recordActivity(xpReward);
        setLearningSummary(updatedSummary);
      } catch (err) {
        console.error('[LessonPage] Error completing lesson:', err);
      }
    },
    [lessonDetail]
  );

  // Handle lesson restart
  const handleRestartLesson = useCallback(async () => {
    if (!lessonDetail) return;
    try {
      const reset = await lessonProgressService.resetLessonProgress(lessonDetail.id);
      setProgress(reset);
    } catch (err) {
      console.error('[LessonPage] Error resetting lesson progress:', err);
    }
  }, [lessonDetail]);

  const handleBack = onBackToLearningPath ?? (() => navigate('/learning-path'));
  const handleNext =
    onNextLesson ?? (() => alert('Chuyển sang bài tiếp theo: Bài 9 (HSK 2)'));

  // Transform normalized LessonDetailDTO into student presentation model
  // Injects streakDays from UserLearningSummaryDTO
  const playerLessonData = useMemo(() => {
    if (!lessonDetail) return null;
    const streak = learningSummary?.streakDays ?? 8;
    return LessonPlayerAdapter.adaptLessonDetail(lessonDetail, streak);
  }, [lessonDetail, learningSummary]);

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
