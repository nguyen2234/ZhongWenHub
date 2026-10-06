import React from 'react';
import { ReviewSession } from '../components/ReviewSession';
import { useVocabularyReview } from '../context/VocabularyReviewContext';

export const ReviewSessionPage: React.FC = () => {
  const { reviewQueue, exitReviewSession } = useVocabularyReview();

  return (
    <ReviewSession
      queue={reviewQueue}
      onExit={exitReviewSession}
    />
  );
};

export default ReviewSessionPage;
