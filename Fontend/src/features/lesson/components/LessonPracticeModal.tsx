import React, { useEffect, useRef, useCallback } from 'react';
import type { LessonData } from '../types';
import type { LessonProgressDTO } from '../types/lesson-progress.types';
import type { UserLearningSummaryDTO } from '../types/user-learning-summary.types';
import { LessonExperience } from '../LessonExperience';
import { useLearningTracking } from '../../learning/hooks/useLearningTracking';
import './LessonPracticeModal.css';

export interface LessonPracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  lessonData: LessonData;
  initialProgress?: LessonProgressDTO;
  learningSummary?: UserLearningSummaryDTO;
  triggerRef?: React.RefObject<HTMLElement | null>;
  onNextLesson?: () => void;
  onStepChange?: (stepIndex: number, maxUnlocked: number) => void;
  onLessonComplete?: (quizScore: number, totalQuestions: number, xpEarned: number) => void;
  onRestartLesson?: () => void;
}

export const LessonPracticeModal: React.FC<LessonPracticeModalProps> = ({
  isOpen,
  onClose,
  lessonData,
  initialProgress,
  learningSummary,
  triggerRef,
  onNextLesson,
  onStepChange,
  onLessonComplete,
  onRestartLesson,
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const {
    startSession,
    pauseSession,
    completeSession,
    trackStepEntered,
    trackStepCompleted,
  } = useLearningTracking();

  const prevStepRef = useRef<number>(initialProgress?.currentStepIndex ?? 0);

  // 1. Session Tracking Lifecycle on Open / Close
  useEffect(() => {
    if (!isOpen) return;

    // Start educational tracking session
    startSession(String(lessonData.id), lessonData.hskLevel);
    trackStepEntered('step-0', 0);
    prevStepRef.current = 0;

    return () => {
      pauseSession('modal_closed');
    };
  }, [isOpen, lessonData.id, lessonData.hskLevel, startSession, pauseSession, trackStepEntered]);

  // 2. Lock body scroll and restore on unmount
  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      // Restore focus to trigger element
      if (triggerRef?.current) {
        triggerRef.current.focus();
      }
    };
  }, [isOpen, triggerRef]);

  // 3. Escape key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 4. Focus Trap inside modal dialog
  useEffect(() => {
    if (!isOpen || !dialogRef.current) return;

    const dialogEl = dialogRef.current;

    // Focus first focusable element inside modal on open
    const focusableSelectors =
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = dialogEl.querySelectorAll<HTMLElement>(focusableSelectors);
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleFocusTrap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      const elements = dialogEl.querySelectorAll<HTMLElement>(focusableSelectors);
      if (elements.length === 0) return;

      const firstEl = elements[0];
      const lastEl = elements[elements.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === firstEl) {
          e.preventDefault();
          lastEl.focus();
        }
      } else {
        if (document.activeElement === lastEl) {
          e.preventDefault();
          firstEl.focus();
        }
      }
    };

    dialogEl.addEventListener('keydown', handleFocusTrap);
    return () => dialogEl.removeEventListener('keydown', handleFocusTrap);
  }, [isOpen]);

  const handleStepChange = useCallback(
    (nextStepIdx: number, maxUnlocked: number) => {
      trackStepCompleted(`step-${prevStepRef.current}`, prevStepRef.current);
      trackStepEntered(`step-${nextStepIdx}`, nextStepIdx);
      prevStepRef.current = nextStepIdx;
      onStepChange?.(nextStepIdx, maxUnlocked);
    },
    [onStepChange, trackStepCompleted, trackStepEntered]
  );

  const handleLessonComplete = useCallback(
    (quizScore: number, totalQuestions: number, xpEarned: number) => {
      completeSession(quizScore, totalQuestions, xpEarned);
      onLessonComplete?.(quizScore, totalQuestions, xpEarned);
    },
    [completeSession, onLessonComplete]
  );

  if (!isOpen) return null;

  return (
    <div
      className="zh-practice-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="lesson-practice-modal-title"
        className="zh-practice-modal-dialog"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside dialog
      >
        <LessonExperience
          mode="modal"
          lessonData={lessonData}
          initialProgress={initialProgress}
          learningSummary={learningSummary}
          onBackToLearningPath={onClose}
          onCloseModal={onClose}
          onNextLesson={onNextLesson}
          onStepChange={handleStepChange}
          onLessonComplete={handleLessonComplete}
          onRestartLesson={onRestartLesson}
        />
      </div>
    </div>
  );
};
