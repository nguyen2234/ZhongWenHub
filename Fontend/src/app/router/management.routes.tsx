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
import { ContentManagerDashboardPage } from '../../management/content-manager/pages/ContentManagerDashboardPage';
import { ContentModerationPage } from '../../management/content-manager/pages/ContentModerationPage';
import { ContentIssuesPage } from '../../management/content-manager/pages/ContentIssuesPage';
import { ContentAuditHistoryPage } from '../../management/content-manager/pages/ContentAuditHistoryPage';
import { ContentQualityMetricsPage } from '../../management/content-manager/pages/ContentQualityMetricsPage';
import {
  ManagementRouteGuard,
  AdminLegacyContentRedirect,
  AdminLegacyLessonEditorRedirect,
} from '../../management/shared/components';

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
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminDashboardPage />
              </ManagementRouteGuard>
            ),
          },
          // 1. Quản lý người dùng & tổ chức
          {
            path: 'users',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminUsersPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'teachers',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminTeachersPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'support-staff',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminSupportStaffPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'roles',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminRolesPage />
              </ManagementRouteGuard>
            ),
          },

          // 2. Trí tuệ nhân tạo (AI)
          {
            path: 'ai-management',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminModulePlannedPage moduleKey="ai-management" />
              </ManagementRouteGuard>
            ),
          },

          // 3. Vận hành & Hệ thống
          {
            path: 'analytics',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminModulePlannedPage moduleKey="analytics" />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'support-requests',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminModulePlannedPage moduleKey="support-requests" />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'settings',
            element: (
              <ManagementRouteGuard requiredRole="ADMIN">
                <AdminModulePlannedPage moduleKey="settings" />
              </ManagementRouteGuard>
            ),
          },

          // 4. Safe Redirects for Legacy Content Routes (FE-12 Strict Separation)
          // Validates session permission and redirects safely to /management/content-manager/...
          // Blocks unauthorized escalation attempts (e.g. Student/Support)
          {
            path: 'hsk-repository',
            element: <AdminLegacyContentRedirect targetPath="/management/content-manager/hsk-repository" />,
          },
          {
            path: 'curriculum',
            element: <AdminLegacyContentRedirect targetPath="/management/content-manager/curriculum" />,
          },
          {
            path: 'curriculum/lessons/:lessonId/edit',
            element: <AdminLegacyLessonEditorRedirect />,
          },
          {
            path: 'grammar',
            element: <AdminLegacyContentRedirect targetPath="/management/content-manager/grammar" />,
          },
          {
            path: 'exercises',
            element: <AdminLegacyContentRedirect targetPath="/management/content-manager/question-bank" />,
          },
          {
            path: 'videos',
            element: <AdminLegacyContentRedirect targetPath="/management/content-manager/videos" />,
          },
          {
            path: 'moderation',
            element: <AdminLegacyContentRedirect targetPath="/management/content-manager/moderation" />,
          },

          // Fallback
          {
            path: '*',
            element: <Navigate to="/management/admin/dashboard" replace />,
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
            element: (
              <ManagementRouteGuard requiredRole={['TEACHER', 'ADMIN']}>
                <TeacherDashboardPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'classes',
            element: (
              <ManagementRouteGuard requiredRole={['TEACHER', 'ADMIN']}>
                <TeacherClassesPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'classes/:classId',
            element: (
              <ManagementRouteGuard requiredRole={['TEACHER', 'ADMIN']}>
                <TeacherClassDetailPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'assignments',
            element: (
              <ManagementRouteGuard requiredRole={['TEACHER', 'ADMIN']}>
                <TeacherAssignmentsPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'ai-workspace',
            element: (
              <ManagementRouteGuard requiredRole={['TEACHER', 'ADMIN']}>
                <TeacherAIWorkspacePage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: '*',
            element: <Navigate to="/management/teacher/dashboard" replace />,
          },
        ],
      },
      {
        path: 'content-manager',
        children: [
          {
            index: true,
            element: <Navigate to="/management/content-manager/dashboard" replace />,
          },
          {
            path: 'dashboard',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <ContentManagerDashboardPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'hsk-repository',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <AdminHskRepositoryPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'curriculum',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <AdminCurriculumPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'curriculum/lessons/:lessonId/edit',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <AdminLessonEditorPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'lesson-editor',
            element: <Navigate to="/management/content-manager/curriculum/lessons/les-8/edit" replace />,
          },
          {
            path: 'grammar',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <AdminGrammarManagementPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'question-bank',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <AdminExerciseBankPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'exercises',
            element: <Navigate to="/management/content-manager/question-bank" replace />,
          },
          {
            path: 'videos',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <AdminModulePlannedPage moduleKey="videos" />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'moderation',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <ContentModerationPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'issues',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <ContentIssuesPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'audit-history',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <ContentAuditHistoryPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: 'quality-metrics',
            element: (
              <ManagementRouteGuard requiredRole={['CONTENT_MANAGER', 'ADMIN']}>
                <ContentQualityMetricsPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: '*',
            element: <Navigate to="/management/content-manager/dashboard" replace />,
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
            element: (
              <ManagementRouteGuard requiredRole={['SUPPORT', 'ADMIN']}>
                <SupportDashboardPage />
              </ManagementRouteGuard>
            ),
          },
          {
            path: '*',
            element: <Navigate to="/management/support/dashboard" replace />,
          },
        ],
      },
    ],
  },
];
