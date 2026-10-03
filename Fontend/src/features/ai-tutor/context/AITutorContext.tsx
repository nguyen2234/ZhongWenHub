import React, { createContext, useContext, useState } from 'react';
import type { AITutorContext } from '../types';
import { AITutorDrawer } from '../components/AITutorDrawer';
import { AITutorFloatingButton } from '../components/AITutorFloatingButton';

interface AITutorContextValue {
  isDrawerOpen: boolean;
  activeContext: AITutorContext | null;
  openAITutor: (context?: AITutorContext, initialPrompt?: string) => void;
  closeAITutor: () => void;
  setContext: (context: AITutorContext | null) => void;
  clearContext: () => void;
}

const AITutorContextState = createContext<AITutorContextValue | null>(null);

export const AITutorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeContext, setActiveContext] = useState<AITutorContext | null>(null);
  const [initialPrompt, setInitialPrompt] = useState<string | undefined>(undefined);

  const openAITutor = (context?: AITutorContext, prompt?: string) => {
    if (context) {
      setActiveContext(context);
    }
    setInitialPrompt(prompt);
    setIsOpen(true);
  };

  const closeAITutor = () => {
    setIsOpen(false);
  };

  const clearContext = () => {
    setActiveContext(null);
  };

  return (
    <AITutorContextState.Provider
      value={{
        isDrawerOpen: isOpen,
        activeContext,
        openAITutor,
        closeAITutor,
        setContext: setActiveContext,
        clearContext,
      }}
    >
      {children}

      {/* Global Floating Action Button */}
      <AITutorFloatingButton
        onClick={() => openAITutor()}
        hasContext={Boolean(activeContext && activeContext.source !== 'general')}
      />

      {/* Slide-out Drawer */}
      <AITutorDrawer
        isOpen={isOpen}
        context={activeContext}
        onClose={closeAITutor}
        onClearContext={clearContext}
        initialQuestion={initialPrompt}
      />
    </AITutorContextState.Provider>
  );
};

export const useAITutor = () => {
  const ctx = useContext(AITutorContextState);
  if (!ctx) {
    throw new Error('useAITutor must be used within an AITutorProvider');
  }
  return ctx;
};
