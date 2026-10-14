/**
 * Teacher AI Workspace Contracts
 * Outlines productivity tools and workflows specifically tailored for Chinese language educators.
 */

export interface TeacherAIFeatureItem {
  id: string;
  title: string;
  description: string;
  category: 'PLANNER' | 'CONTENT' | 'EXERCISES' | 'GRADING' | 'ANALYTICS' | 'RECOMMENDATION' | 'ASSISTANT';
  status: 'ACTIVE_SHELL' | 'COMING_SOON';
  tier: 'FREE' | 'PRO';
  badge?: string;
  iconName: string;
}

export interface LessonPlanInput {
  classId: string;
  hskLevel: string;
  topic: string;
  learningObjectives: string;
  durationMinutes: number;
  teachingStyle: 'COMMUNICATIVE' | 'STRUCTURED_EXAM' | 'INTERACTIVE_GAMIFIED' | 'VOCABULARY_INTENSIVE';
  additionalInstructions?: string;
}

export interface GeneratedLessonPlanPreview {
  planId: string;
  title: string;
  hskLevel: string;
  durationMinutes: number;
  stages: Array<{
    stageNumber: number;
    title: string;
    durationMinutes: number;
    teacherActivitiesVi: string;
    studentActivitiesVi: string;
    targetHanziAndGrammar: string[];
  }>;
  suggestedHomework: string;
  generatedAt: string;
  isDraft: boolean;
}

export interface ExerciseGeneratorInput {
  classId: string;
  hskLevel: string;
  knowledgePoints: string;
  exerciseTypes: string[];
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  questionCount: number;
  instructionsVi?: string;
}

export interface GeneratedQuestionDraft {
  id: string;
  orderIndex: number;
  exerciseType: string;
  promptHanzi: string;
  promptPinyin?: string;
  promptVi?: string;
  suggestedOptions?: string[];
  suggestedAnswer: string;
  explanationVi: string;
  estimatedDifficulty: string;
}
