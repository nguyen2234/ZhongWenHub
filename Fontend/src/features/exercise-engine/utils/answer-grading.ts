import type { ExerciseType, MatchingPair, SharedExerciseItem, SkillCategory } from '../types';

const PUNCTUATION_AND_SPACE_RE = /[\s\u3000.,!?。！？，、；："'“”‘’（）()【】\[\]—\-·…~]/g;

/**
 * Normalizes user or expected answer strings for deterministic comparison across Unicode forms,
 * fullwidth/halfwidth variants, punctuation, and redundant whitespace.
 */
export function normalizeAnswerText(value?: string | null): string {
  if (!value) return '';
  return value
    .normalize('NFKC')
    .replace(PUNCTUATION_AND_SPACE_RE, '')
    .trim()
    .toLowerCase();
}

/**
 * Strips trailing explanatory pinyin/Vietnamese notes in parentheses like "几 (jǐ)" -> "几"
 * when an option string combines Hanzi with parenthetical reading.
 */
export function stripParentheticalNote(value?: string | null): string {
  if (!value) return '';
  return value.replace(/\s*\([^)]*\)\s*/g, ' ').trim();
}

/**
 * Normalizes backend exercise type aliases onto the unified frontend ExerciseType contract.
 */
export function normalizeBackendExerciseType(rawType?: string | null): ExerciseType {
  const t = (rawType || 'multiple-choice').trim().toLowerCase();
  if (t === 'fill-in-the-blank' || t === 'fill_blank' || t === 'fill-blank') {
    return 'fill-blank';
  }
  if (t === 'sentence-ordering' || t === 'sentence_order' || t === 'sentence-order') {
    return 'sentence-order';
  }
  if (t === 'listening' || t === 'listen-choice') {
    return 'listen-choice';
  }
  if (
    t === 'multiple-choice' ||
    t === 'matching' ||
    t === 'chinese-to-vietnamese' ||
    t === 'vietnamese-to-chinese' ||
    t === 'pronunciation' ||
    t === 'speaking' ||
    t === 'hanzi-writing'
  ) {
    return t as ExerciseType;
  }
  return 'multiple-choice';
}

/**
 * Parses bracketed tokens like "[他] [是] [昨天] [到] [北京] [来的]" into string tokens
 * only when the exercise does NOT already supply 4 MCQ options.
 */
export function parseBracketedTokens(promptHanzi?: string | null): string[] {
  if (!promptHanzi) return [];
  const matches = [...promptHanzi.matchAll(/\[([^\]]+)\]/g)].map((m) => m[1].trim()).filter(Boolean);
  return matches.length >= 2 ? matches : [];
}

export function normalizeSkillCategory(rawSkill?: string | null): SkillCategory {
  const s = (rawSkill || 'grammar').trim().toLowerCase();
  if (
    s === 'vocabulary' ||
    s === 'grammar' ||
    s === 'listening' ||
    s === 'reading' ||
    s === 'sentence' ||
    s === 'comprehensive'
  ) {
    return s;
  }
  if (s === 'writing') return 'sentence';
  return 'grammar';
}

export interface ExerciseGradingInput {
  selectedOption?: number | null;
  orderedTokens?: string[];
  matchedPairs?: string[];
  textAnswer?: string;
}

/**
 * Grades an exercise submission across MCQ, token sentence ordering, matching pairs,
 * and free-text fill-blank / translation inputs using normalized comparisons.
 */
