import React from 'react';
import { VocabularyBank } from '../components/VocabularyBank';
import { useVocabularyReview } from '../context/VocabularyReviewContext';
import { StudentSecondaryNav } from '../../../layouts/components/StudentSecondaryNav';
import { STUDENT_MAIN_NAV_ITEMS } from '../../../config/student-navigation.config';

export const VocabularyPage: React.FC = () => {
  const { startReviewSession, reviewSingleWord } = useVocabularyReview();

  return (
    <div className="student-content-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Secondary Sub-navigation for Từ vựng */}
      <StudentSecondaryNav
        title="Từ vựng"
        items={STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'vocabulary')?.secondaryFeatures || []}
      />

      <VocabularyBank
        onStartReviewSession={startReviewSession}
        onReviewSingleWord={reviewSingleWord}
      />
    </div>
  );
};

export default VocabularyPage;
