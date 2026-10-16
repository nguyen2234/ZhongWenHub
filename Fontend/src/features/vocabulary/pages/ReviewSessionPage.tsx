import React from 'react';
import { ReviewSession } from '../components/ReviewSession';
import { useVocabularyReview } from '../context/VocabularyReviewContext';

export const ReviewSessionPage: React.FC = () => {
  const { reviewQueue, exitReviewSession, onRateWord, onFinishSession } = useVocabularyReview();

  return (
    <ReviewSession
      queue={reviewQueue}
      onExit={exitReviewSession}
      onRateCard={onRateWord}
      onFinishSession={onFinishSession}
    />
  );
};

export default ReviewSessionPage;
