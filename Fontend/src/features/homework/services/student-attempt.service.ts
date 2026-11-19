import { assignmentService } from '../../../management/teacher/services/assignment.service';
import { studentHomeworkService } from './student-homework.service';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import type {
  StudentAssignmentAttempt,
  StudentQuestionAnswer,
} from '../types/student-homework.types';

const STORAGE_PREFIX = 'zh_attempt_draft_';

/**
 * Service managing student homework attempts and submission lifecycle.
 * Communicates with backend when authenticated with fallback to local draft storage for resilient recovery.
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
    await new Promise((r) => setTimeout(r, 20));

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
   * Calls real backend API when authenticated.
   */
  async startAttempt(
    assignmentId: string,
    studentId: string
  ): Promise<StudentAssignmentAttempt> {
    const token = authTokenService.getAccessToken();
    if (token) {
      const takingDto = await studentHomeworkService.startAttempt(assignmentId);
      const now = new Date();
      const startedAt = takingDto.startedAt || now.toISOString();
      let expiresAt: string | undefined = undefined;
      if (takingDto.timeLimitMinutes && takingDto.timeLimitMinutes > 0) {
        const expirationMs = new Date(startedAt).getTime() + takingDto.timeLimitMinutes * 60 * 1000;
        expiresAt = new Date(expirationMs).toISOString();
      }

      const newAttempt: StudentAssignmentAttempt = {
        id: takingDto.submissionId,
        assignmentId: takingDto.assignmentId,
        studentId,
        classId: '',
        attemptNumber: takingDto.attemptNumber || 1,
        status: 'IN_PROGRESS',
        startedAt,
        expiresAt,
        timeSpentSeconds: 0,
        answers: {},
        isLate: false,
      };

      this.attemptsStore.push(newAttempt);
      this.syncToStorage(newAttempt);
      return { ...newAttempt };
    }

    // Mock fallback for test runners without JWT
    await new Promise((r) => setTimeout(r, 40));

    const existingActive = await this.getActiveAttempt(assignmentId, studentId);
    if (existingActive) {
      return existingActive;
    }

    const detail = await assignmentService.getStudentAssignmentDetail(assignmentId, studentId);
    if (!detail) {
      throw new Error('Bài tập không tồn tại hoặc bạn không có quyền truy cập lớp học này.');
    }

    if (!detail.canStartAttempt) {
      throw new Error(detail.reasonIfBlocked || 'Không thể bắt đầu làm bài tập này vào lúc này.');
    }

    const pastAttempts = this.attemptsStore.filter(
      (a) => a.assignmentId === assignmentId && a.studentId === studentId
    );

    if (pastAttempts.length >= detail.maxAttempts) {
      throw new Error(`Bạn đã hoàn thành tối đa số lần làm bài cho phép (${detail.maxAttempts} lần).`);
    }

    const now = new Date();
    let expiresAt: string | undefined = undefined;
    if (detail.timeLimitMinutes && detail.timeLimitMinutes > 0) {
      const expirationMs = now.getTime() + detail.timeLimitMinutes * 60 * 1000;
      expiresAt = new Date(expirationMs).toISOString();
    }

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
    await new Promise((r) => setTimeout(r, 20));

    const attempt = this.attemptsStore.find((a) => a.id === attemptId && a.studentId === studentId);
    if (!attempt) {
      throw new Error(`Không tìm thấy phiên làm bài: ${attemptId}`);
    }

    if (attempt.status === 'IN_PROGRESS' && attempt.expiresAt && new Date().toISOString() > attempt.expiresAt) {
      attempt.status = 'EXPIRED';
      attempt.submittedAt = attempt.expiresAt;
      this.syncToStorage(attempt);
    }

    return { ...attempt };
  }

  /**
   * Saves attempt answers locally and tracks sequence to prevent stale saves.
   */
  async saveAttemptAnswers(
    attemptId: string,
    answers: Record<string, StudentQuestionAnswer>,
    sequenceNumber: number,
    timeSpentSeconds?: number
  ): Promise<{ saved: boolean; sequenceNumber: number }> {
    const lastSeq = this.lastClientSequence[attemptId] || 0;
    if (sequenceNumber < lastSeq) {
      return { saved: false, sequenceNumber: lastSeq };
    }

    this.lastClientSequence[attemptId] = sequenceNumber;

    const attempt = this.attemptsStore.find((a) => a.id === attemptId);
    if (!attempt) {
      throw new Error(`Không tìm thấy bài làm để lưu: ${attemptId}`);
    }

    if (attempt.status !== 'IN_PROGRESS') {
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
   * Submits an attempt to backend for automated server grading and answer protection.
   */
  async submitAttempt(
    attemptId: string,
    studentId: string,
    finalAnswers?: Record<string, StudentQuestionAnswer>,
    finalTimeSpentSeconds?: number
  ): Promise<StudentAssignmentAttempt> {
    const token = authTokenService.getAccessToken();
    if (token) {
      const answerEntries = Object.entries(finalAnswers || {}).map(([questionId, ans]) => {
        let selectedOption: string | null = null;
        let textAnswer: string | null = null;
        if (typeof ans.value === 'number') {
          selectedOption = String.fromCharCode(65 + ans.value);
        } else if (typeof ans.value === 'string') {
          if (ans.value.length === 1 && ans.value >= 'A' && ans.value <= 'Z') {
            selectedOption = ans.value;
          } else {
            textAnswer = ans.value;
          }
        } else if (Array.isArray(ans.value)) {
          textAnswer = ans.value.join(', ');
        } else if (ans.value && typeof ans.value === 'object') {
          textAnswer = JSON.stringify(ans.value);
        }

        return {
          questionId,
          selectedOption,
          textAnswer,
        };
      });

      const result = await studentHomeworkService.submitHomework(
        attemptId,
        answerEntries,
        finalTimeSpentSeconds || 0
      );

      let attempt = this.attemptsStore.find((a) => a.id === attemptId);
      if (!attempt) {
        attempt = {
          id: attemptId,
          assignmentId: result.assignmentId,
          studentId,
          classId: '',
          attemptNumber: 1,
          status: 'SUBMITTED',
          startedAt: new Date().toISOString(),
          timeSpentSeconds: finalTimeSpentSeconds || 0,
          answers: finalAnswers || {},
          isLate: false,
        };
        this.attemptsStore.push(attempt);
      }

      attempt.status = 'SUBMITTED';
      attempt.submittedAt = result.submittedAt || new Date().toISOString();
      attempt.timeSpentSeconds = result.timeSpentSeconds || finalTimeSpentSeconds || 0;
      attempt.totalScore = result.score ?? result.earnedPoints;
      attempt.isPassed = result.isPassed;
      this.syncToStorage(attempt);
      return { ...attempt };
    }

    // Mock fallback for test runners
    await new Promise((r) => setTimeout(r, 60));

    const attempt = this.attemptsStore.find((a) => a.id === attemptId && a.studentId === studentId);
    if (!attempt) {
      throw new Error(`Không tìm thấy bài làm để nộp: ${attemptId}`);
    }

    if (attempt.status === 'SUBMITTED') {
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
   * Retrieves summary details of an attempt for confirmation page.
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
    const token = authTokenService.getAccessToken();
    if (token) {
      try {
        const result = await studentHomeworkService.getResult(attemptId);
        let attempt = this.attemptsStore.find((a) => a.id === attemptId);
        if (!attempt) {
          attempt = {
            id: attemptId,
            assignmentId: result.assignmentId,
            studentId,
            classId: '',
            attemptNumber: 1,
            status: result.status || 'SUBMITTED',
            startedAt: result.submittedAt || new Date().toISOString(),
            submittedAt: result.submittedAt,
            timeSpentSeconds: result.timeSpentSeconds || 0,
            answers: {},
            isLate: false,
          };
          this.attemptsStore.push(attempt);
        }

        const answered = result.reviewQuestions
          ? result.reviewQuestions.filter((q: any) => q.studentAnswer).length
          : 0;

        return {
          attempt: { ...attempt },
          assignmentTitle: result.assignmentTitle || 'Bài tập về nhà',
          className: 'Lớp học trực tuyến',
          totalQuestions: result.reviewQuestions ? result.reviewQuestions.length : 5,
          answeredCount: answered || 5,
        };
      } catch (error) {
        // Authenticated users must receive the real API error; local drafts are not server results.
        throw error;
      }
    }

    // Fallback for tests
    await new Promise((r) => setTimeout(r, 30));

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

  /**
   * Cleans up in-memory attempts and localStorage drafts when switching users or logging out.
   */
  clearUserCache(studentId?: string): void {
    if (studentId) {
      this.attemptsStore = this.attemptsStore.filter((a) => a.studentId !== studentId);
    } else {
      this.attemptsStore = [];
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const keys = Object.keys(window.localStorage).filter((k) => k.startsWith(STORAGE_PREFIX));
        keys.forEach((key) => {
          if (!studentId) {
            window.localStorage.removeItem(key);
          } else {
            const item = window.localStorage.getItem(key);
            if (item) {
              const parsed = JSON.parse(item) as StudentAssignmentAttempt;
              if (parsed && parsed.studentId === studentId) {
                window.localStorage.removeItem(key);
              }
            }
          }
        });
      } catch {
        // ignore
      }
    }
  }
}

export const studentAttemptService = new StudentAttemptService();
