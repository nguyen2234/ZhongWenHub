import type { ContentStatus } from './common-content.types';

export type ExamType = 'MOCK' | 'PRACTICE' | 'PLACEMENT' | 'MIDTERM' | 'FINAL';

export type ExamSectionName = 'Nghe hiểu' | 'Đọc hiểu' | 'Viết';

export interface ExamQuestionItem {
  id: string;
  examId: string;
  exerciseId: string;
  sectionName: ExamSectionName | string;
  orderIndex: number;
  points: number;
  exerciseTitle: string;
  exerciseType: string;
  exerciseSkill: string;
  hskLevel: number;
  promptHanzi?: string | null;
  promptPinyin?: string | null;
  promptVietnamese?: string | null;
  optionsJson?: string | null;
  correctOptionIndex?: number | null;
  correctAnswer?: string | null;
  explanation?: string | null;
}

export interface ExamSummary {
  id: string;
  code: string;
  title: string;
  hskLevel: number;
  examType: ExamType;
  description?: string | null;
  instructions?: string | null;
  durationMinutes: number;
  passingScore: number;
  totalPoints: number;
  questionCount: number;
  attemptCount: number;
  status: ContentStatus;
  createdByUserId?: string | null;
  updatedByUserId?: string | null;
  reviewedByUserId?: string | null;
  reviewedAt?: string | null;
  reviewNotes?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface ExamDetail extends ExamSummary {
  questions: ExamQuestionItem[];
}

export interface ExamStats {
  total: number;
  published: number;
  draft: number;
  pending: number;
  archived: number;
  byHsk: Record<number, number>;
}

export interface UpsertExamQuestionInput {
  exerciseId: string;
  sectionName: ExamSectionName | string;
  orderIndex: number;
  points: number;
}

export interface CreateExamInput {
  code: string;
  title: string;
  hskLevel: number;
  examType: ExamType;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  passingScore: number;
  status?: 'DRAFT' | 'PENDING_REVIEW';
  questions?: UpsertExamQuestionInput[];
}

export interface UpdateExamInput {
  code: string;
  title: string;
  hskLevel: number;
  examType: ExamType;
  description?: string;
  instructions?: string;
  durationMinutes: number;
  passingScore: number;
}

export interface ExamFilters {
  search: string;
  hskLevel: number | 'ALL';
  examType: ExamType | 'ALL';
  status: ContentStatus | 'ALL';
}
