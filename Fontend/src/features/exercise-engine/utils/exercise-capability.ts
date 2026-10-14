import type { ExerciseType } from '../types';

/**
 * Capability check helper for the 10 ExerciseType variants.
 * Exposes whether the exercise type can be fully rendered and interacted with
 * in the client runner without specialized hardware capture.
 */
export function isExerciseTypeSupported(type: ExerciseType): { supported: boolean; reason?: string } {
  if (type === 'pronunciation' || type === 'speaking') {
    return {
      supported: false,
      reason: 'Yêu cầu micro thu âm phát âm trực tiếp (sẽ hỗ trợ trong Phase 3).',
    };
  }
  if (type === 'hanzi-writing') {
    return {
      supported: false,
      reason: 'Yêu cầu bảng vẽ nét chữ Hán cảm ứng (sẽ hỗ trợ trong Phase 3).',
    };
  }
  return { supported: true };
}
