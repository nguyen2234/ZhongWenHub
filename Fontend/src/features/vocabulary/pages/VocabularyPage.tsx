import React from 'react';
import { VocabularyBank } from '../components/VocabularyBank';
import { useVocabularyReview } from '../context/VocabularyReviewContext';

export const VocabularyPage: React.FC = () => {
  const { startReviewSession, reviewSingleWord } = useVocabularyReview();

  return (
    <VocabularyBank
      onStartReviewSession={startReviewSession}
      onReviewSingleWord={reviewSingleWord}
    />
  );
};

export default VocabularyPage;