export function gradeExerciseSubmission(
  exercise: SharedExerciseItem,
  input: ExerciseGradingInput
): { isCorrect: boolean; givenAnswer: string } {
  const {
    selectedOption = null,
    orderedTokens = [],
    matchedPairs = [],
    textAnswer = '',
  } = input;

  const hasTokenBuilder =
    exercise.type === 'sentence-order' &&
    Array.isArray(exercise.sentenceTokens) &&
    exercise.sentenceTokens.length > 0 &&
    (!exercise.options || exercise.options.length === 0);

  if (hasTokenBuilder) {
    const assembled = orderedTokens.join('');
    const targetRaw = stripParentheticalNote(exercise.correctSentence || '');
    const isCorrect =
      normalizeAnswerText(assembled).length > 0 &&
      (normalizeAnswerText(assembled) === normalizeAnswerText(exercise.correctSentence) ||
        normalizeAnswerText(assembled) === normalizeAnswerText(targetRaw));
    return { isCorrect, givenAnswer: assembled };
  }

  if (exercise.type === 'matching' && Array.isArray(exercise.matchingPairs)) {
    const total = exercise.matchingPairs.length;
    const isCorrect = total > 0 && matchedPairs.length === total;
    return { isCorrect, givenAnswer: isCorrect ? 'matched pairs' : `${matchedPairs.length}/${total}` };
  }

  if (Array.isArray(exercise.options) && exercise.options.length > 0) {
    const isCorrect =
      selectedOption !== null &&
      exercise.correctOptionIndex !== undefined &&
      selectedOption === exercise.correctOptionIndex;
    const givenAnswer =
      selectedOption !== null && exercise.options[selectedOption] !== undefined
        ? exercise.options[selectedOption]
        : '';
    return { isCorrect, givenAnswer };
  }

  const trimmed = textAnswer.trim();
  const normUser = normalizeAnswerText(trimmed);
  const targetCandidates = [
    exercise.correctSentence,
    stripParentheticalNote(exercise.correctSentence),
  ]
    .map(normalizeAnswerText)
    .filter(Boolean);

  const isCorrect = normUser.length > 0 && targetCandidates.includes(normUser);
  return { isCorrect, givenAnswer: trimmed };
}

/**
 * Adapts a live Backend ExerciseDTO payload into a SharedExerciseItem contract.
 */
export function adaptBackendExerciseToShared(raw: any): SharedExerciseItem {
  let options: string[] | undefined;
  if (Array.isArray(raw.options)) {
    options = raw.options.map(String);
  } else if (typeof raw.optionsJson === 'string' && raw.optionsJson.trim()) {
    try {
      const parsed = JSON.parse(raw.optionsJson);
      if (Array.isArray(parsed)) {
        options = parsed.map(String);
      }
    } catch {
      options = undefined;
    }
  }

  let matchingPairs: MatchingPair[] | undefined;
  if (Array.isArray(raw.matchingPairs)) {
    matchingPairs = raw.matchingPairs;
  }

  let sentenceTokens: string[] | undefined = Array.isArray(raw.sentenceTokens)
    ? raw.sentenceTokens.map(String)
    : undefined;

  const normalizedType = normalizeBackendExerciseType(raw.type || raw.exerciseType);
  const rawCorrect = raw.correctSentence || raw.correctAnswer || undefined;

  // If sentence-order arrives with NO MCQ options and bracketed tokens in promptHanzi, use interactive token builder.
  if (normalizedType === 'sentence-order' && (!options || options.length === 0) && !sentenceTokens) {
    const extracted = parseBracketedTokens(raw.promptHanzi);
    if (extracted.length > 0) {
      sentenceTokens = extracted;
    }
  }

  let correctIndex: number | undefined =
    typeof raw.correctOptionIndex === 'number' ? raw.correctOptionIndex : undefined;

  if (options && options.length > 0 && correctIndex === undefined && rawCorrect) {
    const idx = options.findIndex(
      (opt) => normalizeAnswerText(opt) === normalizeAnswerText(rawCorrect)
    );
    correctIndex = idx >= 0 ? idx : 0;
  }

  return {
    id: String(raw.id),
    type: normalizedType,
    title: raw.title || 'Bài tập luyện tập',
    instruction: raw.instruction || 'Chọn đáp án chính xác nhất:',
    hskLevel: typeof raw.hskLevel === 'number' ? raw.hskLevel : undefined,
    lessonId: raw.lessonId,
    skill: normalizeSkillCategory(raw.skill),
    promptHanzi: raw.promptHanzi || undefined,
    promptPinyin: raw.promptPinyin || undefined,
    promptVietnamese: raw.promptVietnamese || undefined,
    audioUrl: raw.audioUrl || undefined,
    options,
    correctOptionIndex: correctIndex,
    matchingPairs,
    sentenceTokens,
    correctSentence: rawCorrect,
    explanation: raw.explanation || 'Xem lại giải thích chi tiết trong phần bài học.',
    xpReward: typeof raw.xpReward === 'number' ? raw.xpReward : 5,
  };
}
