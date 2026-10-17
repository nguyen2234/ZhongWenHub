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
import { AITutorWorkspacePage } from '../../features/ai-tutor';
import { GrammarPage } from '../../features/grammar';
import {
  SkillListeningPage,
  SkillSpeakingPage,
  SkillReadingPage,
  SkillWritingPage,
} from '../../features/skills';
import { MockExamsPage } from '../../features/mock-exams';
import { LearningGamesPage } from '../../features/games';
import { StudentClassesPage } from '../../features/classes/pages/StudentClassesPage';
import { LearningResultsPage } from '../../features/results/pages/LearningResultsPage';
import { AILivePage } from '../../features/ai-live/pages/AILivePage';
import { AIGradingPage } from '../../features/ai-grading/pages/AIGradingPage';
import { AIAnalyticsPage } from '../../features/ai-analytics/pages/AIAnalyticsPage';
import { ProgressPage } from '../../features/progress/pages/ProgressPage';
import { LeaderboardPage } from '../../features/leaderboard/pages/LeaderboardPage';
import { AchievementsPage } from '../../features/achievements/pages/AchievementsPage';
import { ProfilePage } from '../../features/profile/pages/ProfilePage';
import { SettingsPage } from '../../features/settings/pages/SettingsPage';
import { VideoLibraryPage, VideoDetailPage } from '../../features/videos';

export const studentRoutes: RouteObject[] = [
  // Focus Mode 1: Pure Learning Mode for Lesson (no dashboard header/footer distraction)
  {
    path: '/lesson',
    element: <LessonPage />,
  },
  {
    path: '/lesson/:lessonId',
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
  // Standard Student Shell Routes (Header + Collapsible Sidebar + Content + Footer)
  {
    path: '/',
    element: <StudentLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      // A. TỔNG QUAN
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'learning-path',
        element: <LearningPathPage />,
      },

      // B. HỌC TIẾNG TRUNG
      {
        path: 'vocabulary',
        element: <VocabularyPage />,
      },
      {
        path: 'grammar',
        element: <GrammarPage />,
      },
      {
        path: 'skills/listening',
        element: <SkillListeningPage />,
      },
      {
        path: 'skills/speaking',
        element: <SkillSpeakingPage />,
      },
      {
        path: 'skills/reading',
        element: <SkillReadingPage />,
      },
      {
        path: 'skills/writing',
        element: <SkillWritingPage />,
      },

      // C. LUYỆN TẬP & KIỂM TRA
      {
        path: 'practice',
        element: <PracticePage />,
      },
      {
        path: 'mock-exams',
        element: <MockExamsPage />,
      },
      {
        path: 'games',
        element: <LearningGamesPage />,
      },
      {
        path: 'videos',
        element: <VideoLibraryPage />,
      },
      {
        path: 'videos/:videoId',
        element: <VideoDetailPage />,
      },

      // D. LỚP HỌC
      {
        path: 'classes',
        element: <StudentClassesPage />,
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
        path: 'learning-results',
        element: <LearningResultsPage />,
      },

      // E. TRỢ LÝ AI
      {
        path: 'ai-tutor',
        element: <AITutorWorkspacePage />,
      },
      {
        path: 'ai-live',
        element: <AILivePage />,
      },
      {
        path: 'ai-grading',
        element: <AIGradingPage />,
      },
      {
        path: 'ai-analytics',
        element: <AIAnalyticsPage />,
      },
      {
        path: 'ai-learning',
        element: <StudentAIWorkspacePage />,
      },

      // F. THÀNH TÍCH
      {
        path: 'progress',
        element: <ProgressPage />,
      },
      {
        path: 'leaderboard',
        element: <LeaderboardPage />,
      },
      {
        path: 'achievements',
        element: <AchievementsPage />,
      },

      // G. CÁ NHÂN
      {
        path: 'profile',
        element: <ProfilePage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },

      // HỆ THỐNG
      {
        path: 'design-system',
        element: <DesignSystemShowcasePage />,
      },
    ],
  },
];
