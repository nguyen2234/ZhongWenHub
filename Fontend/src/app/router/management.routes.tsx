import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { ManagementLayout } from '../../layouts/ManagementLayout';
import { AdminDashboardPage } from '../../management/admin/pages/AdminDashboardPage';
import { AdminModulePlannedPage } from '../../management/admin/pages/AdminModulePlannedPage';
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
import { AdminGrammarManagementPage } from '../../management/admin/content/pages/AdminGrammarManagementPage';
import { AdminExerciseBankPage } from '../../management/admin/content/pages/AdminExerciseBankPage';

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
          // 1. Quản lý người dùng & tổ chức
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

          // 2. Học liệu & Nội dung
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
            path: 'grammar',
            element: <AdminGrammarManagementPage />,
          },
          {
            path: 'exercises',
            element: <AdminExerciseBankPage />,
          },
          {
            path: 'videos',
            element: <AdminModulePlannedPage moduleKey="videos" />,
          },

          // 3. Kiểm duyệt & AI
          {
            path: 'moderation',
            element: <AdminModulePlannedPage moduleKey="moderation" />,
          },
          {
            path: 'ai-management',
            element: <AdminModulePlannedPage moduleKey="ai-management" />,
          },

          // 4. Vận hành & Hệ thống
          {
            path: 'analytics',
            element: <AdminModulePlannedPage moduleKey="analytics" />,
          },
          {
            path: 'support-requests',
            element: <AdminModulePlannedPage moduleKey="support-requests" />,
          },
          {
            path: 'settings',
            element: <AdminModulePlannedPage moduleKey="settings" />,
          },

          // Fallback
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
