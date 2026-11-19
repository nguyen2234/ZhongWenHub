import { curriculumService } from '../../admin/content/services/curriculum.service';
import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { PaginatedResponse } from '../../shared/types';
import { authTokenService } from '../../../core/api/client/auth-token.service';
import {
  CURRENT_TEACHER_EMAIL,
  CURRENT_TEACHER_ID,
  CURRENT_TEACHER_NAME,
  INITIAL_CLASS_MEMBERS,
  INITIAL_CLASS_SCHEDULES,
  INITIAL_DEMO_SUBMISSIONS,
  INITIAL_QUICK_ACTIONS,
  INITIAL_RECENT_ACTIVITIES,
  INITIAL_TEACHING_CLASSES,
} from '../data/mockTeacherPortalData';
import type {
  ClassDetailDTO,
  ClassFilters,
  ClassMember,
  ClassMemberViewDTO,
  ClassSchedule,
  ClassSort,
  ClassSummaryDTO,
  CreateTeachingClassDTO,
  StudentEnrolledClassDTO,
  TeacherClassStatsDTO,
  TeachingClass,
  UpdateTeachingClassDTO,
} from '../types/class.types';
import { DAY_OF_WEEK_LABELS } from '../types/class.types';
import type {
  TeacherDashboardDTO,
  UpcomingTeachingSession,
} from '../types/dashboard.types';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

function getAuthHeaders(): HeadersInit {
  const token = authTokenService.getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function extractErrorDetail(res: Response, fallbackMessage: string): Promise<string> {
  try {
    const json = await res.json();
    return json.detail || json.title || json.message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

// In-memory test store for test fixtures and backwards-compatibility
const classesStore: TeachingClass[] = [...INITIAL_TEACHING_CLASSES];
const membersStore: ClassMember[] = [...INITIAL_CLASS_MEMBERS];
const schedulesStore: ClassSchedule[] = [...INITIAL_CLASS_SCHEDULES];
const submissionsStore = [...INITIAL_DEMO_SUBMISSIONS];
const activitiesStore = [...INITIAL_RECENT_ACTIVITIES];

/**
 * Safely decodes JWT payload to extract user identity (sub or nameid),
 * or keys mock/opaque test tokens without generic shared collision.
 */
function resolveSessionUserId(token: string | null): string | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length === 3) {
      const base64Url = parts[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonStr = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonStr);
      const sub =
        payload.sub ||
        payload.nameid ||
        payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'];
      if (sub && typeof sub === 'string') {
        return `user:${sub}`;
      }
    }
  } catch {
    // If not a standard JWT structure, fall through
  }
  return `token:${token}`;
}

class TeacherPortalService {
  private enrolledClassesCacheByUser = new Map<string, Map<string, StudentEnrolledClassDTO>>();
  private sessionEpoch = 0;

  constructor() {
    authTokenService.onExpired(() => {
      this.clearEnrolledClassesCache();
    });
    if (typeof window !== 'undefined') {
      window.addEventListener('zh_student_identity_changed', () => {
        this.clearEnrolledClassesCache();
      });
      window.addEventListener('storage', (e) => {
        if (e.key === 'zhongwenhub_auth_session' || e.key === 'zh_active_student_id') {
          this.clearEnrolledClassesCache();
        }
      });
    }
  }

  getCurrentSessionUserId(): string | null {
    const token = authTokenService.getAccessToken();
    return resolveSessionUserId(token);
  }

  clearEnrolledClassesCache(userId?: string): void {
    if (userId) {
      this.enrolledClassesCacheByUser.delete(userId);
    } else {
      this.enrolledClassesCacheByUser.clear();
    }
    this.sessionEpoch++;
  }

  private isDemoOrTestMode(): boolean {
    if ((globalThis as any).process?.env?.NODE_ENV === 'test') {
      return true;
    }
    if (typeof window !== 'undefined' && (window as any).__ZWH_DEMO_MODE__) {
      return true;
    }
    if (import.meta.env?.DEV || import.meta.env?.MODE === 'test') {
      return true;
    }
    return false;
  }

