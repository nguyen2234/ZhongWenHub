import { assignmentService } from '../../../management/teacher/services/assignment.service';
import { getCurrentStudentIdentity } from '../../auth/services/student-identity.adapter';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import { isProductionEnvironment } from '../../../core/api/client/api-config';
import type {
  StudentHomeworkSummaryDTO,
  StudentAssignmentDetailDTO,
  StudentAssignmentRunnerDTO,
} from '../types/student-homework.types';

/**
 * Service for Student Portal Assignment and Homework access.
 * Directly communicates with the authoritative backend through assignmentService.
 * Enforces that caller-supplied studentId cannot bypass authentication or spoof another user.
 */
class StudentHomeworkService {
  /**
   * Fetches the homework assignments assigned to the current student's active classes.
   */
  async getMyAssignments(studentId?: string): Promise<StudentHomeworkSummaryDTO[]> {
    const authIdentity = getCurrentStudentIdentity();
    const hasAuthToken = authTokenService.isAuthenticated();
    const isProd = isProductionEnvironment();

    // In production, user must be authenticated; client cannot spoof another studentId
    if (isProd && !authIdentity && !hasAuthToken) {
      return [];
    }

    const activeStudentId = isProd
      ? (authIdentity?.id || (hasAuthToken ? 'authenticated-student' : ''))
      : (studentId || authIdentity?.id || (hasAuthToken ? 'authenticated-student' : ''));

    if (!activeStudentId) return [];
    return assignmentService.getAssignmentsForStudent(activeStudentId);
  }

  /**
   * Fetches assignment detail for a specific assignment.
   */
  async getAssignmentDetail(
    assignmentId: string,
    studentId?: string
  ): Promise<StudentAssignmentDetailDTO | undefined> {
    const authIdentity = getCurrentStudentIdentity();
    const hasAuthToken = authTokenService.isAuthenticated();
    const isProd = isProductionEnvironment();

    if (isProd && !authIdentity && !hasAuthToken) {
      return undefined;
    }

    const activeStudentId = isProd
      ? (authIdentity?.id || (hasAuthToken ? 'authenticated-student' : ''))
      : (studentId || authIdentity?.id || (hasAuthToken ? 'authenticated-student' : ''));

    if (!activeStudentId) return undefined;
    return assignmentService.getStudentAssignmentDetail(assignmentId, activeStudentId);
  }

  /**
   * Fetches sanitized question runner package for the student exam runner.
   * Strictly strips all solutions and answers.
   */
  async getAssignmentRunner(
    assignmentId: string,
    studentId?: string
  ): Promise<StudentAssignmentRunnerDTO | undefined> {
    const authIdentity = getCurrentStudentIdentity();
    const hasAuthToken = authTokenService.isAuthenticated();
    const isProd = isProductionEnvironment();

    if (isProd && !authIdentity && !hasAuthToken) {
      return undefined;
    }

    const activeStudentId = isProd
      ? (authIdentity?.id || (hasAuthToken ? 'authenticated-student' : ''))
      : (studentId || authIdentity?.id || (hasAuthToken ? 'authenticated-student' : ''));

    if (!activeStudentId) return undefined;
    return assignmentService.getStudentAssignmentRunner(assignmentId, activeStudentId);
  }

  /**
   * Starts a real homework attempt and receives submissionId.
   */
  async startAttempt(assignmentId: string): Promise<any> {
    return assignmentService.startStudentHomework(assignmentId);
  }

  /**
   * Submits answers and receives immediate grading and feedback.
   */
  async submitHomework(submissionId: string, answers: any[], timeSpentSeconds: number): Promise<any> {
    return assignmentService.submitStudentHomework(submissionId, answers, timeSpentSeconds);
  }

  /**
   * Retrieves results and teacher feedback for a completed submission.
   */
  async getResult(submissionId: string): Promise<any> {
    return assignmentService.getStudentHomeworkResult(submissionId);
  }
}

export const studentHomeworkService = new StudentHomeworkService();
