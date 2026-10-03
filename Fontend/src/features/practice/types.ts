import type { SkillCategory } from '../exercise-engine';

export type PracticeMode = 'recommended' | 'quick' | 'mistakes' | 'skill' | 'hsk-filter';

export interface PracticeRecommendation {
  id: string;
  type: string;
  skill: SkillCategory;
  hskLevel: number;
  title: string;
  subtitle: string;
  reason: string;
  exerciseIds: (string | number)[];
  estimatedMinutes: number;
  xpReward: number;
}

export interface MistakeRecord {
  exerciseId: string | number;
  mistakeCount: number;
  lastMistakeAt: string;
  lastCorrectAt?: string;
  masteryState: 'critical' | 'learning' | 'recovering' | 'resolved';
  skill: SkillCategory;
  title: string;
}

export interface PracticeSessionResult {
  sessionId: string;
  mode: PracticeMode;
  skillTitle: string;
  hskLevel: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  timeSpentSeconds: number;
  xpEarned: number;
  weakPoints: { title: string; count: number }[];
  mistakeIds: (string | number)[];
}

export interface SkillItemConfig {
  id: SkillCategory;
  chinese: string;
  vietnamese: string;
  icon: string;
  masteryPercentage: number;
  totalExercises: number;
  description: string;
}
