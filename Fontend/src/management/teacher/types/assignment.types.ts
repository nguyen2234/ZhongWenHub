import type { ExerciseType, MatchingPair } from '../../../features/exercise-engine/types';

/* ==========================================================================
   ENUMS & CONSTANTS
   ========================================================================== */

/**
 * Vong doi cua bai tap giao ve nha.
 * DRAFT     -> Ban nhap, giao vien chinh sua tu do.
 * PUBLISHED -> Da phat hanh, khong cho sua noi dung cau hoi hoac diem.
 * CLOSED    -> Da dong nop bai, hoc vien khong the nop them.
 * ARCHIVED  -> Luu tru, an khoi danh sach mac dinh.
 */
export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'ARCHIVED';

/**
 * Chinh sach tinh diem khi hoc vien lam lai nhieu lan.
 */
export type RetakePolicy = 'HIGHEST_SCORE' | 'LATEST_ATTEMPT';

/* ==========================================================================
   CORE ENTITIES
   ========================================================================== */

export interface Assignment {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  hskLevelId: string;
  status: AssignmentStatus;
  timeLimitMinutes?: number;
  maxAttempts: number;
  retakePolicy: RetakePolicy;
  passingPoints: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
}

/**
 * Snapshot bat bien luu trang thai cau hoi tai thoi diem phat hanh.
 * Khong thay doi ke ca khi Shared Exercise Catalog bi chinh sua.
 * Luu tru khoa dap an noi bo de cham diem (khong tra ve cho hoc sinh truoc thoi han).
 */
export interface QuestionSnapshot {
  snapshotVersion: number;
  snapshotAt: string;
  exerciseType: ExerciseType;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  options?: string[];
  sentenceTokens?: string[];
  matchingPairs?: MatchingPair[];
  grammarPoint?: string;
  vocabularyIds?: number[];
  // Internal answer keys
  _correctOptionIndex?: number;
  _correctSentence?: string;
  explanation: string;
}

export interface AssignmentQuestion {
  id: string;
  assignmentId: string;
  questionBankId: string | number;
  orderIndex: number;
  points: number;
  snapshot?: QuestionSnapshot;
}

export interface AssignmentTarget {
  id: string;
  assignmentId: string;
  classId: string;
  dueDate?: string;
  closeDate?: string;
}

/* ==========================================================================
   DATA TRANSFER OBJECTS (DTOs)
   ========================================================================== */

export interface AssignmentSummaryDTO {
  id: string;
  title: string;
  description: string;
  hskLevelId: string;
  hskLevelName: string;
  hskLevelColor: string;
  status: AssignmentStatus;
  totalPoints: number;
  questionCount: number;
  targetClassCount: number;
  targetClassNames: string[];
  earliestDueDate?: string;
  maxAttempts: number;
  timeLimitMinutes?: number;
  passingPoints: number;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

export interface AssignmentQuestionViewItem {
  id: string;
  assignmentId: string;
  questionBankId: string | number;
  orderIndex: number;
  points: number;
  exerciseType: ExerciseType;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  hskLevel?: number;
  isSnapshotted: boolean;
}

export interface AssignmentTargetViewItem {
  id: string;
  assignmentId: string;
  classId: string;
  className: string;
  classCode: string;
  hskLevelName: string;
  dueDate?: string;
  closeDate?: string;
}

export interface AssignmentDetailDTO {
  id: string;
  teacherId: string;
  title: string;
  description: string;
  hskLevelId: string;
  hskLevelName: string;
  status: AssignmentStatus;
  timeLimitMinutes?: number;
  maxAttempts: number;
  retakePolicy: RetakePolicy;
  passingPoints: number;
  totalPoints: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  questions: AssignmentQuestionViewItem[];
  targets: AssignmentTargetViewItem[];
  isSnapshotted: boolean;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  closedAt?: string;
}

export interface CreateAssignmentDTO {
  title: string;
  description?: string;
  hskLevelId: string;
  timeLimitMinutes?: number;
  maxAttempts: number;
  retakePolicy: RetakePolicy;
  passingPoints: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  questions: Array<{
    questionBankId: string | number;
    orderIndex: number;
    points: number;
  }>;
  targets: Array<{
    classId: string;
    dueDate?: string;
    closeDate?: string;
  }>;
}

export interface UpdateDraftAssignmentDTO {
  title: string;
  description?: string;
  hskLevelId: string;
  timeLimitMinutes?: number;
  maxAttempts: number;
  retakePolicy: RetakePolicy;
  passingPoints: number;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  shuffleQuestions: boolean;
  showCorrectAnswers: boolean;
  questions: Array<{
    questionBankId: string | number;
    orderIndex: number;
    points: number;
  }>;
  targets: Array<{
    classId: string;
    dueDate?: string;
    closeDate?: string;
  }>;
}

/* ==========================================================================
   UI FILTERS & SORT
   ========================================================================== */

export interface AssignmentFilters {
  search: string;
  hskLevelId: string;
  classId: string;
  status: AssignmentStatus | 'ALL';
}

export interface AssignmentSort {
  field: 'createdAt' | 'title' | 'status' | 'totalPoints' | 'questionCount';
  direction: 'asc' | 'desc';
}

export const ASSIGNMENT_STATUS_LABELS: Record<AssignmentStatus, string> = {
  DRAFT: 'Bản nháp',
  PUBLISHED: 'Đã phát hành',
  CLOSED: 'Đã đóng nộp',
  ARCHIVED: 'Đã lưu trữ',
};
