import React from 'react';
import { AuthProvider } from '../context/AuthContext';

export const SessionRestore: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AuthProvider>{children}</AuthProvider>;
};
