// Core AI infrastructure
export * from './core/types/ai-task.types';
export * from './core/types/ai-provider.types';
export * from './core/types/ai-metadata.types';
export * from './core/utils/ai-validation.utils';
export * from './core/adapters/mock-ai-provider.adapter';
export * from './core/services/ai-core.service';

// Dataset contracts
export * from './datasets/types/ai-dataset.types';

// Usage & Entitlements
export * from './usage/types/ai-usage.types';
export * from './usage/services/ai-usage.service';

// Student AI
export * from './student/types/student-ai.types';
export * from './student/services/student-ai.service';
export * from './student/components/StudentAIFeatureCard';
export * from './student/pages/StudentAIWorkspacePage';

// Teacher AI
export * from './teacher/types/teacher-ai.types';
export * from './teacher/types/teacher-grading-ai.types';
export * from './teacher/types/teacher-lesson-ai.types';
export * from './teacher/services/teacher-ai.service';
export * from './teacher/components/TeacherAIFeatureCard';
export * from './teacher/components/LessonPlannerShell';
export * from './teacher/components/ExerciseGeneratorShell';
export * from './teacher/components/PreGradingShell';
export * from './teacher/pages/TeacherAIWorkspacePage';
