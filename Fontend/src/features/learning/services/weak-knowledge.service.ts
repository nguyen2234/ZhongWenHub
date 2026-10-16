import type {
  PracticeAttemptRecord,
  WeakKnowledgeRecord,
  WeakKnowledgeCategory,
  WeakKnowledgeTrend,
  MasteryLevel,
} from '../types/learning-state.types';

export interface WeakKnowledgeConfig {
  minAttemptsForEvidence: number; // e.g. 2
  lowAccuracyThreshold: number; // e.g. 60%
  highAccuracyThreshold: number; // e.g. 80%
  recentWindowSize: number; // e.g. 3
}

export const DEFAULT_WEAK_KNOWLEDGE_CONFIG: WeakKnowledgeConfig = {
  minAttemptsForEvidence: 2,
  lowAccuracyThreshold: 65,
  highAccuracyThreshold: 80,
  recentWindowSize: 3,
};

/**
 * Deterministic, explainable weak-knowledge analyzer.
 * Evaluates real student exercise attempts without LLM hallucination.
 */
export function analyzeWeakKnowledge(
  attempts: PracticeAttemptRecord[],
  config: WeakKnowledgeConfig = DEFAULT_WEAK_KNOWLEDGE_CONFIG
): WeakKnowledgeRecord[] {
  if (!attempts || attempts.length === 0) {
    return [];
  }

  // 1. Group attempts by knowledgePointId
  const groups: Record<string, PracticeAttemptRecord[]> = {};
  for (const attempt of attempts) {
    const key = attempt.knowledgePointId || attempt.exerciseId;
    if (!groups[key]) groups[key] = [];
    groups[key].push(attempt);
  }

  const results: WeakKnowledgeRecord[] = [];

  for (const [pointId, list] of Object.entries(groups)) {
    // Sort chronologically (oldest to newest)
    const sorted = [...list].sort(
      (a, b) => new Date(a.attemptedAt).getTime() - new Date(b.attemptedAt).getTime()
    );

    const totalAttempts = sorted.length;
    const correctAttempts = sorted.filter((a) => a.isCorrect).length;
    const incorrectAttempts = totalAttempts - correctAttempts;
    const overallAccuracy = Math.round((correctAttempts / totalAttempts) * 100);

    const latest = sorted[sorted.length - 1];
    const category: WeakKnowledgeCategory = latest.category || 'grammar';
    const topicTitle = latest.topicTitle || latest.knowledgePointId;
    const hskLevel = latest.hskLevel || 2;

    // Recent window calculations (last N attempts)
    const recentSlice = sorted.slice(-config.recentWindowSize);
    const recentCorrect = recentSlice.filter((a) => a.isCorrect).length;
    const recentAccuracy = Math.round((recentCorrect / recentSlice.length) * 100);

    // Trend calculation
    let trend: WeakKnowledgeTrend = 'stagnant';
    if (sorted.length >= 3) {
      const olderSlice = sorted.slice(0, Math.floor(sorted.length / 2));
      const olderCorrect = olderSlice.filter((a) => a.isCorrect).length;
      const olderAccuracy = Math.round((olderCorrect / olderSlice.length) * 100);

      if (recentAccuracy > olderAccuracy + 15) {
        trend = 'improving';
      } else if (recentAccuracy < olderAccuracy - 15) {
        trend = 'declining';
      }
    }

    // Determine mastery state
    let masteryLevel: MasteryLevel = 'INSUFFICIENT_DATA';
    let evidence = '';

    if (totalAttempts < config.minAttemptsForEvidence) {
      masteryLevel = 'INSUFFICIENT_DATA';
      evidence = `Chưa đủ dữ liệu đánh giá (${totalAttempts}/${config.minAttemptsForEvidence} lần làm)`;
    } else if (recentAccuracy < config.lowAccuracyThreshold || incorrectAttempts >= 2) {
      if (trend === 'improving' && recentAccuracy >= 50) {
        masteryLevel = 'RECOVERING';
        evidence = `Đang hồi phục: Đúng ${recentCorrect}/${recentSlice.length} lần gần nhất (${recentAccuracy}%)`;
      } else {
        masteryLevel = 'WEAK';
        evidence = `Sai ${incorrectAttempts}/${totalAttempts} lần làm (${overallAccuracy}% chính xác)`;
      }
    } else if (overallAccuracy >= config.highAccuracyThreshold) {
      masteryLevel = 'MASTERED';
      evidence = `Nắm vững: ${correctAttempts}/${totalAttempts} lần đúng (${overallAccuracy}%)`;
    } else {
      masteryLevel = 'RECOVERING';
      evidence = `Tiến bộ ổn định: Độ chính xác gần đây đạt ${recentAccuracy}%`;
    }

    // Only surface items that are WEAK or RECOVERING to student focus
    if (masteryLevel === 'WEAK' || masteryLevel === 'RECOVERING') {
      const exerciseIds = Array.from(new Set(sorted.map((s) => s.exerciseId)));

      results.push({
        id: `weak-${pointId}`,
        knowledgePointId: pointId,
        topicTitle,
        category,
        hskLevel,
        totalAttempts,
        correctAttempts,
        incorrectAttempts,
        accuracy: recentAccuracy,
        masteryLevel,
        trend,
        evidence,
        suggestedPractice: {
          title: `Luyện củng cố: ${topicTitle}`,
          route: `/practice?topic=${encodeURIComponent(pointId)}`,
          exerciseIds,
        },
        lastEvaluatedAt: new Date().toISOString(),
      });
    }
  }

  // Sort: WEAK first, then lowest accuracy
  return results.sort((a, b) => {
    if (a.masteryLevel === 'WEAK' && b.masteryLevel !== 'WEAK') return -1;
    if (a.masteryLevel !== 'WEAK' && b.masteryLevel === 'WEAK') return 1;
    return a.accuracy - b.accuracy;
  });
}
