import type { AssignmentStatus, RetakePolicy } from '../../../management/teacher/types/assignment.types';
import type { ExerciseType } from '../../exercise-engine/types';

/**
 * ============================================================================
 * ARCHITECTURAL SECURITY NOTICE
 * ============================================================================
 * In this client-side prototype / mock integration layer, DTOs are sanitized
 * in-memory to simulate real backend API behavior. However, because JavaScript
 * code and in-memory mock stores execute in the client browser, frontend
 * sanitization CANNOT provide true adversarial security against browser DevTools.
 *
 * In the upcoming production backend (ASP.NET Core Web API + EF Core + SQL Server):
 * 1. The ASP.NET Core controller (e.g. `GET /api/v1/student/assignments/{id}/runner`)
 *    will execute EF Core queries using project-to-DTO (`.Select(...)`) and
 *    STRICTLY NEVER serialize answer keys (`_correctOptionIndex`, `_correctSentence`,
 *    `explanation`, or solution rubrics) until the teacher's release condition is met.
 * 2. Authorization middleware will enforce JWT token claims:
 *    - `studentId` matching the caller identity
 *    - Valid active enrollment in `ClassMember` for the targeted class
 *    - Rejection of any draft or non-published assignment access.
 * ============================================================================
 */

/* ==========================================================================
   1. STUDENT RUNNER QUESTION CONTRACTS (Strict Allowlist Sanitization)
   ========================================================================== */

/**
 * Item for matching pairs in the student runner.
 * Left and right lists are independently shuffled with opaque IDs to ensure
 * pair relationships are NOT exposed in client data structures.
 */
export interface ShuffledMatchingItem {
  id: string; // Opaque ID e.g. "L-0", "R-2"
  text: string;
}

export interface StudentMatchingData {
  leftItems: ShuffledMatchingItem[];
  rightItems: ShuffledMatchingItem[];
}

/**
 * Sanitized question DTO delivered to the Student Assignment Runner.
 * NEVER contains correctOptionIndex, _correctOptionIndex, correctSentence,
 * _correctSentence, correctAnswer, answerKey, explanation, or grading rubrics.
 */
export interface StudentRunnerQuestionDTO {
  id: string; // AssignmentQuestion ID
  assignmentId: string;
  questionBankId: string;
  orderIndex: number;
  points: number;
  exerciseType: ExerciseType;
  title: string;
  instruction: string;
  promptHanzi?: string;
  promptPinyin?: string;
  promptVietnamese?: string;
  audioUrl?: string;
  options?: string[];
  sentenceTokens?: string[];
  
  // Matching exercise data: both raw matching pairs (with ids preserved for controlled pairing)
  // and independently shuffled presentation data
  matchingData?: StudentMatchingData;
  matchingPairs?: Array<{ id: string; hanzi: string; meaning: string }>;

  // Feature capability flag
  isSupported: boolean;
  unsupportedReason?: string;
}

/* ==========================================================================
   2. STUDENT HOMEWORK SUMMARY & DETAIL CONTRACTS
   ========================================================================== */

export interface StudentHomeworkSummaryDTO {
  assignmentId: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  classCode: string;
  hskLevelId: string;
  hskLevelName: string;
  hskLevelColor: string;
  status: AssignmentStatus;
  
  // Assignment constraints
  dueDate?: string;
  closeDate?: string;
  timeLimitMinutes?: number;
  maxAttempts: number;
  passingPoints: number;
  totalPoints: number;
  questionCount: number;

  // Policies
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  retakePolicy: RetakePolicy;

  // Student-specific derived status
  isOverdue: boolean;
  isClosed: boolean;
  canStartAttempt: boolean;
  attemptsUsed: number;
  bestScore?: number;
}

export interface StudentAssignmentDetailDTO {
  assignmentId: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  classCode: string;
  hskLevelId: string;
  hskLevelName: string;
  hskLevelColor: string;
  status: AssignmentStatus;
  totalPoints: number;
  passingPoints: number;
  questionCount: number;
  timeLimitMinutes?: number;
  maxAttempts: number;
  retakePolicy: RetakePolicy;
  allowLateSubmission: boolean;
  latePenaltyPercent: number;
  dueDate?: string;
  closeDate?: string;
  publishedAt?: string;
  
  // High-level overview of question types without solutions
  questionTypesOverview: Array<{
    type: ExerciseType;
    count: number;
    points: number;
  }>;

  canStartAttempt: boolean;
  reasonIfBlocked?: string;
  attemptsUsed: number;
}

export interface StudentAssignmentRunnerDTO {
  assignmentId: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  classCode: string;
  hskLevelId: string;
  hskLevelName: string;
  hskLevelColor: string;
  timeLimitMinutes?: number;
  maxAttempts: number;
  totalPoints: number;
  passingPoints: number;
  shuffleQuestions: boolean;
  questions: StudentRunnerQuestionDTO[];
}

/* ==========================================================================
   3. ATTEMPT & SUBMISSION MODELS (Foundation for Phase 2B.2)
   ========================================================================== */

export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'EXPIRED' | 'GRADED';

export interface StudentQuestionAnswer {
  questionId: string;
  exerciseType: ExerciseType;
  value: number | string | string[] | Record<string, string>;
  isFlagged?: boolean;
  answeredAt: string;
}

export interface StudentAssignmentAttempt {
  id: string;
  assignmentId: string;
  studentId: string;
  classId: string;
  attemptNumber: number;
  status: AttemptStatus;
  startedAt: string;
  submittedAt?: string;
  expiresAt?: string;
  timeSpentSeconds: number;
  answers: Record<string, StudentQuestionAnswer>;
  totalScore?: number;
  isPassed?: boolean;
  isLate: boolean;
}
