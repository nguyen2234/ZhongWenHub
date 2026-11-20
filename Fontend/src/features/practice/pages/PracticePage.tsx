import React from 'react';
import { PracticeCenter } from '../PracticeCenter';

export const PracticePage: React.FC = () => {
  return (
    <div className="student-content-container" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <PracticeCenter />
    </div>
  );
};

export default PracticePage;
