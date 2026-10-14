import { useState, useCallback, useMemo } from 'react';
import type {
  StudentAssignmentRunnerDTO,
  StudentAssignmentAttempt,
  StudentQuestionAnswer,
  StudentRunnerQuestionDTO,
} from '../types/student-homework.types';
import { useAssignmentAutosave } from './useAssignmentAutosave';
import { useAssignmentTimer } from './useAssignmentTimer';

export interface UseAssignmentRunnerProps {
  runnerData: StudentAssignmentRunnerDTO;
  attempt: StudentAssignmentAttempt;
  onSubmit: (answers: Record<string, StudentQuestionAnswer>) => Promise<void>;
}

export function useAssignmentRunner({ runnerData, attempt, onSubmit }: UseAssignmentRunnerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, StudentQuestionAnswer>>(() => ({
    ...attempt.answers,
  }));
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => {
    const set = new Set<string>();
    Object.entries(attempt.answers).forEach(([qId, ans]) => {
      if (ans.isFlagged) set.add(qId);
    });
    return set;
  });

  const { autosaveStatus, lastSavedAt, triggerAutosave, flushSave } = useAssignmentAutosave({
    attemptId: attempt.id,
  });

  const handleExpire = useCallback(() => {
    // When time expires, auto-submit latest answers
    onSubmit(answers);
  }, [answers, onSubmit]);

  const { formattedTime, remainingSeconds, isWarning5Min, isWarning1Min, isExpired } = useAssignmentTimer({
    expiresAt: attempt.expiresAt,
    onExpire: handleExpire,
  });

  const currentQuestion: StudentRunnerQuestionDTO | undefined = runnerData.questions[currentIndex];

  // Set or update an answer
  const updateAnswer = useCallback(
    (questionId: string, val: any, type: any) => {
      setAnswers((prev) => {
        const updated: Record<string, StudentQuestionAnswer> = {
          ...prev,
          [questionId]: {
            questionId,
            exerciseType: type,
            value: val,
            isFlagged: flaggedIds.has(questionId),
            answeredAt: new Date().toISOString(),
          },
        };

        triggerAutosave(updated);
        return updated;
      });
    },
    [flaggedIds, triggerAutosave]
  );

  // Toggle review flag for question
  const toggleFlag = useCallback(
    (questionId: string) => {
      setFlaggedIds((prev) => {
        const next = new Set(prev);
        if (next.has(questionId)) {
          next.delete(questionId);
        } else {
          next.add(questionId);
        }

        // Also update answers map if answer exists
        setAnswers((prevAns) => {
          if (prevAns[questionId]) {
            const updated = {
              ...prevAns,
              [questionId]: {
                ...prevAns[questionId],
                isFlagged: next.has(questionId),
              },
            };
            triggerAutosave(updated);
            return updated;
          }
          return prevAns;
        });

        return next;
      });
    },
    [triggerAutosave]
  );

  const goToNext = useCallback(() => {
    if (currentIndex < runnerData.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  }, [currentIndex, runnerData.questions.length]);

  const goToPrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  }, [currentIndex]);

  const jumpToQuestion = useCallback((idx: number) => {
    if (idx >= 0 && idx < runnerData.questions.length) {
      setCurrentIndex(idx);
    }
  }, [runnerData.questions.length]);

  // Aggregate stats
  const totalQuestions = runnerData.questions.length;
  const answeredCount = useMemo(() => {
    return Object.keys(answers).filter((qId) => {
      const val = answers[qId]?.value;
      if (val === null || val === undefined) return false;
      if (typeof val === 'string') return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === 'object') return Object.keys(val).length > 0;
      return true;
    }).length;
  }, [answers]);

  const unansweredCount = Math.max(0, totalQuestions - answeredCount);
  const flaggedCount = flaggedIds.size;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return {
    currentIndex,
    currentQuestion,
    totalQuestions,
    answers,
    flaggedIds,
    answeredCount,
    unansweredCount,
    flaggedCount,
    progressPercent,
    updateAnswer,
    toggleFlag,
    goToNext,
    goToPrev,
    jumpToQuestion,
    autosaveStatus,
    lastSavedAt,
    flushSave,
    formattedTime,
    remainingSeconds,
    isWarning5Min,
    isWarning1Min,
    isExpired,
  };
}
