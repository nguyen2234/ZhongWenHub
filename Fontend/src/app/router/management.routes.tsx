import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { ManagementLayout } from '../../layouts/ManagementLayout';
import { AdminDashboardPage } from '../../management/admin/pages/AdminDashboardPage';
import {
  TeacherDashboardPage,
  TeacherClassesPage,
  TeacherClassDetailPage,
  TeacherAssignmentsPage,
} from '../../management/teacher';
import { TeacherAIWorkspacePage } from '../../features/ai';
import { SupportDashboardPage } from '../../management/support/pages/SupportDashboardPage';

import { AdminUsersPage } from '../../management/admin/users/pages/AdminUsersPage';
import { AdminTeachersPage } from '../../management/admin/teachers/pages/AdminTeachersPage';
import { AdminSupportStaffPage } from '../../management/admin/support-staff/pages/AdminSupportStaffPage';
import { AdminRolesPage } from '../../management/admin/roles/pages/AdminRolesPage';
import { AdminHskRepositoryPage } from '../../management/admin/content/pages/AdminHskRepositoryPage';
import { AdminCurriculumPage } from '../../management/admin/content/pages/AdminCurriculumPage';
import { AdminLessonEditorPage } from '../../management/admin/content/pages/AdminLessonEditorPage';

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
            path: 'support-staff',
            element: <AdminSupportStaffPage />,
          },
          {
            path: 'roles',
            element: <AdminRolesPage />,
          },
          {
            path: 'hsk-repository',
            element: <AdminHskRepositoryPage />,
          },
          {
            path: 'curriculum',
            element: <AdminCurriculumPage />,
          },
          {
            path: 'curriculum/lessons/:lessonId/edit',
            element: <AdminLessonEditorPage />,
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
            path: 'classes',
            element: <TeacherClassesPage />,
          },
          {
            path: 'classes/:classId',
            element: <TeacherClassDetailPage />,
          },
          {
            path: 'assignments',
            element: <TeacherAssignmentsPage />,
          },
          {
            path: 'ai-workspace',
            element: <TeacherAIWorkspacePage />,
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
