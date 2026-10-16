import type {
  StudentLearningState,
  LearningRecommendation,
  WeakKnowledgeRecord,
} from '../types/learning-state.types';
import { findLessonMetadata, findNextLessonId } from '../data/curriculumData';

/**
 * Generate explainable, priority-ranked learning recommendations
 * 1. Overdue vocabulary review
 * 2. Weak knowledge practice
 * 3. Resume incomplete lesson
 * 4. Continue next available lesson
 * 5. Optional skill practice
 */
export function generateRecommendations(
  state: StudentLearningState,
  weakPoints: WeakKnowledgeRecord[] = state.weakKnowledgePoints || []
): LearningRecommendation[] {
  const recommendations: LearningRecommendation[] = [];

  // 1. Overdue Vocabulary Review (SRS)
  let dueCount = 0;
  for (const vocabState of Object.values(state.userVocabStates)) {
    if (vocabState.isDueToday) dueCount++;
  }

  if (dueCount > 0) {
    recommendations.push({
      id: 'rec-srs-due',
      priority: 1,
      category: 'srs-due',
      title: `Ôn tập ${dueCount} từ vựng đến hạn`,
      reason: 'Thuật toán Spaced Repetition đề xuất ôn lại ngay hôm nay để tránh quên.',
      actionLabel: 'Ôn tập ngay ➜',
      destinationRoute: '/srs-review',
      badge: `${dueCount} từ`,
      badgeVariant: 'streak',
    });
  }

  // 2. Weak Knowledge Practice
  const topWeak = weakPoints.find((w) => w.masteryLevel === 'WEAK');
  if (topWeak) {
    recommendations.push({
      id: `rec-weak-${topWeak.knowledgePointId}`,
      priority: 2,
      category: 'weak-knowledge',
      title: `Khắc phục điểm yếu: ${topWeak.topicTitle}`,
      reason: topWeak.evidence,
      actionLabel: 'Luyện khắc phục ➜',
      destinationRoute: topWeak.suggestedPractice.route || '/practice',
      badge: `${topWeak.accuracy}% chính xác`,
      badgeVariant: 'primary',
    });
  }

  // 3. Resume Incomplete Lesson
  const currentLessonMeta = findLessonMetadata(state.currentLessonId);
  const currentProgress = state.lessonProgress[state.currentLessonId];

  if (
    currentLessonMeta &&
    currentProgress &&
    currentProgress.status === 'IN_PROGRESS' &&
    currentProgress.currentStepIndex > 0
  ) {
    const stepPct = Math.round((currentProgress.currentStepIndex / 6) * 100);
    recommendations.push({
      id: `rec-resume-${state.currentLessonId}`,
      priority: 3,
      category: 'resume-lesson',
      title: `Tiếp tục Bài ${currentLessonMeta.lessonNumber}: ${currentLessonMeta.hanzi}`,
      reason: `Bạn đã học được ${stepPct}% bài học này. Tiếp tục để nhận +${currentLessonMeta.xpReward} XP.`,
      actionLabel: 'Học tiếp ➜',
      destinationRoute: `/lesson?id=${currentLessonMeta.id}`,
      badge: `${stepPct}%`,
      badgeVariant: 'xp',
    });
  }

  // 4. Continue Next Available Lesson
  // If current lesson is completed or if looking for next unlocked lesson
  if (!recommendations.some((r) => r.category === 'resume-lesson')) {
    let nextId = state.currentLessonId;
    if (state.completedLessonIds.includes(state.currentLessonId)) {
      const discoveredNext = findNextLessonId(state.currentLessonId);
      if (discoveredNext) nextId = discoveredNext;
    }

    const nextMeta = findLessonMetadata(nextId);
    if (nextMeta && !state.completedLessonIds.includes(nextMeta.id)) {
      recommendations.push({
        id: `rec-next-${nextMeta.id}`,
        priority: 4,
        category: 'next-lesson',
        title: `Học bài tiếp theo: Bài ${nextMeta.lessonNumber} (${nextMeta.hanzi})`,
        reason: `Mở rộng vốn từ và mẫu câu "${nextMeta.meaning}".`,
        actionLabel: 'Bắt đầu bài học ➜',
        destinationRoute: `/lesson?id=${nextMeta.id}`,
        badge: `+${nextMeta.xpReward} XP`,
        badgeVariant: 'success',
      });
    }
  }

  // 5. Optional Skill Practice
  recommendations.push({
    id: 'rec-skill-listening',
    priority: 5,
    category: 'skill-practice',
    title: 'Luyện phản xạ 5 phút cấp tốc',
    reason: 'Rèn luyện phản xạ ngữ âm và từ vựng nhanh hàng ngày.',
    actionLabel: 'Luyện nhanh ➜',
    destinationRoute: '/practice',
    badge: '+20 XP',
    badgeVariant: 'primary',
  });

  return recommendations.sort((a, b) => a.priority - b.priority);
}
