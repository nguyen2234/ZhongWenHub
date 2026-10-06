import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AITutorProvider } from '../../features/ai-tutor';
import { VocabularyReviewProvider } from '../../features/vocabulary';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export const AppProviders: React.FC<AppProvidersProps> = ({ children }) => {
  return (
    <BrowserRouter>
      <AITutorProvider>
        <VocabularyReviewProvider>
          {children}
        </VocabularyReviewProvider>
      </AITutorProvider>
    </BrowserRouter>
  );
};

export default AppProviders;
