/**
 * AI Usage & Entitlement Service
 * Client validation and mock tracking for AI quota consumption and tier gates.
 * Note: Authoritative billing and quota enforcement belongs in ASP.NET Core backend.
 */

import type {
  AIUsageFeature,
  StudentAIEntitlement,
  TeacherAIEntitlement,
  AIUsageRecord,
  AIUsageQuota,
} from '../types/ai-usage.types';

class AIUsageService {
  private usageHistory: AIUsageRecord[] = [];

  /**
   * Retrieves conceptual mock entitlement for student.
   */
  getStudentEntitlement(studentId: string): StudentAIEntitlement {
    return {
      studentId,
      tier: 'FREE',
      featuresAllowed: ['STUDENT_WEAKNESS_DIAGNOSIS', 'STUDENT_PERSONALIZED_REC'],
      monthlyTokenQuota: 50000,
      tokensConsumedThisMonth: 8200,
      dailyTutorMessageLimit: 20,
      tutorMessagesSentToday: 6,
      isActive: true,
    };
  }

  /**
   * Retrieves conceptual mock entitlement for teacher.
   */
  getTeacherEntitlement(teacherId: string): TeacherAIEntitlement {
    return {
      teacherId,
      tier: 'TEACHER_PRO',
      featuresAllowed: [
        'TEACHER_LESSON_PLANNER',
        'TEACHER_EXERCISE_GENERATOR',
        'TEACHER_PRE_GRADING',
        'TEACHER_CLASS_ANALYTICS',
        'TEACHER_TEACHING_REC',
      ],
      monthlyLessonPlansLimit: 50,
      lessonPlansCreatedThisMonth: 4,
      monthlyExerciseGenLimit: 100,
      exerciseBatchesGeneratedThisMonth: 8,
      aiPreGradingEnabled: true,
      isActive: true,
    };
  }

  /**
   * Checks whether a feature is permitted under the active user's entitlement tier.
   */
  checkFeatureAccess(
    role: 'STUDENT' | 'TEACHER',
    userId: string,
    feature: AIUsageFeature
  ): { allowed: boolean; reason?: string } {
    if (role === 'STUDENT') {
      const ent = this.getStudentEntitlement(userId);
      const isAllowed = ent.featuresAllowed.includes(feature);
      if (!isAllowed) {
        return {
          allowed: false,
          reason: 'Tính năng yêu cầu gói Student Pro để sử dụng không giới hạn.',
        };
      }
      return { allowed: true };
    }

    const teacherEnt = this.getTeacherEntitlement(userId);
    const isAllowed = teacherEnt.featuresAllowed.includes(feature);
    if (!isAllowed) {
      return {
        allowed: false,
        reason: 'Tính năng yêu cầu quyền Teacher Pro để truy cập.',
      };
    }
    return { allowed: true };
  }

  /**
   * Records a client usage event.
   */
  recordUsage(
    userId: string,
    role: 'STUDENT' | 'TEACHER',
    feature: AIUsageFeature,
    tokensUsed: number,
    status: 'ALLOWED' | 'QUOTA_EXCEEDED' | 'FEATURE_LOCKED' = 'ALLOWED'
  ): AIUsageRecord {
    const record: AIUsageRecord = {
      recordId: `use-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      userId,
      role,
      feature,
      requestId: `req-${Date.now()}`,
      tokensUsed,
      status,
      timestamp: new Date().toISOString(),
    };
    this.usageHistory.push(record);
    return record;
  }

  getStudentQuotas(studentId: string): AIUsageQuota[] {
    const ent = this.getStudentEntitlement(studentId);
    return [
      {
        feature: 'STUDENT_TUTOR_UNLIMITED',
        limit: ent.dailyTutorMessageLimit,
        current: ent.tutorMessagesSentToday,
        remaining: Math.max(0, ent.dailyTutorMessageLimit - ent.tutorMessagesSentToday),
        resetsAt: '00:00:00 UTC',
      },
    ];
  }
}

export const aiUsageService = new AIUsageService();
