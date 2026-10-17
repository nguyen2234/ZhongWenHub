import React from 'react';
import { PracticeCenter } from '../PracticeCenter';
import { StudentSecondaryNav } from '../../../layouts/components/StudentSecondaryNav';
import { STUDENT_MAIN_NAV_ITEMS } from '../../../config/student-navigation.config';

export const PracticePage: React.FC = () => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)', width: '100%' }}>
      {/* Secondary Sub-navigation for Luyện tập */}
      <div style={{ maxWidth: '1080px', margin: '0 auto', width: '100%', boxSizing: 'border-box', padding: 'var(--space-4) var(--space-4) 0' }}>
        <StudentSecondaryNav
          title="Luyện tập"
          items={STUDENT_MAIN_NAV_ITEMS.find((i) => i.id === 'practice')?.secondaryFeatures || []}
        />
      </div>

      <PracticeCenter />
    </div>
  );
};

export default PracticePage;
