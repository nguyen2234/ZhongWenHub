import { useState, useEffect, useCallback } from 'react';
import { MOCK_STUDENTS_STORE, type MockStudentUser } from '../../../management/teacher/data/mockTeacherPortalData';
import { teacherPortalService } from '../../../management/teacher/services/teacher-portal.service';

/**
 * ============================================================================
 * STUDENT IDENTITY ADAPTER (Development & Integration Layer)
 * ============================================================================
 * Bridges the client authentication mock with the ClassMember domain store.
 *
 * In production (ASP.NET Core Web API + EF Core):
 * This adapter will be replaced by reading claims directly from the validated
 * JWT Bearer token:
 *   - ClaimTypes.NameIdentifier -> studentId
 *   - ClaimTypes.Name           -> fullName
 *   - ClaimTypes.Email          -> email
 *   - Custom claim "enrolled_classes" -> string[]
 * ============================================================================
 */

export const DEFAULT_DEMO_STUDENT_ID = 'usr-st-01'; // Trần Thị Thu Thảo (enrolled in cls-001 HSK 3 & cls-003 HSK 4)

const STORAGE_KEY = 'zh_active_student_id';

let inMemoryActiveStudentId = DEFAULT_DEMO_STUDENT_ID;

/**
 * Returns the currently active student identity record.
 */
export function getCurrentStudentIdentity(): MockStudentUser & {
  enrolledClassIds: string[];
  activeClassIds: string[];
  fullName: string;
} {
  let activeId = inMemoryActiveStudentId;

  if (typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && MOCK_STUDENTS_STORE.some((s) => s.id === saved)) {
      activeId = saved;
    }
  }

  const student = MOCK_STUDENTS_STORE.find((s) => s.id === activeId) || MOCK_STUDENTS_STORE[0];
  const enrolledClassIds = teacherPortalService.getActiveClassIdsForStudent(student.id);

  return {
    ...student,
    fullName: student.name,
    enrolledClassIds,
    activeClassIds: enrolledClassIds,
  };
}

/**
 * Switches the active student identity in development mode.
 * Dispatches an event so all listening components update synchronously.
 */
export function setDevStudentIdentity(studentId: string): void {
  const found = MOCK_STUDENTS_STORE.find((s) => s.id === studentId);
  if (!found) {
    console.warn(`[StudentIdentityAdapter] Student ID "${studentId}" not found in mock store.`);
    return;
  }

  inMemoryActiveStudentId = studentId;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, studentId);
    window.dispatchEvent(new CustomEvent('zh_student_identity_changed', { detail: { studentId } }));
  }
}

/**
 * Returns the full directory of student users available in the mock store.
 */
export function getAllAvailableStudents(): MockStudentUser[] {
  return [...MOCK_STUDENTS_STORE];
}

/**
 * React hook to access current student identity and reactive class enrollments.
 */
export function useCurrentStudent() {
  const [identity, setIdentity] = useState(getCurrentStudentIdentity);

  useEffect(() => {
    const handler = () => {
      setIdentity(getCurrentStudentIdentity());
    };

    window.addEventListener('zh_student_identity_changed', handler);
    window.addEventListener('storage', handler);

    return () => {
      window.removeEventListener('zh_student_identity_changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const switchStudent = useCallback((studentId: string) => {
    setDevStudentIdentity(studentId);
    setIdentity(getCurrentStudentIdentity());
  }, []);

  return {
    student: identity,
    studentId: identity.id,
    studentName: identity.name,
    studentEmail: identity.email,
    avatarUrl: identity.avatarUrl,
    enrolledClassIds: identity.enrolledClassIds,
    switchStudent,
  };
}
