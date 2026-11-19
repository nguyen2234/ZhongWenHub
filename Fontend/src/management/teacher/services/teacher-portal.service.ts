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
  MOCK_STUDENTS_STORE,
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
  DayOfWeek,
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

// Mutable in-memory store for fallback / legacy compatibility
let classesStore: TeachingClass[] = [...INITIAL_TEACHING_CLASSES];
let membersStore: ClassMember[] = [...INITIAL_CLASS_MEMBERS];
let schedulesStore: ClassSchedule[] = [...INITIAL_CLASS_SCHEDULES];
let submissionsStore = [...INITIAL_DEMO_SUBMISSIONS];
let activitiesStore = [...INITIAL_RECENT_ACTIVITIES];

class TeacherPortalService {
  getCurrentTeacherId(): string {
    return CURRENT_TEACHER_ID;
  }

  /* ==========================================================================
     1. DASHBOARD SERVICE
     ========================================================================== */

  async getDashboard(): Promise<TeacherDashboardDTO> {
    try {
      const res = await fetch(getApiUrl('/teacher/dashboard'), {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        return data as TeacherDashboardDTO;
      }
    } catch (err) {
      console.warn('[TeacherPortalService] API error fetching dashboard, using fallback:', err);
    }
    return this.getMockDashboard();
  }

  /* ==========================================================================
     2. CLASS MANAGEMENT (CRUD)
     ========================================================================== */

  async getClasses(
    filters: ClassFilters,
    pagination: { page: number; pageSize: number },
    sort?: ClassSort
  ): Promise<PaginatedResponse<ClassSummaryDTO>> {
    try {
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
      if (res.ok) {
        const json = await res.json();
        return {
          items: json.items || [],
          totalItems: json.totalItems || 0,
          page: json.pageNumber || json.page || pagination.page,
          pageSize: json.pageSize || pagination.pageSize,
          totalPages: json.totalPages || Math.ceil((json.totalItems || 0) / pagination.pageSize) || 1,
        };
      }
    } catch (err) {
      console.warn('[TeacherPortalService] API error fetching classes, using fallback:', err);
    }
    return this.getMockClasses(filters, pagination, sort);
  }

  async getClassById(id: string): Promise<ClassDetailDTO | undefined> {
    try {
      const res = await fetch(getApiUrl(`/teacher/classes/${id}`), {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
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
    } catch (err) {
      console.warn('[TeacherPortalService] API error fetching class by id, using fallback:', err);
    }
    return this.getMockClassById(id);
  }

  async createClass(payload: CreateTeachingClassDTO): Promise<TeachingClass> {
    const res = await fetch(getApiUrl('/teacher/classes'), {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || errJson.title || 'Không thể tạo lớp học.');
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
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || errJson.title || 'Không thể cập nhật thông tin lớp học.');
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
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || errJson.title || 'Không thể lưu trữ lớp học.');
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
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (status && status !== 'ALL') params.append('status', status);

      const res = await fetch(getApiUrl(`/teacher/classes/${classId}/members?${params.toString()}`), {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('[TeacherPortalService] API error fetching class members, using fallback:', err);
    }
    return this.getMockClassMembers(classId, search, status as any);
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
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || errJson.title || 'Không thể ghi danh học viên.');
    }
    return await res.json();
  }

  async removeStudentFromClass(classId: string, studentId: string): Promise<boolean> {
    const res = await fetch(getApiUrl(`/teacher/classes/${classId}/members/${studentId}`), {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || errJson.title || 'Không thể xóa học viên khỏi lớp học.');
    }
    return true;
  }

  /* ==========================================================================
     4. SCHEDULES
     ========================================================================== */

  getClassSchedules(classId: string): ClassSchedule[] {
    return schedulesStore
      .filter((s) => s.classId === classId)
      .map((s) => ({ ...s }));
  }

  async updateClassSchedules(classId: string, schedules: ClassSchedule[]): Promise<ClassSchedule[]> {
    const res = await fetch(getApiUrl(`/teacher/classes/${classId}/schedules`), {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(schedules),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.detail || errJson.title || 'Không thể cập nhật thời khóa biểu.');
    }
    return await res.json();
  }

  /* ==========================================================================
     5. STUDENT INTEGRATION (STRICT COMPATIBILITY)
     ========================================================================== */

  getActiveClassIdsForStudent(studentId: string): string[] {
    return membersStore
      .filter((m) => m.studentId === studentId && m.status === 'ACTIVE')
      .map((m) => m.classId);
  }

  getClassBasicInfo(classId: string): { id: string; name: string; code: string; hskLevelId: string } | undefined {
    const cls = classesStore.find((c) => c.id === classId);
    if (!cls) return undefined;
    return {
      id: cls.id,
      name: cls.name,
      code: cls.code,
      hskLevelId: cls.hskLevelId,
    };
  }

  /* ==========================================================================
     6. MOCK FALLBACK IMPLEMENTATIONS
     ========================================================================== */

  private getMockDashboard(): TeacherDashboardDTO {
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

    const upcomingSessions = this.buildUpcomingSessions(activeClasses);
    const activeClassSummaries = activeClasses.map((cls) => this.toClassSummaryDTO(cls));

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

  private getMockClasses(
    filters: ClassFilters,
    pagination: { page: number; pageSize: number },
    sort?: ClassSort
  ): PaginatedResponse<ClassSummaryDTO> {
    const teacherId = CURRENT_TEACHER_ID;
    let list = classesStore.filter((c) => c.teacherId === teacherId);

    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q)
      );
    }
    if (filters.hskLevelId !== 'ALL') {
      list = list.filter((c) => c.hskLevelId === filters.hskLevelId);
    }
    if (filters.status !== 'ALL') {
      list = list.filter((c) => c.status === filters.status);
    } else {
      list = list.filter((c) => c.status !== 'ARCHIVED');
    }
    if (filters.locationType !== 'ALL') {
      list = list.filter((c) => c.locationType === filters.locationType);
    }

