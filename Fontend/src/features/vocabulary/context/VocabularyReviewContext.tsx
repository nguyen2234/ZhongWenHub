import React, { createContext, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getDueReviewQueue,
  INITIAL_USER_VOCAB_STATES,
  INITIAL_SRS_STATES,
  predictIntervalLabels,
  type ReviewQueueItem,
  type VocabularyItem,
} from '..';

export interface VocabularyReviewContextType {
  reviewQueue: ReviewQueueItem[];
  startReviewSession: () => void;
  reviewSingleWord: (word: VocabularyItem) => void;
  exitReviewSession: () => void;
  setReviewQueue: React.Dispatch<React.SetStateAction<ReviewQueueItem[]>>;
}

const VocabularyReviewContext = createContext<VocabularyReviewContextType | null>(null);

export const VocabularyReviewProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const [reviewQueue, setReviewQueue] = useState<ReviewQueueItem[]>(() => getDueReviewQueue());

  const startReviewSession = React.useCallback(() => {
    setReviewQueue(getDueReviewQueue());
    navigate('/srs-review');
  }, [navigate]);

  const reviewSingleWord = React.useCallback((word: VocabularyItem) => {
    const userState = INITIAL_USER_VOCAB_STATES[word.id] || {
      vocabularyId: word.id,
      status: 'learning',
      firstLearnedAt: '2026-10-01',
      lastReviewedAt: '2026-10-02',
      nextReviewAt: '2026-10-03',
      reviewCount: 1,
      correctCount: 1,
      isDueToday: true,
    };
    const srsState = INITIAL_SRS_STATES[word.id] || {
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
  }, [navigate]);

  const exitReviewSession = React.useCallback(() => {
    navigate('/vocabulary');
  }, [navigate]);

  const value = useMemo(
    () => ({
      reviewQueue,
      startReviewSession,
      reviewSingleWord,
      exitReviewSession,
      setReviewQueue,
    }),
    [reviewQueue, startReviewSession, reviewSingleWord, exitReviewSession]
  );

  return (
    <VocabularyReviewContext.Provider value={value}>
      {children}
    </VocabularyReviewContext.Provider>
  );
};

export { VocabularyReviewContext };
export { useVocabularyReview } from '../hooks/useVocabularyReview';