  getCurrentTeacherId(): string {
    return CURRENT_TEACHER_ID;
  }

  /* ==========================================================================
     1. DASHBOARD SERVICE
     ========================================================================== */

  async getDashboard(): Promise<TeacherDashboardDTO> {
    const res = await fetch(getApiUrl('/teacher/dashboard'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (res.status === 403) {
      throw new Error('Bạn không có quyền truy cập trang tổng quan Giảng viên (yêu cầu vai trò Teacher hoặc Admin).');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Đã xảy ra lỗi khi tải dữ liệu bảng điều khiển giảng viên.');
      throw new Error(detail);
    }

    const data = await res.json();
    return data as TeacherDashboardDTO;
  }

  /* ==========================================================================
     2. CLASS MANAGEMENT (CRUD)
     ========================================================================== */

  async getClasses(
    filters: ClassFilters,
    pagination: { page: number; pageSize: number },
    sort?: ClassSort
  ): Promise<PaginatedResponse<ClassSummaryDTO>> {
    const params = new URLSearchParams({
      page: String(pagination.page),
      pageSize: String(pagination.pageSize),
    });
    if (filters.search) params.append('search', filters.search);
    if (filters.hskLevelId && filters.hskLevelId !== 'ALL') params.append('hskLevelId', filters.hskLevelId);
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status);
    if (filters.locationType && filters.locationType !== 'ALL') params.append('locationType', filters.locationType);
    if (sort) {
      params.append('sortField', sort.field);
      params.append('sortDirection', sort.direction);
    }

    const res = await fetch(getApiUrl(`/teacher/classes?${params.toString()}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (res.status === 403) {
      throw new Error('Bạn không có quyền xem danh sách lớp học (yêu cầu vai trò Teacher hoặc Admin).');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải danh sách lớp học.');
      throw new Error(detail);
    }

    const json = await res.json();
    const pageNumber = json.pageNumber || json.page || pagination.page;
    return {
      items: json.items || [],
      totalItems: json.totalItems || 0,
      currentPage: pageNumber,
      page: pageNumber,
      pageSize: json.pageSize || pagination.pageSize,
      totalPages: json.totalPages || Math.ceil((json.totalItems || 0) / pagination.pageSize) || 1,
    };
  }

  async getClassStats(): Promise<TeacherClassStatsDTO> {
    const res = await fetch(getApiUrl('/teacher/classes/stats'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (res.status === 403) {
      throw new Error('Bạn không có quyền xem thống kê lớp học.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải thống kê lớp học.');
      throw new Error(detail);
    }

    return await res.json();
  }

  async getClassById(id: string): Promise<ClassDetailDTO> {
    const res = await fetch(getApiUrl(`/teacher/classes/${id}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
    }

    if (res.status === 403) {
      throw new Error('Bạn không có quyền xem chi tiết lớp học này.');
    }

    if (res.status === 404) {
      throw new Error(`Không tìm thấy lớp học với mã '${id}'.`);
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải chi tiết lớp học.');
      throw new Error(detail);
    }

    const detail = await res.json();
    const level = hskRepositoryService.getLevelById(detail.classInfo?.hskLevelId);
    const course = detail.classInfo?.courseId ? curriculumService.getCourseById(detail.classInfo.courseId) : undefined;
    return {
      classInfo: detail.classInfo,
      hskLevel: level,
      course: course,
      derivedEnrollmentCount: detail.derivedEnrollmentCount ?? 0,
      derivedAttendanceAverage: detail.derivedAttendanceAverage ?? 100.0,
      schedules: (detail.schedules || []).map((s: any) => ({
        id: s.id,
        classId: s.classId || detail.classInfo.id,
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
        timezone: s.timezone || 'Asia/Ho_Chi_Minh',
        locationType: s.locationType || 'ONLINE',
        meetingUrl: s.meetingUrl,
        roomLocation: s.roomLocation,
      })),
      membersSummary: detail.membersSummary || {
        total: detail.derivedEnrollmentCount || 0,
        active: detail.derivedEnrollmentCount || 0,
        paused: 0,
        dropped: 0,
      },
    };
  }

  async createClass(payload: CreateTeachingClassDTO): Promise<TeachingClass> {
    const res = await fetch(getApiUrl('/teacher/classes'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tạo lớp học.');
      throw new Error(detail);
    }

    const created = await res.json();
    classesStore.unshift(created);
    return created;
  }

  async updateClass(id: string, payload: UpdateTeachingClassDTO): Promise<TeachingClass> {
    const res = await fetch(getApiUrl(`/teacher/classes/${id}`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể cập nhật thông tin lớp học.');
      throw new Error(detail);
    }

    const updated = await res.json();
    const idx = classesStore.findIndex((c) => c.id === id);
    if (idx >= 0) {
      classesStore[idx] = { ...classesStore[idx], ...updated };
    }
    return updated;
  }

  async archiveClass(id: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/teacher/classes/${id}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể lưu trữ lớp học.');
      throw new Error(detail);
    }

    const idx = classesStore.findIndex((c) => c.id === id);
    if (idx >= 0) {
      classesStore[idx].status = 'ARCHIVED';
    }
    return true;
  }

  /* ==========================================================================
     3. MEMBERS MANAGEMENT
     ========================================================================== */

  async getClassMembers(
    classId: string,
    search?: string,
    status?: string
  ): Promise<ClassMemberViewDTO[]> {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);

    const res = await fetch(getApiUrl(`/teacher/classes/${classId}/members?${params.toString()}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (res.status === 403) {
      throw new Error('Bạn không có quyền xem danh sách học viên của lớp này.');
    }

    if (res.status === 404) {
      throw new Error('Không tìm thấy lớp học.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải danh sách học viên.');
      throw new Error(detail);
    }

    return await res.json();
  }

  async addStudentToClass(
    classId: string,
    studentIdentifier: string,
    notes?: string
  ): Promise<ClassMemberViewDTO> {
    const res = await fetch(getApiUrl(`/teacher/classes/${classId}/members`), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ studentIdentifier, notes }),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể ghi danh học viên.');
      throw new Error(detail);
    }

    return await res.json();
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/teacher/classes/${classId}/members/${studentId}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể xóa học viên khỏi lớp học.');
      throw new Error(detail);
    }

    return true;
  }

  /* ==========================================================================
     4. SCHEDULES
     ========================================================================== */

  async getClassSchedules(classId: string): Promise<ClassSchedule[]> {
    const res = await fetch(getApiUrl(`/teacher/classes/${classId}/schedules`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (res.status === 403) {
      throw new Error('Bạn không có quyền xem thời khóa biểu lớp này.');
    }

    if (res.status === 404) {
      throw new Error('Không tìm thấy lớp học.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải thời khóa biểu.');
      throw new Error(detail);
    }

    return await res.json();
  }

  async updateClassSchedules(classId: string, schedules: ClassSchedule[]): Promise<ClassSchedule[]> {
    const res = await fetch(getApiUrl(`/teacher/classes/${classId}/schedules`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(schedules),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể cập nhật thời khóa biểu.');
      throw new Error(detail);
    }

    return await res.json();
  }

  /* ==========================================================================
     5. STUDENT ENROLLED CLASSES (REAL BACKEND INTEGRATION)
     ========================================================================== */

  async getMyEnrolledClasses(_ignoredStudentId?: string): Promise<StudentEnrolledClassDTO[]> {
    const tokenAtStart = authTokenService.getAccessToken();
    const epochAtStart = this.sessionEpoch;
    const sessionUserIdAtStart = this.getCurrentSessionUserId();

    const res = await fetch(getApiUrl('/teacher/my-enrolled-classes'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      this.clearEnrolledClassesCache();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải danh sách lớp học của bạn.');
      throw new Error(detail);
    }

    const data: StudentEnrolledClassDTO[] = await res.json();

    if (!Array.isArray(data)) {
      throw new Error(
        'Dữ liệu lớp học từ máy chủ không đúng định dạng danh sách (StudentEnrolledClassDTO[]).'
      );
    }

    // RACE CONDITION & TOKEN CHANGE GUARD:
    // If the token or session epoch changed while the request was in-flight,
    // do NOT write into the new/stale cache.
    const currentToken = authTokenService.getAccessToken();
    if (
      !tokenAtStart ||
      currentToken !== tokenAtStart ||
      this.sessionEpoch !== epochAtStart ||
      !sessionUserIdAtStart
    ) {
      return data;
    }

    let userCache = this.enrolledClassesCacheByUser.get(sessionUserIdAtStart);
    if (!userCache) {
      userCache = new Map<string, StudentEnrolledClassDTO>();
      this.enrolledClassesCacheByUser.set(sessionUserIdAtStart, userCache);
    }
    for (const c of data) {
      userCache.set(c.id, c);
    }
    return data;
  }

  async getMyEnrolledClassById(classId: string, _ignoredStudentId?: string): Promise<StudentEnrolledClassDTO> {
    const tokenAtStart = authTokenService.getAccessToken();
    const epochAtStart = this.sessionEpoch;
    const sessionUserIdAtStart = this.getCurrentSessionUserId();

    const res = await fetch(getApiUrl(`/teacher/my-enrolled-classes/${classId}`), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      this.clearEnrolledClassesCache();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (res.status === 403) {
      throw new Error('Bạn không có quyền xem thông tin lớp học này.');
    }

    if (res.status === 404) {
      throw new Error(`Không tìm thấy lớp học '${classId}' hoặc bạn chưa được ghi danh.`);
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải thông tin lớp học.');
      throw new Error(detail);
    }

    const data: StudentEnrolledClassDTO = await res.json();

    if (!data || typeof data !== 'object' || !('id' in data)) {
      throw new Error(
        'Dữ liệu chi tiết lớp học từ máy chủ không đúng định dạng (StudentEnrolledClassDTO).'
      );
    }

    // RACE CONDITION & TOKEN CHANGE GUARD:
    const currentToken = authTokenService.getAccessToken();
    if (
      !tokenAtStart ||
      currentToken !== tokenAtStart ||
      this.sessionEpoch !== epochAtStart ||
      !sessionUserIdAtStart
    ) {
      return data;
    }

    let userCache = this.enrolledClassesCacheByUser.get(sessionUserIdAtStart);
    if (!userCache) {
      userCache = new Map<string, StudentEnrolledClassDTO>();
      this.enrolledClassesCacheByUser.set(sessionUserIdAtStart, userCache);
    }
    userCache.set(data.id, data);
    return data;
  }

  /* ==========================================================================
     6. STUDENT CLASS COMPATIBILITY & MOCK ADAPTERS
     ========================================================================== */

  async getActiveClassIdsForStudentAsync(studentId: string): Promise<string[]> {
    if (authTokenService.getAccessToken()) {
      // Must query real student-scoped API.
      // If student has 0 classes enrolled, returns [] (Empty State).
      // If API fails (500, network error), throws error so callers can render Error State!
      const enrolled = await this.getMyEnrolledClasses();
      return enrolled.map((c) => c.id);
    }
    // Only in unauthenticated dev/demo mode, fallback to in-memory membersStore
    if (this.isDemoOrTestMode()) {
      return this.getActiveClassIdsForStudent(studentId);
    }
    return [];
  }

  getActiveClassIdsForStudent(studentId: string): string[] {
    return membersStore
      .filter((m) => m.studentId === studentId && m.status === 'ACTIVE')
      .map((m) => m.classId);
  }

  getClassBasicInfo(classId: string, _ignoredStudentId?: string): { id: string; name: string; code: string; hskLevelId: string } | undefined {
    const sessionUserId = this.getCurrentSessionUserId();
    if (sessionUserId) {
      // Authenticated session: Look ONLY in this user's isolated cache.
      // Strictly NEVER iterate other users' caches!
      const userCache = this.enrolledClassesCacheByUser.get(sessionUserId);
      const cached = userCache?.get(classId);
      if (cached) {
        return {
          id: cached.id,
          name: cached.name,
          code: cached.code,
          hskLevelId: cached.hskLevelId,
        };
      }
      // If authenticated but not found in current user's cache: strictly return undefined (no mock fallback).
      return undefined;
    }

    // Unauthenticated session:
    // Only allow mock fallback in explicit demo/test mode.
    if (this.isDemoOrTestMode()) {
      const cls = classesStore.find((c) => c.id === classId);
      if (!cls) return undefined;
      return {
        id: cls.id,
        name: cls.name,
        code: cls.code,
        hskLevelId: cls.hskLevelId,
      };
    }

    // In production runtime when not authenticated: strictly undefined.
    return undefined;
  }

  async getClassBasicInfoAsync(classId: string, _ignoredStudentId?: string): Promise<{ id: string; name: string; code: string; hskLevelId: string } | undefined> {
    const cached = this.getClassBasicInfo(classId);
    if (cached) return cached;

    if (authTokenService.getAccessToken()) {
      try {
        // Students fetch class metadata from student-scoped endpoint, NEVER teacher management endpoint!
        const enrolled = await this.getMyEnrolledClassById(classId);
        if (enrolled) {
          return {
            id: enrolled.id,
            name: enrolled.name,
            code: enrolled.code,
            hskLevelId: enrolled.hskLevelId,
          };
        }
      } catch (err: any) {
        // If 404 or 403 (student not enrolled in this class), return undefined without mock fallback
        if (
          err?.message?.includes('404') ||
          err?.message?.includes('403') ||
          err?.message?.includes('chưa được ghi danh') ||
          err?.message?.includes('không có quyền')
        ) {
          return undefined;
        }
        // If 500 or network error, throw so caller handles error state!
        throw err;
      }
    }
    return undefined;
  }

  /* ==========================================================================
     7. TEST FIXTURES / MOCK FACTORIES (ISOLATED FROM PRODUCTION FLOWS)
     ========================================================================== */

  getMockDashboardForTest(): TeacherDashboardDTO {
    const teacherId = CURRENT_TEACHER_ID;
    const teacherClasses = classesStore.filter((c) => c.teacherId === teacherId);
    const activeClasses = teacherClasses.filter((c) => c.status === 'ACTIVE');

    const activeClassIds = new Set(activeClasses.map((c) => c.id));
    const activeMembers = membersStore.filter(
      (m) => activeClassIds.has(m.classId) && m.status === 'ACTIVE'
    );
    const totalEnrolledStudents = activeMembers.length;

    const teacherClassIds = new Set(teacherClasses.map((c) => c.id));
    const activeSchedules = schedulesStore.filter((s) => teacherClassIds.has(s.classId));
    let weeklyTeachingHours = 0;
    activeSchedules.forEach((sch) => {
      const [startH, startM] = sch.startTime.split(':').map(Number);
      const [endH, endM] = sch.endTime.split(':').map(Number);
      const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
      if (durationHours > 0) weeklyTeachingHours += durationHours;
    });

    const upcomingSessions = this.buildUpcomingSessionsForTest(activeClasses);
    const activeClassSummaries = activeClasses.map((cls) => this.toClassSummaryDTOForTest(cls));

    return {
      teacherId,
      teacherName: CURRENT_TEACHER_NAME,
      teacherEmail: CURRENT_TEACHER_EMAIL,
      metrics: {
        activeClassesCount: activeClasses.length,
        totalEnrolledStudents,
        pendingSubmissionsCount: submissionsStore.length,
        weeklyTeachingHours: Math.round(weeklyTeachingHours * 10) / 10,
      },
      upcomingSessions,
      activeClasses: activeClassSummaries,
      pendingSubmissions: submissionsStore,
      recentActivities: activitiesStore,
      quickActions: INITIAL_QUICK_ACTIONS,
    };
  }

  private toClassSummaryDTOForTest(cls: TeachingClass): ClassSummaryDTO {
    const level = hskRepositoryService.getLevelById(cls.hskLevelId);
    const hskLevelName = level ? level.name : 'HSK';
    const hskLevelColor = level?.colorToken || 'var(--primary)';
    const course = cls.courseId ? curriculumService.getCourseById(cls.courseId) : undefined;
    const activeMembersCount = membersStore.filter(
      (m) => m.classId === cls.id && m.status === 'ACTIVE'
    ).length;

    const schedules = schedulesStore.filter((s) => s.classId === cls.id);
    let schedulesSummary = 'Chưa xếp lịch';
    if (schedules.length > 0) {
      const days = schedules
        .map((s) => DAY_OF_WEEK_LABELS[s.dayOfWeek]?.short || s.dayOfWeek)
        .join(', ');
      const time = schedules[0] ? `${schedules[0].startTime}–${schedules[0].endTime}` : '';
      schedulesSummary = `${days} (${time})`;
    }

    return {
      id: cls.id,
      name: cls.name,
      code: cls.code,
      description: cls.description,
      hskLevelId: cls.hskLevelId,
      hskLevelName,
      hskLevelColor,
      courseId: cls.courseId,
      courseName: course?.name,
      status: cls.status,
      capacity: cls.capacity,
      derivedEnrollmentCount: activeMembersCount,
      startDate: cls.startDate,
      endDate: cls.endDate,
      locationType: cls.locationType,
      meetingUrl: cls.meetingUrl,
      roomLocation: cls.roomLocation,
      schedulesSummary,
      nextSessionText: schedules[0] ? `Hôm nay, ${schedules[0].startTime}` : undefined,
    };
  }

  private buildUpcomingSessionsForTest(activeClasses: TeachingClass[]): UpcomingTeachingSession[] {
    const list: UpcomingTeachingSession[] = [];

    activeClasses.forEach((cls) => {
      const schedules = schedulesStore.filter((s) => s.classId === cls.id);
      const level = hskRepositoryService.getLevelById(cls.hskLevelId);
      const activeCount = membersStore.filter(
        (m) => m.classId === cls.id && m.status === 'ACTIVE'
      ).length;

      schedules.forEach((sch) => {
        const dayLabel = DAY_OF_WEEK_LABELS[sch.dayOfWeek];
        const isToday = sch.dayOfWeek === 'TUESDAY' || sch.dayOfWeek === 'WEDNESDAY';

        list.push({
          id: `up-${sch.id}`,
          classId: cls.id,
          className: cls.name,
          classCode: cls.code,
          hskLevelName: level ? level.name : 'HSK',
          hskLevelColor: level?.colorToken || '#4338ca',
          dayOfWeekText: isToday ? 'Hôm nay' : dayLabel?.full || sch.dayOfWeek,
          dateFormatted: '14/10/2026',
          timeRange: `${sch.startTime} – ${sch.endTime}`,
          locationType: sch.locationType,
          meetingUrl: sch.meetingUrl || cls.meetingUrl,
          roomLocation: sch.roomLocation || cls.roomLocation,
          enrolledStudentsCount: activeCount,
          lessonTopicPreview: cls.hskLevelId === 'level-hsk-3'
            ? 'Bài 8: Đi siêu thị mua hoa quả (水果)'
            : 'Bài học ngữ pháp theo khung chuẩn HSK',
          isToday,
        });
      });
    });

    return list.slice(0, 4);
  }
}

export const teacherPortalService = new TeacherPortalService();
