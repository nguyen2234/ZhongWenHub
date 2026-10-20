import type { ContentStatus } from './common-content.types';
import type {
  ExerciseType,
  SkillCategory,
  MatchingPair,
} from '../../../../features/exercise-engine/types';
import type { GrammarPracticeExercise } from '../../../../features/grammar/types/grammar.types';

export type GrammarCategory =
  | 'cơ bản'
  | 'câu chữ'
  | 'trợ từ'
  | 'liên từ'
  | 'bổ ngữ'
  | 'phó từ';

export interface AdminGrammarExample {
  zh: string;
  pinyin: string;
  meaningVi: string;
}

export interface AdminGrammarPoint {
  id: string;
  code: string;
  title: string;
  pinyinTitle: string;
  hskLevel: number; // 1 to 6
  hskLevelId: string; // 'level-hsk-1' .. 'level-hsk-6'
  category: GrammarCategory;
  structureFormula: string;
  explanation: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khá';
  status: ContentStatus;
  examples: AdminGrammarExample[];
  commonMistake?: {
    wrong: string;
    right: string;
    note: string;
  };
  practice?: GrammarPracticeExercise;
  linkedLessonIds: string[];
  linkedExerciseIds: string[];
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface AdminGrammarFilters {
  search: string;
  hskLevel: number | 'ALL';
  category: GrammarCategory | 'ALL';
  status: ContentStatus | 'ALL';
}

export interface CreateAdminGrammarDTO {
  code: string;
  title: string;
  pinyinTitle: string;
  hskLevel: number;
  category: GrammarCategory;
  structureFormula: string;
  explanation: string;
  difficulty: 'Dễ' | 'Trung bình' | 'Khá';
  status: ContentStatus;
  examples: AdminGrammarExample[];
  commonMistake?: {
    wrong: string;
    right: string;
    note: string;
  };
  practice?: GrammarPracticeExercise;
  linkedLessonIds?: string[];
}

export interface UpdateAdminGrammarDTO extends Partial<CreateAdminGrammarDTO> {}

export interface AdminExerciseItem {
  id: string;
  type: ExerciseType;
  skill: SkillCategory;
  hskLevel: number;
  hskLevelId: string;
  difficulty: 'easy' | 'medium' | 'hard';
  status: ContentStatus;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: MatchingPair[];
  sentenceTokens?: string[];
  correctSentence?: string;
  explanation: string;
  grammarPointId?: string;
  lessonId?: string;
  xpReward: number;
  createdAt: string;
  updatedAt: string;
  [key: string]: unknown;
}

export interface AdminExerciseFilters {
  search: string;
  hskLevel: number | 'ALL';
  skill: SkillCategory | 'ALL';
  type: ExerciseType | 'ALL';
  difficulty: 'easy' | 'medium' | 'hard' | 'ALL';
  status: ContentStatus | 'ALL';
  grammarPointId?: string;
  lessonId?: string;
}

export interface CreateAdminExerciseDTO {
  type: ExerciseType;
  skill: SkillCategory;
  hskLevel: number;
  difficulty: 'easy' | 'medium' | 'hard';
  status: ContentStatus;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  options?: string[];
  correctOptionIndex?: number;
  matchingPairs?: MatchingPair[];
  sentenceTokens?: string[];
  correctSentence?: string;
  explanation: string;
  grammarPointId?: string;
  lessonId?: string;
  xpReward: number;
}

export interface UpdateAdminExerciseDTO extends Partial<CreateAdminExerciseDTO> {}
