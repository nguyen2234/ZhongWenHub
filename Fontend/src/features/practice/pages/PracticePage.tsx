import React from 'react';
import { PracticeCenter } from '../PracticeCenter';
import { StudentSecondaryNav } from '../../../layouts/components/StudentSecondaryNav';
import { STUDENT_MAIN_NAV_ITEMS } from '../../../config/student-navigation.config';

export const PracticePage: React.FC = () => {
  return (
    <div className="student-content-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Secondary Sub-navigation for Luyện tập */}
      <StudentSecondaryNav
        title="Luyện tập"
        items={STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'practice')?.secondaryFeatures || []}
      />

      <PracticeCenter />
    </div>
  );
};

export default PracticePage;
