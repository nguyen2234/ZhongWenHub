import { useState, useEffect, useCallback } from 'react';
import { MOCK_STUDENTS_STORE, type MockStudentUser } from '../../../management/teacher/data/mockTeacherPortalData';
import { teacherPortalService } from '../../../management/teacher/services/teacher-portal.service';
import { managementAuthService } from '../../../management/shared/services/management-auth.service';

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

let inMemoryActiveStudentId: string | null = null;

/**
 * Returns the currently active student identity record.
 */
export function getCurrentStudentIdentity(): MockStudentUser & {
  enrolledClassIds: string[];
  activeClassIds: string[];
  fullName: string;
} {
  let activeId: string | null = inMemoryActiveStudentId;

  // 1. If no explicit in-memory student set, check authoritative session
  if (!activeId) {
    try {
      const session = managementAuthService.getSession();
      if (session && session.id) {
        // Only use session if it's a student or a custom authenticated user (not a pure staff/management session)
        const isManagementStaff = ['ADMIN', 'TEACHER', 'CONTENT_MANAGER', 'SUPPORT'].includes(session.role);
        if (!isManagementStaff || session.role === 'STUDENT') {
          activeId = session.id;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Check localStorage if still not resolved
  if (!activeId && typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      activeId = saved.trim();
    }
  }

  // 3. Fallback to default demo student if unauthenticated/unselected
  if (!activeId) {
    activeId = DEFAULT_DEMO_STUDENT_ID;
  }

  // Check if activeId is one of the mock students in teacher portal
  const mockStudent = MOCK_STUDENTS_STORE.find((s) => s.id === activeId);
  if (mockStudent) {
    const enrolledClassIds = teacherPortalService.getActiveClassIdsForStudent(mockStudent.id);
    return {
      ...mockStudent,
      fullName: mockStudent.name,
      enrolledClassIds,
      activeClassIds: enrolledClassIds,
    };
  }

  // Real or registered custom user session
  const session = managementAuthService.getSession();
  return {
    id: activeId,
    name: session?.name || 'Học viên',
    email: session?.email || '',
    avatarUrl: session?.avatarUrl,
    fullName: session?.name || 'Học viên',
    enrolledClassIds: [],
    activeClassIds: [],
  };
}

/**
 * Switches the active student identity in development mode.
 * Dispatches an event so all listening components update synchronously.
 */
export function setDevStudentIdentity(studentId: string): void {
  if (!studentId || !studentId.trim()) return;

  const cleanId = studentId.trim();
  inMemoryActiveStudentId = cleanId;

  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.setItem(STORAGE_KEY, cleanId);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zh_student_identity_changed', { detail: { studentId: cleanId } }));
  }
}

/**
 * Clears active student identity on logout or account switch.
 */
export function clearStudentIdentity(): void {
  inMemoryActiveStudentId = null;
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  teacherPortalService.clearEnrolledClassesCache();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('zh_student_identity_changed', { detail: { studentId: null } }));
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
    let isCancelled = false;

    const fetchRealEnrollments = async (current: ReturnType<typeof getCurrentStudentIdentity>) => {
      const isMockStudent = MOCK_STUDENTS_STORE.some((s) => s.id === current.id);
      if (!isMockStudent && current.id) {
        try {
          const classIds = await teacherPortalService.getActiveClassIdsForStudentAsync(current.id);
          if (!isCancelled) {
            setIdentity((prev) => {
              if (prev.id !== current.id) return prev;
              return {
                ...prev,
                enrolledClassIds: classIds,
                activeClassIds: classIds,
              };
            });
          }
        } catch {
          // ignore
        }
      }
    };

    fetchRealEnrollments(identity);

    const handler = () => {
      const next = getCurrentStudentIdentity();
      setIdentity(next);
      fetchRealEnrollments(next);
    };

    window.addEventListener('zh_student_identity_changed', handler);
    window.addEventListener('storage', handler);

    return () => {
      isCancelled = true;
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
