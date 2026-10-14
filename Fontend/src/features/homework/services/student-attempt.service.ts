import { assignmentService } from '../../../management/teacher/services/assignment.service';
import type {
  StudentAssignmentAttempt,
  StudentQuestionAnswer,
} from '../types/student-homework.types';

const STORAGE_PREFIX = 'zh_attempt_draft_';

/**
 * Shared mock attempt service.
 * In-memory store persistent for the session + localStorage sync for refresh recovery.
 *
 * In production (ASP.NET Core Web API + EF Core + SQL Server):
 * Replaced by endpoints:
 *   POST /api/v1/student/assignments/{assignmentId}/attempts/start
 *   GET  /api/v1/student/attempts/{attemptId}
 *   PUT  /api/v1/student/attempts/{attemptId}/answers
 *   POST /api/v1/student/attempts/{attemptId}/submit
 */
class StudentAttemptService {
  private attemptsStore: StudentAssignmentAttempt[] = [];
  private lastClientSequence: Record<string, number> = {};

  constructor() {
    this.hydrateFromStorage();
  }

  private hydrateFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
      keys.forEach((key) => {
        const item = window.localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item) as StudentAssignmentAttempt;
          if (parsed && parsed.id && !this.attemptsStore.some((a) => a.id === parsed.id)) {
            this.attemptsStore.push(parsed);
          }
        }
      });
    } catch (err) {
      console.warn('[StudentAttemptService] Error restoring local storage drafts:', err);
    }
  }

  private syncToStorage(attempt: StudentAssignmentAttempt) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(`${STORAGE_PREFIX}${attempt.id}`, JSON.stringify(attempt));
    } catch (err) {
      console.warn('[StudentAttemptService] Error writing draft to local storage:', err);
    }
  }

  /**
   * Retrieves all attempts made by a student, optionally filtered by assignmentId.
   */
  async getAttemptsForStudent(
    studentId: string,
    assignmentId?: string
  ): Promise<StudentAssignmentAttempt[]> {
    await new Promise((r) => setTimeout(r, 30));

    let list = this.attemptsStore.filter((a) => a.studentId === studentId);
    if (assignmentId) {
      list = list.filter((a) => a.assignmentId === assignmentId);
    }

    return list.sort((x, y) => y.attemptNumber - x.attemptNumber).map((a) => ({ ...a }));
  }

  /**
   * Retrieves any active (IN_PROGRESS) attempt for this student and assignment.
   */
  async getActiveAttempt(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentAttempt | undefined> {
    const attempt = this.attemptsStore.find(
      (a) => a.assignmentId === assignmentId && a.studentId === studentId && a.status === 'IN_PROGRESS'
    );

    if (!attempt) return undefined;

    // Check if attempt has expired based on immutable expiresAt
    if (attempt.expiresAt && new Date().toISOString() > attempt.expiresAt) {
      attempt.status = 'EXPIRED';
      attempt.submittedAt = attempt.expiresAt;
      this.syncToStorage(attempt);
      return undefined;
    }

    return { ...attempt };
  }

  /**
   * Starts a new attempt for a student on an assignment.
   * Validates eligibility, enrolment, time limits, and prevents duplicate active attempts.
   */
  async startAttempt(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentAttempt> {
    await new Promise((r) => setTimeout(r, 60));

    // 1. Check for existing active attempt first (idempotent resume)
    const existingActive = await this.getActiveAttempt(assignmentId, studentId);
    if (existingActive) {
      return existingActive;
    }

    // 2. Resolve assignment details and enrollment
    const detail = await assignmentService.getStudentAssignmentDetail(assignmentId, studentId);
    if (!detail) {
      throw new Error('Bài tập không tồn tại hoặc bạn không có quyền truy cập lớp học này.');
    }

    if (!detail.canStartAttempt) {
      throw new Error(detail.reasonIfBlocked || 'Không thể bắt đầu làm bài tập này vào lúc này.');
    }

    // 3. Count past attempts
    const pastAttempts = this.attemptsStore.filter(
      (a) => a.assignmentId === assignmentId && a.studentId === studentId
    );

    if (pastAttempts.length >= detail.maxAttempts) {
      throw new Error(`Bạn đã hoàn thành tối đa số lần làm bài cho phép (${detail.maxAttempts} lần).`);
    }

    // 4. Calculate immutable expiration timestamp if time limit is configured
    const now = new Date();
    let expiresAt: string | undefined = undefined;
    if (detail.timeLimitMinutes && detail.timeLimitMinutes > 0) {
      const expirationMs = now.getTime() + detail.timeLimitMinutes * 60 * 1000;
      expiresAt = new Date(expirationMs).toISOString();
    }

    // Check if overdue
    const todayStr = now.toISOString().slice(0, 10);
    const isLate = Boolean(detail.dueDate && todayStr > detail.dueDate);

    const newAttempt: StudentAssignmentAttempt = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      assignmentId,
      studentId,
      classId: detail.classId,
      attemptNumber: pastAttempts.length + 1,
      status: 'IN_PROGRESS',
      startedAt: now.toISOString(),
      expiresAt,
      timeSpentSeconds: 0,
      answers: {},
      isLate,
    };

    this.attemptsStore.push(newAttempt);
    this.syncToStorage(newAttempt);

    return { ...newAttempt };
  }

  /**
   * Resumes an existing attempt by ID.
   */
  async resumeAttempt(
    attemptId: string,
    studentId: string
  ): Promise<StudentAssignmentAttempt> {
    await new Promise((r) => setTimeout(r, 40));

    const attempt = this.attemptsStore.find((a) => a.id === attemptId && a.studentId === studentId);
    if (!attempt) {
      throw new Error(`Không tìm thấy phiên làm bài: ${attemptId}`);
    }

    // Check expiration
    if (attempt.status === 'IN_PROGRESS' && attempt.expiresAt && new Date().toISOString() > attempt.expiresAt) {
      attempt.status = 'EXPIRED';
      attempt.submittedAt = attempt.expiresAt;
      this.syncToStorage(attempt);
    }

    return { ...attempt };
  }

  /**
   * Saves attempt answers with client sequence numbers to prevent stale saves from overwriting newer drafts.
   */
  async saveAttemptAnswers(
    attemptId: string,
    answers: Record<string, StudentQuestionAnswer>,
    sequenceNumber: number,
    timeSpentSeconds?: number
  ): Promise<{ saved: boolean; sequenceNumber: number }> {
    const lastSeq = this.lastClientSequence[attemptId] || 0;
    if (sequenceNumber < lastSeq) {
      // Reject stale save request
      return { saved: false, sequenceNumber: lastSeq };
    }

    this.lastClientSequence[attemptId] = sequenceNumber;

    const attempt = this.attemptsStore.find((a) => a.id === attemptId);
    if (!attempt) {
      throw new Error(`Không tìm thấy bài làm để lưu: ${attemptId}`);
    }

    if (attempt.status !== 'IN_PROGRESS') {
      // Do not overwrite submitted or expired attempt
      return { saved: false, sequenceNumber };
    }

    attempt.answers = { ...answers };
    if (timeSpentSeconds !== undefined && timeSpentSeconds > attempt.timeSpentSeconds) {
      attempt.timeSpentSeconds = timeSpentSeconds;
    }

    this.syncToStorage(attempt);
    return { saved: true, sequenceNumber };
  }

  /**
   * Submits an attempt.
   * Flushes answers, marks status SUBMITTED, and locks further edits.
   */
  async submitAttempt(
    attemptId: string,
    studentId: string,
    finalAnswers?: Record<string, StudentQuestionAnswer>,
    finalTimeSpentSeconds?: number
  ): Promise<StudentAssignmentAttempt> {
    await new Promise((r) => setTimeout(r, 80));

    const attempt = this.attemptsStore.find((a) => a.id === attemptId && a.studentId === studentId);
    if (!attempt) {
      throw new Error(`Không tìm thấy bài làm để nộp: ${attemptId}`);
    }

    if (attempt.status === 'SUBMITTED') {
      // Idempotent: already submitted
      return { ...attempt };
    }

    if (finalAnswers) {
      attempt.answers = { ...finalAnswers };
    }

    if (finalTimeSpentSeconds !== undefined) {
      attempt.timeSpentSeconds = finalTimeSpentSeconds;
    }

    attempt.status = 'SUBMITTED';
    attempt.submittedAt = new Date().toISOString();

    this.syncToStorage(attempt);
    return { ...attempt };
  }

  /**
   * Retrieves summary details of an attempt for the result / confirmation page.
   */
  async getAttemptSummary(
    attemptId: string,
    studentId: string
  ): Promise<{
    attempt: StudentAssignmentAttempt;
    assignmentTitle: string;
    className: string;
    totalQuestions: number;
    answeredCount: number;
  } | undefined> {
    await new Promise((r) => setTimeout(r, 40));

    const attempt = this.attemptsStore.find((a) => a.id === attemptId && a.studentId === studentId);
    if (!attempt) return undefined;

    const detail = await assignmentService.getStudentAssignmentDetail(attempt.assignmentId, studentId);
    const totalQuestions = detail?.questionCount || 0;
    const answeredCount = Object.keys(attempt.answers).length;

    return {
      attempt: { ...attempt },
      assignmentTitle: detail?.title || 'Bài tập về nhà',
      className: detail?.className || 'Lớp học',
      totalQuestions,
      answeredCount,
    };
  }
}

export const studentAttemptService = new StudentAttemptService();
