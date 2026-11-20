import type { MatchingPair } from '../types';

interface LessonExercisePresentation {
  section: 'PRACTICE' | 'QUIZ';
  displayOrder: number;
  points?: number;
  matchingPairs?: MatchingPair[];
  sentenceTokens?: string[];
}

function parsePresentation(raw: unknown): Partial<LessonExercisePresentation> {
  if (typeof raw !== 'string' || !raw) return {};
  try {
    const data = JSON.parse(raw);
    return data && typeof data === 'object' ? data : {};
  } catch {
    return {};
  }
}

export function orderLessonExercises<T extends { lessonPresentationJson?: unknown; section?: string }>(exercises: T[]) {
  const rows = exercises.map((exercise) => ({ exercise, meta: parsePresentation(exercise.lessonPresentationJson) }));
  const hasSections = rows.some(({ exercise, meta }) => meta.section || exercise.section);
  const quizStart = exercises.length >= 4 ? exercises.length - 2 : exercises.length >= 2 ? exercises.length - 1 : exercises.length;
  return rows
    .map(({ exercise, meta }, index) => {
      const section = meta.section ?? exercise.section;
      const presentation: LessonExercisePresentation = {
        ...meta,
        section: section === 'QUIZ' || (!hasSections && index >= quizStart) ? 'QUIZ' : 'PRACTICE',
        displayOrder: meta.displayOrder ?? index + 1,
      };
      return { exercise, presentation };
    })
    .sort((left, right) =>
      left.presentation.section.localeCompare(right.presentation.section) ||
      left.presentation.displayOrder - right.presentation.displayOrder
    );
}
