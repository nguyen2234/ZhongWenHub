import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonExperience } from '../LessonExperience';

export interface LessonPageProps {
  onBackToLearningPath?: () => void;
  onNextLesson?: () => void;
}

export const LessonPage: React.FC<LessonPageProps> = ({
  onBackToLearningPath,
  onNextLesson,
}) => {
  const navigate = useNavigate();

  const handleBack = onBackToLearningPath ?? (() => navigate('/learning-path'));
  const handleNext = onNextLesson ?? (() => alert('Chuyển sang bài tiếp theo: Bài 9 (HSK 2)'));

  return (
    <LessonExperience
      onBackToLearningPath={handleBack}
      onNextLesson={handleNext}
    />
  );
};

export default LessonPage;
