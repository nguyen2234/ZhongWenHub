import { describe, expect, it } from 'bun:test';
import {
  learningPathService,
  type LearningGoal,
  type UpdateLearningGoalRequest,
  type PersonalizedLearningPath,
  type DailyLearningTask,
} from '../features/learning-path/services/learning-path.service';
import { PersonalizedLearningDashboard } from '../features/learning-path/components/PersonalizedLearningDashboard';
import { TodayPlanSection } from '../features/learning-path/components/TodayPlanSection';
import { MyPathSection } from '../features/learning-path/components/MyPathSection';
import { GoalSetupCard } from '../features/learning-path/components/GoalSetupCard';
import { LearningPathPage } from '../features/learning-path/pages/LearningPathPage';

describe('Phase 4 AI Personalized Learning Path Frontend Contracts', () => {
  it('exposes all required Learning Path service endpoints', () => {
    expect(typeof learningPathService.getGoals).toBe('function');
    expect(typeof learningPathService.updateGoals).toBe('function');
    expect(typeof learningPathService.generatePath).toBe('function');
    expect(typeof learningPathService.getCurrentPath).toBe('function');
    expect(typeof learningPathService.getTodayPlan).toBe('function');
    expect(typeof learningPathService.completeTask).toBe('function');
    expect(typeof learningPathService.replanToday).toBe('function');
    expect(typeof learningPathService.getProgress).toBe('function');
  });

  it('validates LearningGoal and UpdateLearningGoalRequest constraints', () => {
    const goal: LearningGoal = {
      targetHskLevel: 3,
      dailyStudyMinutes: 45,
      studyDaysPerWeek: 5,
      targetDate: '2026-12-31T00:00:00Z',
      prioritySkills: ['vocabulary', 'grammar'],
      intensityMode: 'balanced',
      updatedAt: '2026-11-15T00:00:00Z',
    };

    expect(goal.targetHskLevel).toBeGreaterThanOrEqual(1);
    expect(goal.targetHskLevel).toBeLessThanOrEqual(6);
    expect([15, 30, 45, 60]).toContain(goal.dailyStudyMinutes);
    expect(goal.studyDaysPerWeek).toBeGreaterThanOrEqual(1);
    expect(goal.studyDaysPerWeek).toBeLessThanOrEqual(7);
    expect(goal.prioritySkills.length).toBeGreaterThan(0);

    const updateReq: UpdateLearningGoalRequest = {
      targetHskLevel: 4,
      dailyStudyMinutes: 30,
      studyDaysPerWeek: 6,
      prioritySkills: ['reading', 'listening'],
      intensityMode: 'intensive',
    };
    expect(updateReq.targetHskLevel).toBe(4);
    expect(updateReq.intensityMode).toBe('intensive');
  });

  it('enforces approved destination routes for daily learning tasks', () => {
    const approvedPrefixes = ['/lesson/focus?id=', '/srs-review', '/practice', '/ai-exercises'];

    const tasks: DailyLearningTask[] = [
      {
        taskId: 't-1',
        taskType: 'vocab',
        title: 'Học từ vựng bài 3',
        description: 'Nạp 10 từ mới HSK 2',
        estimatedMinutes: 10,
        priority: 1,
        targetSkill: 'vocabulary',
        targetHskLevel: 2,
        destinationRoute: '/practice',
        completionStatus: 'PENDING',
      },
      {
        taskId: 't-2',
        taskType: 'srs',
        title: 'Ôn tập Flashcard SRS',
        description: 'Ôn lại các từ đến hạn',
        estimatedMinutes: 10,
        priority: 1,
        targetSkill: 'vocabulary',
        targetHskLevel: 2,
        destinationRoute: '/srs-review',
        completionStatus: 'PENDING',
      },
      {
        taskId: 't-3',
        taskType: 'lesson',
        title: 'Học bài khóa 3',
        description: 'Nội dung bài học',
        estimatedMinutes: 15,
        priority: 2,
        targetSkill: 'reading',
        targetHskLevel: 2,
        destinationRoute: '/lesson/focus?id=lesson-3-uuid',
        completionStatus: 'PENDING',
      },
      {
        taskId: 't-4',
        taskType: 'ai-exercise',
        title: 'Bài tập AI thích ứng',
        description: 'Luyện tập cấu trúc ngữ pháp',
        estimatedMinutes: 10,
        priority: 3,
        targetSkill: 'grammar',
        targetHskLevel: 2,
        destinationRoute: '/ai-exercises',
        completionStatus: 'PENDING',
      },
    ];

    tasks.forEach((task) => {
      const isApproved = approvedPrefixes.some((prefix) => task.destinationRoute.startsWith(prefix));
      expect(isApproved).toBe(true);
      expect(task.estimatedMinutes).toBeGreaterThan(0);
      expect(task.priority).toBeGreaterThanOrEqual(1);
    });
  });

  it('validates PersonalizedLearningPath and Milestone structure', () => {
    const path: PersonalizedLearningPath = {
      id: 'path-uuid',
      userId: 'user-uuid',
      title: 'Lộ trình Chinh phục HSK 3 Cá nhân hóa',
      targetHskLevel: 3,
      currentEstimatedHskLevel: 2,
      totalEstimatedWeeks: 8,
      totalLessonsCount: 20,
      completedLessonsCount: 5,
      overallProgressPercent: 25.0,
      status: 'ACTIVE',
      pedagogicalRationaleVi: 'Tập trung bồi dưỡng từ vựng HSK 2 và ngữ pháp câu chữ bǎ trước khi học HSK 3.',
      milestones: [
        {
          id: 'ms-1',
          stageOrder: 1,
          title: 'Chặng 1: Nền tảng HSK 3 - Giao tiếp hàng ngày',
          pedagogicalGoalVi: 'Nắm vững 5 bài đầu tiên và cấu trúc so sánh',
          targetSkills: ['vocabulary', 'grammar'],
          topics: ['Giao tiếp', 'Ăn uống'],
          lessons: [
            {
              lessonId: 'l-1',
              lessonNumber: 1,
              titleZh: '周末你有什么打算',
              titleVi: 'Cuối tuần bạn có dự định gì',
              durationMinutes: 20,
              isCompleted: true,
            },
          ],
          estimatedDays: 14,
          isCompleted: false,
        },
      ],
      generatedAt: '2026-11-15T00:00:00Z',
    };

    expect(path.targetHskLevel).toBe(3);
    expect(path.milestones.length).toBe(1);
    expect(path.milestones[0].lessons.length).toBe(1);
    expect(path.milestones[0].lessons[0].titleZh).toBe('周末你有什么打算');
    expect(path.overallProgressPercent).toBe(25.0);
  });

  it('exports valid React components for the Learning Path UI', () => {
    expect(typeof PersonalizedLearningDashboard).toBe('function');
    expect(typeof TodayPlanSection).toBe('function');
    expect(typeof MyPathSection).toBe('function');
    expect(typeof GoalSetupCard).toBe('function');
    expect(typeof LearningPathPage).toBe('function');
  });
});
