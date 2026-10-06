import React from 'react';
import { useRoutes, Navigate } from 'react-router-dom';
import { authRoutes } from './auth.routes';
import { studentRoutes } from './student.routes';
import { managementRoutes } from './management.routes';

export const AppRouter: React.FC = () => {
  const routes = useRoutes([
    ...authRoutes,
    ...studentRoutes,
    ...managementRoutes,
    {
      path: '*',
      element: <Navigate to="/dashboard" replace />,
    },
  ]);

  return routes;
};

export default AppRouter;
