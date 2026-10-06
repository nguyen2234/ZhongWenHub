import React from 'react';
import { AppProviders } from './providers/AppProviders';
import { AppRouter } from './router/AppRouter';

export default function App(): React.JSX.Element {
  return (
    <AppProviders>
      <AppRouter />
    </AppProviders>
  );
}
