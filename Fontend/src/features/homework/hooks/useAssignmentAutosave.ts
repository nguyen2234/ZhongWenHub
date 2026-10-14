import { useState, useRef, useCallback, useEffect } from 'react';
import { studentAttemptService } from '../services/student-attempt.service';
import type { StudentQuestionAnswer } from '../types/student-homework.types';

export type AutosaveStatus = 'IDLE' | 'PENDING' | 'SAVING' | 'SAVED' | 'FAILED';

export interface UseAssignmentAutosaveProps {
  attemptId: string;
  onSaveSuccess?: () => void;
  onSaveError?: (error: unknown) => void;
}

export function useAssignmentAutosave({
  attemptId,
  onSaveSuccess,
  onSaveError,
}: UseAssignmentAutosaveProps) {
  const [autosaveStatus, setAutosaveStatus] = useState<AutosaveStatus>('IDLE');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sequenceRef = useRef(0);
  const latestAnswersRef = useRef<Record<string, StudentQuestionAnswer>>({});
  const isSavingRef = useRef(false);

  // Sync to attempt service
  const performSave = useCallback(
    async (answersToSave: Record<string, StudentQuestionAnswer>, seqNum: number) => {
      if (!attemptId) return;
      isSavingRef.current = true;
      setAutosaveStatus('SAVING');

      try {
        const result = await studentAttemptService.saveAttemptAnswers(
          attemptId,
          answersToSave,
          seqNum
        );

        if (result.saved) {
          setAutosaveStatus('SAVED');
          setLastSavedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          onSaveSuccess?.();
        } else {
          // If rejected because of older sequence, that's fine if another save succeeded
          setAutosaveStatus('SAVED');
        }
      } catch (err) {
        console.error('[useAssignmentAutosave] Error saving answers:', err);
        setAutosaveStatus('FAILED');
        onSaveError?.(err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [attemptId, onSaveSuccess, onSaveError]
  );

  // Trigger debounced autosave
  const triggerAutosave = useCallback(
    (newAnswers: Record<string, StudentQuestionAnswer>) => {
      latestAnswersRef.current = newAnswers;
      sequenceRef.current += 1;
      const currentSeq = sequenceRef.current;

      setAutosaveStatus('PENDING');

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      debounceTimerRef.current = setTimeout(() => {
        performSave(newAnswers, currentSeq);
      }, 700);
    },
    [performSave]
  );

  // Immediate synchronous flush (called before submission)
  const flushSave = useCallback(async (): Promise<boolean> => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }

    sequenceRef.current += 1;
    const currentSeq = sequenceRef.current;

    try {
      await performSave(latestAnswersRef.current, currentSeq);
      return true;
    } catch {
      return false;
    }
  }, [performSave]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  return {
    autosaveStatus,
    lastSavedAt,
    triggerAutosave,
    flushSave,
  };
}
