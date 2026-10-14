import { assignmentService } from '../../../management/teacher/services/assignment.service';
import { getCurrentStudentIdentity } from '../../auth/services/student-identity.adapter';
import type {
  StudentHomeworkSummaryDTO,
  StudentAssignmentDetailDTO,
  StudentAssignmentRunnerDTO,
} from '../types/student-homework.types';

/**
 * Service for Student Portal Assignment and Homework access.
 * Directly delegates to the authoritative single-source-of-truth assignmentService
 * without creating duplicate mock stores.
 */
class StudentHomeworkService {
  /**
   * Fetches the homework assignments assigned to the current student's active classes.
   */
  async getMyAssignments(studentId?: string): Promise<StudentHomeworkSummaryDTO[]> {
    const activeStudentId = studentId || getCurrentStudentIdentity().id;
    return assignmentService.getAssignmentsForStudent(activeStudentId);
  }

  /**
   * Fetches assignment detail for a specific assignment, ensuring student has enrollment rights.
   */
  async getAssignmentDetail(
    assignmentId: string,
    studentId?: string
  ): Promise<StudentAssignmentDetailDTO | undefined> {
    const activeStudentId = studentId || getCurrentStudentIdentity().id;
    return assignmentService.getStudentAssignmentDetail(assignmentId, activeStudentId);
  }

  /**
   * Fetches sanitized question runner package for the student exam runner.
   * Strips all solutions and answers.
   */
  async getAssignmentRunner(
    assignmentId: string,
    studentId?: string
  ): Promise<StudentAssignmentRunnerDTO | undefined> {
    const activeStudentId = studentId || getCurrentStudentIdentity().id;
    return assignmentService.getStudentAssignmentRunner(assignmentId, activeStudentId);
  }
}

export const studentHomeworkService = new StudentHomeworkService();
