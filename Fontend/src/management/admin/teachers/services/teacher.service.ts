import type {
  CreateTeacherDTO,
  PaginatedResponse,
  TeacherDetail,
  TeacherFilters,
  TeacherListItem,
  TeacherSort,
  TeacherSpecialization,
  TeacherSummaryKPIs,
  TeacherTeachingStatus,
  TeachingLevel,
  UpdateTeacherDTO,
} from '../types/teacher.types';
import { INITIAL_TEACHERS_MOCK } from '../data/mockTeacherData';

class AdminTeacherService {
  private teachers: TeacherDetail[] = [...INITIAL_TEACHERS_MOCK];

  public getKPIs(): TeacherSummaryKPIs {
    const totalTeachers = this.teachers.length;
    const activeTeaching = this.teachers.filter((t) => t.teachingStatus === 'ACTIVE').length;
    const onLeaveTeaching = this.teachers.filter((t) => t.teachingStatus === 'ON_LEAVE').length;
    const activeClasses = this.teachers
      .filter((t) => t.teachingStatus === 'ACTIVE')
      .reduce((sum, t) => sum + (t.classCount || 0), 0);

    return {
      totalTeachers,
      activeTeaching,
      onLeaveTeaching,
      activeClasses,
    };
  }

  public getTeachers(
    filters: TeacherFilters,
    pagination: { page: number; pageSize: number },
    sort: TeacherSort
  ): PaginatedResponse<TeacherListItem> {
    let result = [...this.teachers];

    // 1. Search (name, email)
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (t) => t.name.toLowerCase().includes(q) || t.email.toLowerCase().includes(q)
      );
    }

    // 2. Account Status
    if (filters.accountStatus !== 'ALL') {
      result = result.filter((t) => t.accountStatus === filters.accountStatus);
    }

    // 3. Teaching Status
    if (filters.teachingStatus !== 'ALL') {
      result = result.filter((t) => t.teachingStatus === filters.teachingStatus);
    }

    // 4. Teaching Level
    if (filters.teachingLevel !== 'ALL') {
      const targetLevel = filters.teachingLevel as TeachingLevel;
      result = result.filter((t) => t.teachingLevels.includes(targetLevel));
    }

    // 5. Specialization
    if (filters.specialization !== 'ALL') {
      const targetSpec = filters.specialization as TeacherSpecialization;
      result = result.filter((t) => t.specializations.includes(targetSpec));
    }

    // 6. Sorting
    result.sort((a, b) => {
      let comparison = 0;
      switch (sort.field) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'vi');
          break;
        case 'joinedDate':
          comparison = new Date(a.joinedDateRaw).getTime() - new Date(b.joinedDateRaw).getTime();
          break;
        case 'lastActive':
          comparison = new Date(a.lastActiveDateRaw).getTime() - new Date(b.lastActiveDateRaw).getTime();
          break;
        case 'classCount':
          comparison = a.classCount - b.classCount;
          break;
        case 'studentCount':
          comparison = a.studentCount - b.studentCount;
          break;
        default:
          comparison = 0;
      }
      return sort.direction === 'asc' ? comparison : -comparison;
    });

    const total = result.length;
    const totalPages = Math.ceil(total / pagination.pageSize) || 1;
    const page = Math.min(Math.max(1, pagination.page), totalPages);
    const start = (page - 1) * pagination.pageSize;
    const end = start + pagination.pageSize;

    // Convert full TeacherDetail to TeacherListItem
    const items: TeacherListItem[] = result.slice(start, end).map((t) => ({
      id: t.id,
      name: t.name,
      email: t.email,
      phone: t.phone,
      avatarUrl: t.avatarUrl,
      accountStatus: t.accountStatus,
      teachingStatus: t.teachingStatus,
      teachingLevels: t.teachingLevels,
      specializations: t.specializations,
      classCount: t.classCount,
      studentCount: t.studentCount,
      lessonCount: t.lessonCount,
      joinedAt: t.joinedAt,
      joinedDateRaw: t.joinedDateRaw,
      lastActiveAt: t.lastActiveAt,
      lastActiveDateRaw: t.lastActiveDateRaw,
    }));

    return {
      items,
      totalItems: total,
      currentPage: page,
      page,
      pageSize: pagination.pageSize,
      totalPages,
    };
  }

  public getTeacherById(id: string): TeacherDetail | null {
    const found = this.teachers.find((t) => t.id === id);
    return found ? { ...found } : null;
  }

  public isEmailTaken(email: string, excludeId?: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.teachers.some(
      (t) => t.email.toLowerCase() === normalized && t.id !== excludeId
    );
  }

  public createTeacher(dto: CreateTeacherDTO): TeacherDetail {
    const now = new Date();
    const id = `t-${Date.now().toString().slice(-4)}`;
    const joinedAt = now.toLocaleDateString('vi-VN');
    const joinedDateRaw = now.toISOString();

    const newTeacher: TeacherDetail = {
      id,
      name: dto.name.trim(),
      email: dto.email.trim(),
      phone: dto.phone?.trim() || '',
      accountStatus: 'ACTIVE',
      teachingStatus: dto.teachingStatus,
      teachingLevels: [...dto.teachingLevels],
      specializations: [...dto.specializations],
      classCount: 0,
      studentCount: 0,
      lessonCount: 0,
      joinedAt,
      joinedDateRaw,
      lastActiveAt: 'Vừa tạo',
      lastActiveDateRaw: joinedDateRaw,
      notes: dto.notes,
      profile: {
        teachingLevels: [...dto.teachingLevels],
        specializations: [...dto.specializations],
        qualifications: dto.qualifications.trim(),
        experienceYears: dto.experienceYears,
        bio: dto.bio?.trim() || '',
      },
      teachingSummary: {
        classCount: 0,
        studentCount: 0,
        lessonCount: 0,
        assignmentCount: 0,
        assignedClasses: [],
      },
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: 'Hồ sơ giáo viên được khởi tạo',
          targetName: 'Hệ thống Quản lý',
          timeAgo: 'Vừa xong',
          timestamp: joinedDateRaw,
        },
      ],
    };

    this.teachers.unshift(newTeacher);
    return { ...newTeacher };
  }

  public updateTeacher(id: string, dto: UpdateTeacherDTO): TeacherDetail {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Teacher with id ${id} not found.`);
    }

    const current = this.teachers[index];

    const updated: TeacherDetail = {
      ...current,
      name: dto.name.trim(),
      email: dto.email.trim(),
      phone: dto.phone?.trim() || current.phone,
      teachingStatus: dto.teachingStatus,
      accountStatus: dto.accountStatus || current.accountStatus,
      teachingLevels: [...dto.teachingLevels],
      specializations: [...dto.specializations],
      notes: dto.notes !== undefined ? dto.notes : current.notes,
      profile: {
        ...current.profile,
        teachingLevels: [...dto.teachingLevels],
        specializations: [...dto.specializations],
        qualifications: dto.qualifications.trim(),
        experienceYears: dto.experienceYears,
        bio: dto.bio !== undefined ? dto.bio.trim() : current.profile.bio,
      },
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: 'Cập nhật thông tin hồ sơ giáo viên',
          targetName: 'Quản trị viên',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities.slice(0, 4),
      ],
    };

    this.teachers[index] = updated;
    return { ...updated };
  }

  public lockTeacherAccount(id: string, reason?: string): TeacherDetail {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Teacher with id ${id} not found.`);

    const current = this.teachers[index];
    const updated: TeacherDetail = {
      ...current,
      accountStatus: 'LOCKED',
      lockReason: reason || 'Tài khoản bị tạm khóa bởi quản trị viên hệ thống.',
      lockedAt: new Date().toLocaleDateString('vi-VN'),
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: 'Tài khoản bị khóa bởi quản trị viên',
          targetName: 'Bảo mật hệ thống',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities.slice(0, 4),
      ],
    };

    this.teachers[index] = updated;
    return { ...updated };
  }

  public unlockTeacherAccount(id: string): TeacherDetail {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Teacher with id ${id} not found.`);

    const current = this.teachers[index];
    const updated: TeacherDetail = {
      ...current,
      accountStatus: 'ACTIVE',
      lockReason: undefined,
      lockedAt: undefined,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: 'Tài khoản được mở khóa',
          targetName: 'Bảo mật hệ thống',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities.slice(0, 4),
      ],
    };

    this.teachers[index] = updated;
    return { ...updated };
  }

  public setTeachingStatus(id: string, teachingStatus: TeacherTeachingStatus): TeacherDetail {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Teacher with id ${id} not found.`);

    const current = this.teachers[index];
    const statusLabels: Record<TeacherTeachingStatus, string> = {
      ACTIVE: 'Đang giảng dạy',
      ON_LEAVE: 'Tạm nghỉ giảng dạy',
      INACTIVE: 'Ngừng giảng dạy',
    };

    const updated: TeacherDetail = {
      ...current,
      teachingStatus,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: `Chuyển trạng thái giảng dạy thành: ${statusLabels[teachingStatus]}`,
          targetName: 'Phân công đào tạo',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities.slice(0, 4),
      ],
    };

    this.teachers[index] = updated;
    return { ...updated };
  }
}

export const adminTeacherService = new AdminTeacherService();
