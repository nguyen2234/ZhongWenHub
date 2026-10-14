/**
 * AI Usage & Entitlement Contracts
 * Defines granular quotas, feature gates, and usage logging for Student and Teacher tiers.
 */

export type AIUsageFeature =
  // Student Pro features
  | 'STUDENT_TUTOR_UNLIMITED'
  | 'STUDENT_AI_GRADING'
  | 'STUDENT_ADAPTIVE_PRACTICE'
  | 'STUDENT_WEAKNESS_DIAGNOSIS'
  | 'STUDENT_PERSONALIZED_REC'
  // Teacher Pro features
  | 'TEACHER_LESSON_PLANNER'
  | 'TEACHER_EXERCISE_GENERATOR'
  | 'TEACHER_PRE_GRADING'
  | 'TEACHER_CLASS_ANALYTICS'
  | 'TEACHER_TEACHING_REC';

export type AIEntitlementTier = 'FREE' | 'STUDENT_PRO' | 'TEACHER_PRO' | 'INSTITUTIONAL';

export interface StudentAIEntitlement {
  studentId: string;
  tier: AIEntitlementTier;
  featuresAllowed: AIUsageFeature[];
  monthlyTokenQuota: number;
  tokensConsumedThisMonth: number;
  dailyTutorMessageLimit: number;
  tutorMessagesSentToday: number;
  expiresAt?: string;
  isActive: boolean;
}

export interface TeacherAIEntitlement {
  teacherId: string;
  tier: AIEntitlementTier;
  featuresAllowed: AIUsageFeature[];
  monthlyLessonPlansLimit: number;
  lessonPlansCreatedThisMonth: number;
  monthlyExerciseGenLimit: number;
  exerciseBatchesGeneratedThisMonth: number;
  aiPreGradingEnabled: boolean;
  expiresAt?: string;
  isActive: boolean;
}

export interface AIUsageRecord {
  recordId: string;
  userId: string;
  role: 'STUDENT' | 'TEACHER';
  feature: AIUsageFeature;
  requestId: string;
  tokensUsed: number;
  status: 'ALLOWED' | 'QUOTA_EXCEEDED' | 'FEATURE_LOCKED';
  timestamp: string;
}

export interface AIUsageQuota {
  feature: AIUsageFeature;
  limit: number;
  current: number;
  remaining: number;
  resetsAt: string;
}

export interface AIUsagePolicy {
  tier: AIEntitlementTier;
  maxTokensPerRequest: number;
  rateLimitPerMinute: number;
  features: Record<AIUsageFeature, boolean>;
}
