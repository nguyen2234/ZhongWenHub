import { useContext } from 'react';
import { VocabularyReviewContext, type VocabularyReviewContextType } from '../context/VocabularyReviewContext';

export const useVocabularyReview = (): VocabularyReviewContextType => {
  const context = useContext(VocabularyReviewContext);
  if (!context) {
    throw new Error('useVocabularyReview must be used within a VocabularyReviewProvider');
  }
  return context;
};
