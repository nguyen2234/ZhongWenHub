import { useState, useEffect, useCallback } from 'react';
import { MOCK_STUDENTS_STORE, type MockStudentUser } from '../../../management/teacher/data/mockTeacherPortalData';
import { teacherPortalService } from '../../../management/teacher/services/teacher-portal.service';
import { managementAuthService } from '../../../management/shared/services/management-auth.service';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import { defaultApiConfig, isProductionEnvironment } from '../../../core/api/client/api-config';

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

export type StudentIdentity = MockStudentUser & {
  enrolledClassIds: string[];
  activeClassIds: string[];
  fullName: string;
};

/**
 * Returns the currently active student identity record, or null if unauthenticated.
 * In production mode or when unauthenticated, strictly returns null and never resurrects demo student.
 */
export function getCurrentStudentIdentity(): StudentIdentity | null {
  const isProd = isProductionEnvironment();
  const session = managementAuthService.getSession();
  const hasAuthToken = authTokenService.isAuthenticated();

  let activeId: string | null = null;

  // 1. Authoritative check: management session (populated by login / AuthContext)
  if (session && session.id) {
    const isManagementStaff = ['ADMIN', 'TEACHER', 'CONTENT_MANAGER', 'SUPPORT'].includes(session.role);
    if (!isManagementStaff || session.role === 'STUDENT') {
      activeId = session.id;
    }
  }

  // 2. In-memory override (e.g. set by setDevStudentIdentity during login or test fixtures)
  if (!activeId && inMemoryActiveStudentId) {
    // In production, only accept in-memory student if a valid auth token is active
    if (!isProd || hasAuthToken) {
      activeId = inMemoryActiveStudentId;
    }
  }

  // 3. Fallback for non-production development/mock mode only
  // NEVER use localStorage as independent auth proof in production.
  if (!activeId && !isProd && defaultApiConfig.useMock) {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const saved = window.localStorage.getItem(STORAGE_KEY);
        if (saved && saved.trim()) {
          activeId = saved.trim();
        }
      } catch {
        // ignore
      }
    }
  }

  // 4. If unauthenticated, return null. NEVER fall back to demo student.
  if (!activeId) {
    return null;
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

  // Only persist to localStorage in non-production/mock environments
  if (!isProductionEnvironment() && typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, cleanId);
    } catch {
      // ignore
    }
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
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
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
  const [identity, setIdentity] = useState<StudentIdentity | null>(getCurrentStudentIdentity);

  useEffect(() => {
    let isCancelled = false;

    const fetchRealEnrollments = async (current: StudentIdentity | null) => {
      if (!current || !current.id) return;
      const isMockStudent = MOCK_STUDENTS_STORE.some((s) => s.id === current.id);
      if (!isMockStudent && current.id) {
        try {
          const classIds = await teacherPortalService.getActiveClassIdsForStudentAsync(current.id);
          if (!isCancelled) {
            setIdentity((prev) => {
              if (!prev || prev.id !== current.id) return prev;
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
    studentId: identity?.id ?? null,
    studentName: identity?.name ?? null,
    studentEmail: identity?.email ?? null,
    avatarUrl: identity?.avatarUrl,
    enrolledClassIds: identity?.enrolledClassIds ?? [],
    switchStudent,
  };
}
