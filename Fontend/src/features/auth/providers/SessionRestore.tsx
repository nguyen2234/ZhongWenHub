import React, { useEffect } from 'react';
import { authService } from '../services/authService';

export const SessionRestore: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    authService.getCurrentUser().catch(() => {
      // Silently catch unauthenticated sessions on startup
    });
  }, []);

  // When restoring session initially, we still render children to maintain instantaneous UX,
  // while silent refresh updates in-memory token in background.
  return <>{children}</>;
};
