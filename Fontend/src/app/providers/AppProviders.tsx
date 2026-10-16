import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AITutorProvider } from '../../features/ai-tutor';
import { VocabularyReviewProvider } from '../../features/vocabulary';
import { LearningStateProvider } from '../../features/learning';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AITutorProvider>
        <LearningStateProvider>
          <VocabularyReviewProvider>
            {children}
          </VocabularyReviewProvider>
        </LearningStateProvider>
      </AITutorProvider>
    </BrowserRouter>
  );
};

export default AppProviders;
