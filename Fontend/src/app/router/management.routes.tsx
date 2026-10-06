import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { ManagementLayout } from '../../layouts/ManagementLayout';
import { AdminDashboardPage } from '../../management/admin/pages/AdminDashboardPage';
import { TeacherDashboardPage } from '../../management/teacher/pages/TeacherDashboardPage';
import { SupportDashboardPage } from '../../management/support/pages/SupportDashboardPage';

import { AdminUsersPage } from '../../management/admin/users/pages/AdminUsersPage';
import { AdminTeachersPage } from '../../management/admin/teachers/pages/AdminTeachersPage';

export const managementRoutes: RouteObject[] = [
  {
    path: '/management',
    element: <ManagementLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/management/admin/dashboard" replace />,
      },
      {
        path: 'admin',
        children: [
          {
            index: true,
            element: <Navigate to="/management/admin/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <AdminDashboardPage />,
          },
          {
            path: 'users',
            element: <AdminUsersPage />,
          },
          {
            path: 'teachers',
            element: <AdminTeachersPage />,
          },
          {
            path: '*',
            element: <AdminDashboardPage />,
          },
        ],
      },
      {
        path: 'teacher',
        children: [
          {
            index: true,
            element: <Navigate to="/management/teacher/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <TeacherDashboardPage />,
          },
          {
            path: '*',
            element: <TeacherDashboardPage />,
          },
        ],
      },
      {
        path: 'support',
        children: [
          {
            index: true,
            element: <Navigate to="/management/support/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: <SupportDashboardPage />,
          },
          {
            path: '*',
            element: <SupportDashboardPage />,
          },
        ],
      },
    ],
  },
];