    if (sort) {
      list.sort((a, b) => {
        let cmp = 0;
        switch (sort.field) {
          case 'name':
            cmp = a.name.localeCompare(b.name);
            break;
          case 'code':
            cmp = a.code.localeCompare(b.code);
            break;
          case 'startDate':
            cmp = a.startDate.localeCompare(b.startDate);
            break;
          case 'status':
            cmp = a.status.localeCompare(b.status);
            break;
          default:
            cmp = 0;
        }
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }

    const totalItems = list.length;
    const totalPages = Math.ceil(totalItems / pagination.pageSize) || 1;
    const start = (pagination.page - 1) * pagination.pageSize;
    const paginatedClasses = list.slice(start, start + pagination.pageSize);
    const items = paginatedClasses.map((cls) => this.toClassSummaryDTO(cls));

    return {
      items,
      totalItems,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
    };
  }

  private getMockClassById(id: string): ClassDetailDTO | undefined {
    const cls = classesStore.find((c) => c.id === id);
    if (!cls) return undefined;

    const level = hskRepositoryService.getLevelById(cls.hskLevelId);
    const course = cls.courseId ? curriculumService.getCourseById(cls.courseId) : undefined;
    const schedules = schedulesStore.filter((s) => s.classId === cls.id);
    const classMembers = membersStore.filter((m) => m.classId === cls.id);

    const activeMembers = classMembers.filter((m) => m.status === 'ACTIVE');
    const pausedMembers = classMembers.filter((m) => m.status === 'PAUSED');
    const droppedMembers = classMembers.filter((m) => m.status === 'DROPPED');

    const avgAttendance =
      activeMembers.length > 0
        ? activeMembers.reduce((sum, m) => sum + m.attendanceRate, 0) / activeMembers.length
        : 100;

    return {
      classInfo: { ...cls },
      hskLevel: level,
      course,
      derivedEnrollmentCount: activeMembers.length,
      derivedAttendanceAverage: Math.round(avgAttendance * 10) / 10,
      schedules,
      membersSummary: {
        total: classMembers.length,
        active: activeMembers.length,
        paused: pausedMembers.length,
        dropped: droppedMembers.length,
      },
    };
  }

  private getMockClassMembers(
    classId: string,
    search?: string,
    statusFilter?: ClassMember['status']
  ): ClassMemberViewDTO[] {
    const rawMembers = membersStore.filter((m) => m.classId === classId);

    let viewList: ClassMemberViewDTO[] = rawMembers.map((m) => {
      const studentProfile = MOCK_STUDENTS_STORE.find((s) => s.id === m.studentId);
      return {
        id: m.id,
        classId: m.classId,
        studentId: m.studentId,
        studentName: studentProfile?.name || 'Học viên ẩn danh',
        studentEmail: studentProfile?.email || 'student@zhongwenhub.edu.vn',
        studentAvatarUrl: studentProfile?.avatarUrl,
        enrolledAt: m.enrolledAt,
        status: m.status,
        attendanceRate: m.attendanceRate,
        completedAssignmentsCount: m.completedAssignmentsCount,
        notes: m.notes,
      };
    });

    if (statusFilter && statusFilter !== ('ALL' as any)) {
      viewList = viewList.filter((v) => v.status === statusFilter);
    }

    if (search && search.trim()) {
      const query = search.trim().toLowerCase();
      viewList = viewList.filter(
        (v) =>
          v.studentName.toLowerCase().includes(query) ||
          v.studentEmail.toLowerCase().includes(query)
      );
    }

    return viewList;
  }

  private toClassSummaryDTO(cls: TeachingClass): ClassSummaryDTO {
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

  private buildUpcomingSessions(activeClasses: TeachingClass[]): UpcomingTeachingSession[] {
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
