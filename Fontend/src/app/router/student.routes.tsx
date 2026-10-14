import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import { StudentLayout } from '../../layouts/StudentLayout';
import { DashboardPage } from '../../features/dashboard';
import { LearningPathPage } from '../../features/learning-path';
import { PracticePage } from '../../features/practice';
import { VocabularyPage, ReviewSessionPage } from '../../features/vocabulary';
import { LessonPage } from '../../features/lesson';
import { DesignSystemShowcasePage } from '../../design-system';
import {
  StudentHomeworkListPage,
  StudentHomeworkDetailPage,
  StudentAssignmentRunnerPage,
  StudentHomeworkResultPage,
} from '../../features/homework';
import { StudentAIWorkspacePage } from '../../features/ai';

export const studentRoutes: RouteObject[] = [
  // Focus Mode 1: Pure Learning Mode for Lesson (no dashboard header/footer distraction)
  {
    path: '/lesson',
    element: <LessonPage />,
  },
  // Focus Mode 2: SRS Flashcard Review Session (zero distraction, no navbar, no footer)
  {
    path: '/srs-review',
    element: <ReviewSessionPage />,
  },
  // Focus Mode 3: Student Homework / Assignment Runner (zero distraction, no navbar, no footer)
  {
    path: '/homework/:assignmentId/run',
    element: <StudentAssignmentRunnerPage />,
  },
  // Standard Student Shell Routes (Header + Content + Footer)
  {
    path: '/',
    element: <StudentLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'homework',
        element: <StudentHomeworkListPage />,
      },
      {
        path: 'homework/:assignmentId',
        element: <StudentHomeworkDetailPage />,
      },
      {
        path: 'homework/:assignmentId/result/:attemptId',
        element: <StudentHomeworkResultPage />,
      },
      {
        path: 'ai-learning',
        element: <StudentAIWorkspacePage />,
      },
      {
        path: 'practice',
        element: <PracticePage />,
      },
      {
        path: 'vocabulary',
        element: <VocabularyPage />,
      },
      {
        path: 'learning-path',
        element: <LearningPathPage />,
      },
      {
        path: 'design-system',
        element: <DesignSystemShowcasePage />,
      },
    ],
  },
];
