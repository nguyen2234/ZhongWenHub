import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AITutorProvider } from '../../features/ai-tutor';
import { VocabularyReviewProvider } from '../../features/vocabulary';
import { LearningStateProvider } from '../../features/learning';
import { SessionRestore } from '../../features/auth/providers/SessionRestore';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <SessionRestore>
        <AITutorProvider>
          <LearningStateProvider>
            <VocabularyReviewProvider>
              {children}
            </VocabularyReviewProvider>
          </LearningStateProvider>
        </AITutorProvider>
      </SessionRestore>
    </BrowserRouter>
  );
};

export default AppProviders;
