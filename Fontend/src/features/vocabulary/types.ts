export type HSKLevelNumber = 1 | 2 | 3 | 4 | 5 | 6;

export type LearningStatus = 'new' | 'learning' | 'reviewing' | 'mastered';

export type SRSRating = 'again' | 'hard' | 'good' | 'easy';

export interface VocabularyExample {
  hanzi: string;
  pinyin: string;
  meaning: string;
}

export interface VocabularyItem {
  id: string;
  hanzi: string;
  pinyin: string;
  meanings: string[];
  primaryMeaning: string;
  wordType: string; // Động từ, Danh từ, Lượng từ, Tính từ, Trợ từ...
  hskLevel: HSKLevelNumber;
  lessonId: number;
  lessonSource: string; // e.g. "HSK 2 · Unit 2 · Bài 8"
  examples: VocabularyExample[];
  radical?: string; // Bộ thủ
  strokeCount?: number;
}

export interface UserVocabularyState {
  vocabularyId: string;
  status: LearningStatus;
  firstLearnedAt: string;
  lastReviewedAt: string;
  nextReviewAt: string; // ISO date string
  reviewCount: number;
  correctCount: number;
  isDueToday: boolean;
}

export interface SRSState {
  vocabularyId: string;
  stability: number; // in days or unit
  difficulty: number; // 0 - 10 scale
  interval: number; // in days (or minutes if < 1 day)
  repetitions: number;
  easeFactor: number; // default 2.5
}

export interface ReviewLog {
  id: string;
  vocabularyId: string;
  rating: SRSRating;
  reviewedAt: string;
  previousInterval: number;
  newInterval: number;
}

export interface ReviewQueueItem {
  vocabulary: VocabularyItem;
  userState: UserVocabularyState;
  srsState: SRSState;
  predictedIntervals: Record<SRSRating, string>;
}

export interface VocabularyFilterOptions {
  searchQuery: string;
  hskLevel: HSKLevelNumber | 'all';
  status: 'all' | 'due' | 'learning' | 'mastered';
}
