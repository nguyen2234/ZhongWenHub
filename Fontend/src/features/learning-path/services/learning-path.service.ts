import { httpClient } from '../../../core/api/client/http-client';

export interface LearningGoal {
  targetHskLevel: number;
  dailyStudyMinutes: number;
  studyDaysPerWeek: number;
  targetDate?: string | null;
  prioritySkills: string[];
  intensityMode: 'light' | 'balanced' | 'intensive' | string;
  updatedAt?: string | null;
}

export interface UpdateLearningGoalRequest {
  targetHskLevel: number;
  dailyStudyMinutes: number;
  studyDaysPerWeek: number;
  targetDate?: string | null;
  prioritySkills: string[];
  intensityMode: 'light' | 'balanced' | 'intensive' | string;
}

export interface LearningPathLessonItem {
  lessonId: string;
  lessonNumber: number;
  titleZh: string;
  titleVi: string;
  pinyin?: string | null;
  durationMinutes: number;
  isCompleted: boolean;
}

export interface LearningPathMilestone {
  id: string;
  stageOrder: number;
  title: string;
  description?: string | null;
  pedagogicalGoalVi?: string | null;
  targetSkills: string[];
  topics: string[];
  lessons: LearningPathLessonItem[];
  estimatedDays: number;
  isCompleted: boolean;
  completedAt?: string | null;
}

export interface PersonalizedLearningPath {
  id: string;
  userId: string;
  title: string;
  targetHskLevel: number;
  currentEstimatedHskLevel?: number | null;
  totalEstimatedWeeks: number;
  totalLessonsCount: number;
  completedLessonsCount: number;
  overallProgressPercent: number;
  status: 'ACTIVE' | 'COMPLETED' | 'ARCHIVED' | string;
  pedagogicalRationaleVi?: string | null;
  aiFocusTipsVi?: string | null;
  milestones: LearningPathMilestone[];
  generatedAt: string;
  lastReplannedAt?: string | null;
}

export interface DailyLearningTask {
  taskId: string;
  taskType: 'vocab' | 'srs' | 'grammar' | 'reading' | 'ai-exercise' | 'weakness' | 'lesson' | string;
  title: string;
  description?: string | null;
  estimatedMinutes: number;
  priority: number;
  targetSkill: string;
  targetHskLevel: number;
  resourceId?: string | null;
  destinationRoute: string;
  completionStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | string;
  completedAt?: string | null;
}

export interface DailyPlan {
  planDate: string;
  totalTasks: number;
  completedTasks: number;
  totalEstimatedMinutes: number;
  dayCompletionPercent: number;
  tasks: DailyLearningTask[];
  suggestedNextTask?: DailyLearningTask | null;
}

export interface CompleteTaskResponse {
  success: boolean;
  completedTaskId: string;
  remainingTasksCount: number;
  dayCompletionPercent: number;
  updatedOverallProgressPercent: number;
  suggestedNextTask?: DailyLearningTask | null;
  message: string;
}

export interface PersonalizedLearningProgress {
  selectedHskLevel: number;
  estimatedHskLevel?: number | null;
  pathProgressPercent: number;
  activeMilestoneOrder: number;
  totalMilestones: number;
  completedMilestones: number;
  todayCompletedTasks: number;
  todayTotalTasks: number;
  currentStreakDays: number;
  totalXp: number;
  prioritySkills: string[];
  nextRecommendedActionVi?: string | null;
}

export const learningPathService = {
  getGoals: () =>
    httpClient.get<LearningGoal>('/learning-path/goals'),

  updateGoals: (payload: UpdateLearningGoalRequest) =>
    httpClient.put<LearningGoal>('/learning-path/goals', payload),

  generatePath: (payload?: { targetHskLevel?: number; includeAiExplanation?: boolean }) =>
    httpClient.post<PersonalizedLearningPath>('/learning-path/generate', payload ?? {}),

  getCurrentPath: () =>
    httpClient.get<PersonalizedLearningPath | null>('/learning-path/current'),

  getTodayPlan: () =>
    httpClient.get<DailyPlan>('/learning-path/daily-plan'),

  completeTask: (taskId: string) =>
    httpClient.post<CompleteTaskResponse>(`/learning-path/daily-plan/tasks/${taskId}/complete`, {}),

  replanToday: (payload?: { reason?: string; availableMinutes?: number }) =>
    httpClient.post<DailyPlan>('/learning-path/daily-plan/replan', payload ?? {}),

  getProgress: () =>
    httpClient.get<PersonalizedLearningProgress>('/learning-path/progress'),
};

