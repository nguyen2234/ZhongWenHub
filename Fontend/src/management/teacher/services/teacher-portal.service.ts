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

class TeacherPortalService {
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

  private enrolledClassesCache = new Map<string, StudentEnrolledClassDTO>();

  async getMyEnrolledClasses(): Promise<StudentEnrolledClassDTO[]> {
    const res = await fetch(getApiUrl('/teacher/my-enrolled-classes'), {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (res.status === 401) {
      authTokenService.clearTokens();
      throw new Error('Phiên đăng nhập đã hết hạn.');
    }

    if (!res.ok) {
      const detail = await extractErrorDetail(res, 'Không thể tải danh sách lớp học của bạn.');
      throw new Error(detail);
    }

    const data: StudentEnrolledClassDTO[] = await res.json();
    for (const c of data) {
      this.enrolledClassesCache.set(c.id, c);
    }
    return data;
  }

  /* ==========================================================================
     6. STUDENT CLASS COMPATIBILITY & MOCK ADAPTERS
     ========================================================================== */

  async getActiveClassIdsForStudentAsync(studentId: string): Promise<string[]> {
    if (authTokenService.getAccessToken()) {
      try {
        const enrolled = await this.getMyEnrolledClasses();
        // Return real enrolled class IDs directly (fail-closed, no mock fallback)
        return enrolled.map((c) => c.id);
      } catch (err) {
        console.warn('[TeacherPortalService] Failed to load real enrolled classes for student:', err);
        // Fail-closed for real authenticated sessions: do not inject fake mock classes
        const isRealGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
        if (isRealGuid) {
          return [];
        }
      }
    }
    // Only in unauthenticated dev/demo mode, fallback to in-memory membersStore
    return this.getActiveClassIdsForStudent(studentId);
  }

  getActiveClassIdsForStudent(studentId: string): string[] {
    return membersStore
      .filter((m) => m.studentId === studentId && m.status === 'ACTIVE')
      .map((m) => m.classId);
  }

  getClassBasicInfo(classId: string): { id: string; name: string; code: string; hskLevelId: string } | undefined {
    const cached = this.enrolledClassesCache.get(classId);
    if (cached) {
      return {
        id: cached.id,
        name: cached.name,
        code: cached.code,
        hskLevelId: cached.hskLevelId,
      };
    }
    // In authenticated session, if not in cache, do NOT fallback to mock classesStore!
    if (authTokenService.getAccessToken()) {
      return undefined;
    }
    const cls = classesStore.find((c) => c.id === classId);
    if (!cls) return undefined;
    return {
      id: cls.id,
      name: cls.name,
      code: cls.code,
      hskLevelId: cls.hskLevelId,
    };
  }

  async getClassBasicInfoAsync(classId: string): Promise<{ id: string; name: string; code: string; hskLevelId: string } | undefined> {
    const cached = this.getClassBasicInfo(classId);
    if (cached) return cached;

    if (authTokenService.getAccessToken()) {
      try {
        const detail = await this.getClassById(classId);
        if (detail && detail.classInfo) {
          const info = {
            id: detail.classInfo.id,
            name: detail.classInfo.name,
            code: detail.classInfo.code,
            hskLevelId: detail.classInfo.hskLevelId,
          };
          this.enrolledClassesCache.set(classId, {
            id: info.id,
            name: info.name,
            code: info.code,
            hskLevelId: info.hskLevelId,
            hskLevelName: detail.hskLevel?.name || info.hskLevelId,
            hskLevelColor: detail.hskLevel?.colorToken || '#4338ca',
            teacherId: detail.classInfo.teacherId,
            teacherName: '',
            teacherEmail: '',
            status: detail.classInfo.status,
            locationType: detail.classInfo.locationType,
            startDate: detail.classInfo.startDate,
            schedulesSummary: '',
            enrolledAt: '',
            memberStatus: 'ACTIVE',
          });
          return info;
        }
      } catch (err) {
        console.warn(`[TeacherPortalService] Failed to fetch class basic info for ${classId}:`, err);
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
