import { curriculumService } from '../../admin/content/services/curriculum.service';
import { hskRepositoryService } from '../../admin/content/services/hsk-repository.service';
import type { PaginatedResponse } from '../../shared/types';
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

// Mutable in-memory store for Teacher Portal (Shared across list, detail, and dashboard)
let classesStore: TeachingClass[] = [...INITIAL_TEACHING_CLASSES];
let membersStore: ClassMember[] = [...INITIAL_CLASS_MEMBERS];
let schedulesStore: ClassSchedule[] = [...INITIAL_CLASS_SCHEDULES];
let submissionsStore = [...INITIAL_DEMO_SUBMISSIONS];
let activitiesStore = [...INITIAL_RECENT_ACTIVITIES];

class TeacherPortalService {
  /**
   * Trả về ID của giảng viên đang đăng nhập (Centralized Mock Auth Context)
   */
  getCurrentTeacherId(): string {
    return CURRENT_TEACHER_ID;
  }

  /* ==========================================================================
     1. DASHBOARD SERVICE
     ========================================================================== */

  /**
   * Tổng hợp toàn bộ dữ liệu cho Teacher Dashboard
   */
  getDashboard(): TeacherDashboardDTO {
    const teacherId = CURRENT_TEACHER_ID;

    // Lọc các lớp thuộc quyền sở hữu của giảng viên hiện tại
    const teacherClasses = classesStore.filter((c) => c.teacherId === teacherId);
    const activeClasses = teacherClasses.filter((c) => c.status === 'ACTIVE');

    // 1. Tính toán KPIs
    // Đếm tổng số học viên active trong các lớp của giáo viên
    const activeClassIds = new Set(activeClasses.map((c) => c.id));
    const activeMembers = membersStore.filter(
      (m) => activeClassIds.has(m.classId) && m.status === 'ACTIVE'
    );
    const totalEnrolledStudents = activeMembers.length;

    // Tính tổng số giờ dạy theo lịch trong tuần
    const teacherClassIds = new Set(teacherClasses.map((c) => c.id));
    const activeSchedules = schedulesStore.filter((s) => teacherClassIds.has(s.classId));
    let weeklyTeachingHours = 0;
    activeSchedules.forEach((sch) => {
      const [startH, startM] = sch.startTime.split(':').map(Number);
      const [endH, endM] = sch.endTime.split(':').map(Number);
      const durationHours = (endH * 60 + endM - (startH * 60 + startM)) / 60;
      if (durationHours > 0) weeklyTeachingHours += durationHours;
    });

    // 2. Chuẩn bị danh sách Buổi dạy sắp diễn ra (Upcoming Sessions)
    const upcomingSessions: UpcomingTeachingSession[] = this.buildUpcomingSessions(activeClasses);

    // 3. Snapshot các lớp đang hoạt động
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
      pendingSubmissions: [...submissionsStore],
      recentActivities: [...activitiesStore],
      quickActions: [...INITIAL_QUICK_ACTIONS],
    };
  }

  /* ==========================================================================
     2. CLASS MANAGEMENT SERVICE
     ========================================================================== */

  /**
   * Lấy danh sách lớp học của giáo viên có lọc, sắp xếp và phân trang
   */
  getClasses(
    filters: ClassFilters,
    pagination: { page: number; pageSize: number },
    sort: ClassSort = { field: 'startDate', direction: 'desc' }
  ): PaginatedResponse<ClassSummaryDTO> {
    const teacherId = CURRENT_TEACHER_ID;

    // 1. Chỉ lấy lớp thuộc sở hữu của giáo viên này
    let result = classesStore.filter((c) => c.teacherId === teacherId);

    // 2. Tìm kiếm theo tên hoặc mã lớp
    if (filters.search.trim()) {
      const query = filters.search.trim().toLowerCase();
      result = result.filter(
        (c) => c.name.toLowerCase().includes(query) || c.code.toLowerCase().includes(query)
      );
    }

    // 3. Lọc theo cấp độ HSK (tham chiếu từ HskRepository)
    if (filters.hskLevelId !== 'ALL') {
      result = result.filter((c) => c.hskLevelId === filters.hskLevelId);
    }

    // 4. Lọc theo trạng thái vòng đời lớp học
    if (filters.status !== 'ALL') {
      result = result.filter((c) => c.status === filters.status);
    }

    // 5. Lọc theo hình thức đào tạo
    if (filters.locationType !== 'ALL') {
      result = result.filter((c) => c.locationType === filters.locationType);
    }

    // 6. Chuyển đổi sang ClassSummaryDTO và gắn sĩ số thực tế (derived)
    const summaries = result.map((c) => this.toClassSummaryDTO(c));

    // 7. Sắp xếp
    summaries.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'code':
          comparison = a.code.localeCompare(b.code);
          break;
        case 'startDate':
          comparison = a.startDate.localeCompare(b.startDate);
          break;
        case 'enrollment':
          comparison = a.derivedEnrollmentCount - b.derivedEnrollmentCount;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    // 8. Phân trang
    const total = summaries.length;
    const totalPages = Math.ceil(total / pagination.pageSize) || 1;
    const startIndex = (pagination.page - 1) * pagination.pageSize;
    const items = summaries.slice(startIndex, startIndex + pagination.pageSize);

    return {
      items,
      totalItems: total,
      currentPage: pagination.page,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages,
    };
  }

  /**
   * Lấy chi tiết đầy đủ của một lớp học
   */
  getClassById(classId: string): ClassDetailDTO | undefined {
    const cls = classesStore.find(
      (c) => c.id === classId && c.teacherId === CURRENT_TEACHER_ID
    );
    if (!cls) return undefined;

    // Lấy thông tin HskLevel từ HskRepositoryService
    const hskLevel = hskRepositoryService.getLevelById(cls.hskLevelId);

    // Lấy thông tin Course nếu có
    const course = cls.courseId ? curriculumService.getCourseById(cls.courseId) : undefined;

    // Lấy thời khóa biểu của lớp
    const schedules = schedulesStore.filter((s) => s.classId === cls.id);

    // Thống kê thành viên của lớp
    const classMembers = membersStore.filter((m) => m.classId === cls.id);
    const activeMembers = classMembers.filter((m) => m.status === 'ACTIVE');
    const pausedMembers = classMembers.filter((m) => m.status === 'PAUSED');
    const droppedMembers = classMembers.filter((m) => m.status === 'DROPPED');

    // Tính tỷ lệ chuyên cần trung bình
    const derivedAttendanceAverage =
      activeMembers.length > 0
        ? Math.round(
            activeMembers.reduce((sum, m) => sum + m.attendanceRate, 0) / activeMembers.length
          )
        : 100;

    return {
      classInfo: { ...cls },
      hskLevel,
      course,
      derivedEnrollmentCount: activeMembers.length,
      derivedAttendanceAverage,
      schedules: schedules.map((s) => ({ ...s })),
      membersSummary: {
        total: classMembers.length,
        active: activeMembers.length,
        paused: pausedMembers.length,
        dropped: droppedMembers.length,
      },
    };
  }

  /**
   * Tạo lớp học mới
   * Kiểm tra validation nghiêm ngặt theo yêu cầu kiến trúc.
   */
  createClass(dto: CreateTeachingClassDTO): ClassDetailDTO {
    // 1. Kiểm tra tên lớp
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new Error('Tên lớp học không được để trống.');
    }

    // 2. Kiểm tra mã lớp (phải là duy nhất)
    const trimmedCode = dto.code.trim().toUpperCase();
    if (!trimmedCode) {
      throw new Error('Mã lớp học không được để trống.');
    }
    const codeExists = classesStore.some(
      (c) => c.code.toUpperCase() === trimmedCode
    );
    if (codeExists) {
      throw new Error(`Mã lớp "${trimmedCode}" đã tồn tại trong hệ thống.`);
    }

    // 3. Kiểm tra sĩ số tối đa (> 0)
    if (!dto.capacity || dto.capacity <= 0) {
      throw new Error('Sĩ số tối đa phải lớn hơn 0.');
    }

    // 4. Kiểm tra cấp độ HSK có tồn tại trong HskRepository không
    const level = hskRepositoryService.getLevelById(dto.hskLevelId);
    if (!level) {
      throw new Error(`Cấp độ HSK "${dto.hskLevelId}" không tồn tại trong hệ thống.`);
    }

    // 5. Kiểm tra Course ID nếu có cung cấp
    if (dto.courseId) {
      const course = curriculumService.getCourseById(dto.courseId);
      if (!course) {
        throw new Error(`Khóa học giáo trình "${dto.courseId}" không tồn tại.`);
      }
    }

    // 6. Kiểm tra ngày kết thúc >= ngày bắt đầu (nếu có)
    if (dto.endDate && dto.startDate && dto.endDate < dto.startDate) {
      throw new Error('Ngày bế giảng phải diễn ra sau hoặc cùng ngày khai giảng.');
    }

    // 7. Kiểm tra URL phòng học nếu có
    if (dto.meetingUrl && !this.isValidUrl(dto.meetingUrl)) {
      throw new Error('Đường dẫn phòng học trực tuyến (Meeting URL) không hợp lệ.');
    }

    // 8. Kiểm tra lịch học (không trùng lặp và giờ bắt đầu < giờ kết thúc)
    this.validateSchedules(dto.schedules);

    // Tạo thực thể lớp mới (tự động gán teacherId của giảng viên đang đăng nhập)
    const newClassId = `cls-${Date.now()}`;
    const now = new Date().toISOString();

    const newClass: TeachingClass = {
      id: newClassId,
      teacherId: CURRENT_TEACHER_ID, // Gán bất biến từ Security Context
      name: trimmedName,
      code: trimmedCode,
      description: dto.description.trim(),
      hskLevelId: dto.hskLevelId,
      courseId: dto.courseId || undefined,
      status: 'UPCOMING', // Mặc định lớp mới tạo ở trạng thái Sắp diễn ra
      capacity: dto.capacity,
      startDate: dto.startDate,
      endDate: dto.endDate || undefined,
      locationType: dto.locationType,
      meetingUrl: dto.meetingUrl?.trim() || undefined,
      roomLocation: dto.roomLocation?.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Lưu vào store
    classesStore.unshift(newClass);

    // Lưu các bản ghi thời khóa biểu
    dto.schedules.forEach((sch, idx) => {
      schedulesStore.push({
        id: `sch-${newClassId}-${idx + 1}`,
        classId: newClassId,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        timezone: 'Asia/Ho_Chi_Minh',
        locationType: sch.locationType,
        meetingUrl: sch.meetingUrl?.trim() || undefined,
        roomLocation: sch.roomLocation?.trim() || undefined,
      });
    });

    // Thêm vào hoạt động gần đây
    activitiesStore.unshift({
      id: `act-${Date.now()}`,
      timestamp: now,
      timeAgo: 'Vừa xong',
      type: 'SYSTEM',
      title: 'Tạo lớp học mới',
      description: `Đã mở lớp ${trimmedName} (${trimmedCode}) thành công`,
      classId: newClassId,
    });

    const detail = this.getClassById(newClassId);
    if (!detail) throw new Error('Lỗi khi tải thông tin lớp vừa tạo.');
    return detail;
  }

  /**
   * Cập nhật thông tin lớp học (Tuyệt đối không sửa teacherId)
   */
  updateClass(classId: string, dto: UpdateTeachingClassDTO): ClassDetailDTO {
    const classIndex = classesStore.findIndex(
      (c) => c.id === classId && c.teacherId === CURRENT_TEACHER_ID
    );
    if (classIndex === -1) {
      throw new Error(`Không tìm thấy lớp học với mã ID: ${classId}`);
    }

    const currentClass = classesStore[classIndex];

    // 1. Kiểm tra tên
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new Error('Tên lớp học không được để trống.');
    }

    // 2. Kiểm tra HSK level
    const level = hskRepositoryService.getLevelById(dto.hskLevelId);
    if (!level) {
      throw new Error(`Cấp độ HSK "${dto.hskLevelId}" không tồn tại.`);
    }

    // 3. Kiểm tra ngày
    if (dto.endDate && dto.startDate && dto.endDate < dto.startDate) {
      throw new Error('Ngày bế giảng phải diễn ra sau hoặc cùng ngày khai giảng.');
    }

    // 4. Kiểm tra URL phòng học nếu có
    if (dto.meetingUrl && !this.isValidUrl(dto.meetingUrl)) {
      throw new Error('Đường dẫn phòng học trực tuyến (Meeting URL) không hợp lệ.');
    }

    // 5. Kiểm tra lịch học
    this.validateSchedules(dto.schedules);

    // Cập nhật thực thể (Bảo toàn teacherId, code, createdAt)
    classesStore[classIndex] = {
      ...currentClass,
      name: trimmedName,
      description: dto.description.trim(),
      hskLevelId: dto.hskLevelId,
      courseId: dto.courseId || undefined,
      capacity: dto.capacity,
      startDate: dto.startDate,
      endDate: dto.endDate || undefined,
      locationType: dto.locationType,
      meetingUrl: dto.meetingUrl?.trim() || undefined,
      roomLocation: dto.roomLocation?.trim() || undefined,
      status: dto.status || currentClass.status,
      updatedAt: new Date().toISOString(),
    };

    // Cập nhật lại thời khóa biểu (xóa cũ và lưu mới)
    schedulesStore = schedulesStore.filter((s) => s.classId !== classId);
    dto.schedules.forEach((sch, idx) => {
      schedulesStore.push({
        id: sch.id || `sch-${classId}-${idx + 1}`,
        classId,
        dayOfWeek: sch.dayOfWeek,
        startTime: sch.startTime,
        endTime: sch.endTime,
        timezone: 'Asia/Ho_Chi_Minh',
        locationType: sch.locationType,
        meetingUrl: sch.meetingUrl?.trim() || undefined,
        roomLocation: sch.roomLocation?.trim() || undefined,
      });
    });

    const detail = this.getClassById(classId);
    if (!detail) throw new Error('Lỗi khi tải thông tin lớp sau khi cập nhật.');
    return detail;
  }

  /**
   * Lưu trữ lớp học (Soft Archive - KHÔNG XÓA CỨNG)
   */
  archiveClass(classId: string): void {
    const classIndex = classesStore.findIndex(
      (c) => c.id === classId && c.teacherId === CURRENT_TEACHER_ID
    );
    if (classIndex === -1) {
      throw new Error(`Không tìm thấy lớp học với mã ID: ${classId}`);
    }

    const currentClass = classesStore[classIndex];
    classesStore[classIndex] = {
      ...currentClass,
      status: 'ARCHIVED',
      updatedAt: new Date().toISOString(),
    };

    activitiesStore.unshift({
      id: `act-${Date.now()}`,
      timestamp: new Date().toISOString(),
      timeAgo: 'Vừa xong',
      type: 'SYSTEM',
      title: 'Lưu trữ lớp học',
      description: `Đã chuyển lớp ${currentClass.name} vào kho lưu trữ`,
      classId,
    });
  }

  /* ==========================================================================
     3. CLASS MEMBERS & SCHEDULES
     ========================================================================== */

  /**
   * Lấy danh sách học viên trong một lớp (kèm hồ sơ User)
   */
  getClassMembers(
    classId: string,
    search?: string,
    statusFilter?: string
  ): ClassMemberViewDTO[] {
    let members = membersStore.filter((m) => m.classId === classId);

    if (statusFilter && statusFilter !== 'ALL') {
      members = members.filter((m) => m.status === statusFilter);
    }

    const viewList: ClassMemberViewDTO[] = members.map((m) => {
      const studentUser = MOCK_STUDENTS_STORE.find((u) => u.id === m.studentId) || {
        id: m.studentId,
        name: `Học viên (${m.studentId})`,
        email: 'hocvien@zhongwenhub.edu.vn',
      };

      return {
        id: m.id,
        classId: m.classId,
        studentId: m.studentId,
        studentName: studentUser.name,
        studentEmail: studentUser.email,
        studentAvatarUrl: studentUser.avatarUrl,
        enrolledAt: m.enrolledAt,
        status: m.status,
        attendanceRate: m.attendanceRate,
        completedAssignmentsCount: m.completedAssignmentsCount,
        notes: m.notes,
      };
    });

    if (search && search.trim()) {
      const query = search.trim().toLowerCase();
      return viewList.filter(
        (v) =>
          v.studentName.toLowerCase().includes(query) ||
          v.studentEmail.toLowerCase().includes(query)
      );
    }

    return viewList;
  }

  /**
   * Lấy danh sách lịch học của một lớp
   */
  getClassSchedules(classId: string): ClassSchedule[] {
    return schedulesStore
      .filter((s) => s.classId === classId)
      .map((s) => ({ ...s }));
  }

  /**
   * Lấy danh sách ID các lớp học mà học viên đang theo học ở trạng thái ACTIVE.
   * Phục vụ truy vấn bài tập về nhà và kiểm tra quyền truy cập (Cross-module Student Integration).
   */
  getActiveClassIdsForStudent(studentId: string): string[] {
    return membersStore
      .filter((m) => m.studentId === studentId && m.status === 'ACTIVE')
      .map((m) => m.classId);
  }

  /**
   * Lấy thông tin tóm tắt cơ bản của lớp học (phục vụ hiển thị nhãn lớp cho học viên).
   */
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
     4. PRIVATE HELPERS
     ========================================================================== */

  /**
   * Chuyển TeachingClass sang ClassSummaryDTO và tính sĩ số active động (derived)
   */
  private toClassSummaryDTO(cls: TeachingClass): ClassSummaryDTO {
    // 1. Lấy thông tin HSK Level từ HskRepository
    const level = hskRepositoryService.getLevelById(cls.hskLevelId);
    const hskLevelName = level ? level.name : 'HSK';
    const hskLevelColor = level?.colorToken || 'var(--primary)';

    // 2. Lấy thông tin Course
    const course = cls.courseId ? curriculumService.getCourseById(cls.courseId) : undefined;

    // 3. Tính toán sĩ số thực tế từ ClassMember (derived enrollment count)
    const activeMembersCount = membersStore.filter(
      (m) => m.classId === cls.id && m.status === 'ACTIVE'
    ).length;

    // 4. Tóm tắt lịch học
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

  /**
   * Xây dựng danh sách Buổi dạy sắp tới dựa trên lịch tuần của các lớp active
   */
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
            ? 'Bài 8: Đi siêu thị mua hoa quả (买水果)'
            : 'Bài 4: Sở thích và Thói quen sinh hoạt (爱好与习惯)',
          isToday,
        });
      });
    });

    // Ưu tiên các buổi học "Hôm nay" lên trước
    return list.sort((a, b) => (b.isToday ? 1 : 0) - (a.isToday ? 1 : 0));
  }

  /**
   * Kiểm tra tính hợp lệ của thời khóa biểu
   */
  private validateSchedules(
    schedules: Array<{ dayOfWeek: DayOfWeek; startTime: string; endTime: string }>
  ): void {
    if (!schedules || schedules.length === 0) {
      return; // Được phép để trống lịch nếu là lớp Draft/Upcoming
    }

    const seenDays = new Set<string>();
    for (const sch of schedules) {
      if (sch.startTime >= sch.endTime) {
        throw new Error(
          `Khung giờ không hợp lệ (${sch.startTime} đến ${sch.endTime}): Giờ bắt đầu phải nhỏ hơn giờ kết thúc.`
        );
      }
      const key = `${sch.dayOfWeek}-${sch.startTime}`;
      if (seenDays.has(key)) {
        throw new Error(`Đã có lịch học trùng ngày và giờ: ${sch.dayOfWeek} lúc ${sch.startTime}.`);
      }
      seenDays.add(key);
    }
  }

  /**
   * Helper kiểm tra URL hợp lệ
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }
}

export const teacherPortalService = new TeacherPortalService();
