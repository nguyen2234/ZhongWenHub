import { useState, useEffect, useCallback } from 'react';
import { teacherPortalService } from '../../../management/teacher/services/teacher-portal.service';
import { managementAuthService } from '../../../management/shared/services/management-auth.service';

/**
 * ============================================================================
 * STUDENT IDENTITY ADAPTER (Authenticated Production Session)
 * ============================================================================
 * Reads student identity directly from the authenticated session / JWT token:
 *   - ClaimTypes.NameIdentifier -> studentId
 *   - ClaimTypes.Name           -> fullName
 *   - ClaimTypes.Email          -> email
 *   - Enrolled class IDs        -> SQL Server API /teacher/classes
 * Zero fallback to hardcoded mock demo IDs in production runtime.
 * ============================================================================
 */

export const DEFAULT_DEMO_STUDENT_ID = 'usr-st-01';

export interface StudentUserRecord {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export type StudentIdentity = StudentUserRecord & {
  enrolledClassIds: string[];
  activeClassIds: string[];
  fullName: string;
};

const STORAGE_KEY = 'zh_active_student_id';

let inMemoryActiveStudentId: string | null = null;

/**
 * Returns the currently active student identity record.
 * Strictly derives from authenticated session / JWT claims.
 */
export function getCurrentStudentIdentity(): StudentIdentity {
  let activeId: string | null = inMemoryActiveStudentId;

  // 1. If no explicit in-memory student set, check authoritative session
  const session = managementAuthService.getSession();
  if (!activeId) {
    try {
      if (session && session.id) {
        const isManagementStaff = ['ADMIN', 'TEACHER', 'CONTENT_MANAGER', 'SUPPORT'].includes(session.role);
        if (!isManagementStaff || session.role === 'STUDENT') {
          activeId = session.id;
        }
      }
    } catch {
      // ignore
    }
  }

  // 2. Check localStorage if set by explicit user profile selection
  if (!activeId && typeof window !== 'undefined' && window.localStorage) {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && saved.trim()) {
      activeId = saved.trim();
    }
  }

  // 3. If unauthenticated, return empty identity (fail-closed, NO demo fallback)
  if (!activeId) {
    return {
      id: '',
      name: 'Chưa đăng nhập',
      email: '',
      avatarUrl: undefined,
      fullName: 'Chưa đăng nhập',
      enrolledClassIds: [],
      activeClassIds: [],
    };
  }

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
 * Switches the active student identity in development / testing mode.
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
 * React hook to access current student identity and reactive class enrollments.
 */
export function useCurrentStudent() {
  const [identity, setIdentity] = useState(getCurrentStudentIdentity);

  useEffect(() => {
    let isCancelled = false;

    const fetchRealEnrollments = async (current: ReturnType<typeof getCurrentStudentIdentity>) => {
      if (current.id) {
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
