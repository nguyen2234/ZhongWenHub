import React, { createContext, useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  INITIAL_VOCABULARY_LIST,
  predictIntervalLabels,
  type ReviewQueueItem,
  type VocabularyItem,
  type SRSRating,
} from '..';
import { useLearningState } from '../../learning';

export interface VocabularyReviewContextType {
  reviewQueue: ReviewQueueItem[];
  startReviewSession: () => void;
  reviewSingleWord: (word: VocabularyItem) => void;
  exitReviewSession: () => void;
  setReviewQueue: React.Dispatch<React.SetStateAction<ReviewQueueItem[]>>;
  onRateWord: (vocabId: string, rating: SRSRating) => void;
  onFinishSession: (stats?: { count?: number; xp?: number }) => void;
}

const VocabularyReviewContext = createContext<VocabularyReviewContextType | null>(null);

/**
 * Builds due review queue by cross-referencing INITIAL_VOCABULARY_LIST with user's SRS states
 */
function buildDueReviewQueue(
  userVocabStates: Record<string, any>,
  userSrsStates: Record<string, any>
): ReviewQueueItem[] {
  const queue: ReviewQueueItem[] = [];

  for (const vocab of INITIAL_VOCABULARY_LIST) {
    const userState = userVocabStates[vocab.id];
    if (userState && userState.isDueToday) {
      const srsState = userSrsStates[vocab.id] || {
        vocabularyId: vocab.id,
        stability: 1.0,
        difficulty: 4.0,
        interval: 1,
        repetitions: 1,
        easeFactor: 2.5,
      };

      queue.push({
        vocabulary: vocab,
        userState,
        srsState,
        predictedIntervals: predictIntervalLabels(srsState),
      });
    }
  }

  return queue;
}

export const VocabularyReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { state, recordSrsReview, completeSrsSession } = useLearningState();

  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(() =>
    buildDueReviewQueue(state.userVocabStates, state.userSrsStates)
  );

  // Synchronize queue when state changes
  useEffect(() => {
    setReviewQueue(buildDueReviewQueue(state.userVocabStates, state.userSrsStates));
  }, [state.userVocabStates, state.userSrsStates]);

  const startReviewSession = useCallback(() => {
    const freshQueue = buildDueReviewQueue(state.userVocabStates, state.userSrsStates);
    setReviewQueue(freshQueue);
    navigate('/srs-review');
  }, [navigate, state.userVocabStates, state.userSrsStates]);

  const reviewSingleWord = useCallback((word: VocabularyItem) => {
    const userState = state.userVocabStates[word.id] || {
      vocabularyId: word.id,
      status: 'learning',
      firstLearnedAt: '2026-10-01',
      lastReviewedAt: '2026-10-02',
      nextReviewAt: '2026-10-03',
      reviewCount: 1,
      correctCount: 1,
      isDueToday: true,
    };
    const srsState = state.userSrsStates[word.id] || {
      vocabularyId: word.id,
      stability: 1.2,
      difficulty: 4.5,
      interval: 1,
      repetitions: 1,
      easeFactor: 2.5,
    };

    setReviewQueue([
      {
        vocabulary: word,
        userState,
        srsState,
        predictedIntervals: predictIntervalLabels(srsState),
      },
    ]);
    navigate('/srs-review');
  }, [navigate, state.userVocabStates, state.userSrsStates]);

  const exitReviewSession = useCallback(() => {
    navigate('/vocabulary');
  }, [navigate]);

  const onRateWord = useCallback((vocabId: string, rating: SRSRating) => {
    recordSrsReview(vocabId, rating);
  }, [recordSrsReview]);

  const onFinishSession = useCallback((stats?: { count?: number; xp?: number }) => {
    completeSrsSession(stats?.xp ?? 30, stats?.count ?? reviewQueue.length);
  }, [completeSrsSession, reviewQueue.length]);

  const value = useMemo(
    () => ({
      reviewQueue,
      startReviewSession,
      reviewSingleWord,
      exitReviewSession,
      setReviewQueue,
      onRateWord,
      onFinishSession,
    }),
    [
      reviewQueue,
      startReviewSession,
      reviewSingleWord,
      exitReviewSession,
      onRateWord,
      onFinishSession,
    ]
  );

  return (
    <VocabularyReviewContext.Provider value={value}>
      {children}
    </VocabularyReviewContext.Provider>
  );
};

export { VocabularyReviewContext };
export { useVocabularyReview } from '../hooks/useVocabularyReview';
