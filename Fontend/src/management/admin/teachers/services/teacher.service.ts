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
import { authTokenService } from '../../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

class AdminTeacherService {
  private teachers: TeacherDetail[] = [];
  private isSyncing = false;
  private hasSynced = false;
  private lastError: string | null = null;

  constructor() {
    this.teachers = [];
    this.syncFromBackend();
  }

  public async syncFromBackend(): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) return { success: !this.lastError, error: this.lastError || undefined };
    this.isSyncing = true;
    this.lastError = null;

    try {
      const token = authTokenService.getAccessToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(getApiUrl('admin/users?role=TEACHER&page=1&pageSize=100'), {
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const errText = `Không thể tải danh sách giáo viên từ máy chủ (HTTP ${res.status}).`;
        this.lastError = errText;
        this.teachers = [];
        this.hasSynced = true;
        return { success: false, error: errText };
      }

      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        this.teachers = data.items.map((u: any) => {
          const isLocked = u.status === 'LOCKED' || u.status === 'SUSPENDED';
          const hsk = (u.hskLevel || 'HSK 3') as TeachingLevel;
          const levels: TeachingLevel[] = [hsk];
          return {
            id: u.id,
            name: u.name || u.displayName || 'Giáo viên',
            email: u.email,
            phone: u.phone || '',
            avatarUrl: u.avatarUrl,
            accountStatus: isLocked ? 'LOCKED' : (u.status || 'ACTIVE'),
            teachingStatus: isLocked ? 'INACTIVE' : 'ACTIVE',
            teachingLevels: levels,
            specializations: ['GRAMMAR', 'CONVERSATION'] as TeacherSpecialization[],
            classCount: 0,
            studentCount: 0,
            lessonCount: 0,
            joinedAt: u.joinedAt || (u.createdAt ? new Date(u.createdAt).toLocaleDateString('vi-VN') : 'Mới tham gia'),
            joinedDateRaw: u.joinedDateRaw || (u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString()),
            lastActiveAt: u.lastActiveAt || (u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString('vi-VN') : 'Chưa hoạt động'),
            lastActiveDateRaw: u.lastActiveDateRaw || (u.lastLoginAt ? new Date(u.lastLoginAt).toISOString() : new Date().toISOString()),
            notes: u.notes,
            lockReason: u.lockReason,
            lockedAt: u.lockedAt,
            profile: {
              teachingLevels: levels,
              specializations: ['GRAMMAR', 'CONVERSATION'],
              qualifications: u.notes || 'Giáo viên Tiếng Trung',
              experienceYears: 0,
              bio: u.notes || '',
            },
            teachingSummary: {
              classCount: 0,
              studentCount: 0,
              lessonCount: 0,
              assignmentCount: 0,
              assignedClasses: [],
            },
            recentActivities: [],
          };
        });
        this.hasSynced = true;
        this.lastError = null;
      } else {
        this.teachers = [];
        this.hasSynced = true;
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Không thể kết nối đến máy chủ Backend.';
      this.lastError = msg;
      this.teachers = [];
      this.hasSynced = true;
      return { success: false, error: msg };
    } finally {
      this.isSyncing = false;
    }
  }

  public getKPIs(): TeacherSummaryKPIs {
    if (!this.hasSynced) {
      this.syncFromBackend();
    }
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
    if (!this.hasSynced) {
      this.syncFromBackend();
    }
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

  public async createTeacher(dto: CreateTeacherDTO): Promise<TeacherDetail> {
    const token = authTokenService.getAccessToken();
    let backendId: string | null = null;

    if (token) {
      const res = await fetch(getApiUrl('admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          password: 'Teacher12345!',
          roles: ['TEACHER'],
          initialHsk: dto.teachingLevels && dto.teachingLevels[0] ? dto.teachingLevels[0] : 'HSK 1',
          status: 'ACTIVE',
          notes: dto.bio || dto.qualifications || 'Giáo viên Tiếng Trung',
          phone: dto.phone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Không thể tạo tài khoản giáo viên trên máy chủ.');
      }

      const createdUser = await res.json();
      backendId = createdUser.id;
    }

    const now = new Date();
    const id = backendId || `t-${Date.now().toString().slice(-4)}`;
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

  public async updateTeacher(id: string, dto: UpdateTeacherDTO): Promise<TeacherDetail> {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) {
      throw new Error(`Không tìm thấy giáo viên.`);
    }

    const token = authTokenService.getAccessToken();
    if (token && id.length > 20) {
      const res = await fetch(getApiUrl(`admin/users/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          phone: dto.phone,
          notes: dto.bio || dto.notes,
          hskLevel: dto.teachingLevels && dto.teachingLevels[0] ? dto.teachingLevels[0] : 'HSK 1',
          status: dto.accountStatus || 'ACTIVE',
          roles: ['TEACHER'],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Không thể cập nhật thông tin giáo viên.');
      }
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

  public async lockTeacherAccount(id: string, reason?: string): Promise<TeacherDetail> {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Không tìm thấy giáo viên.`);

    const lockReason = reason || 'Tài khoản bị tạm khóa bởi quản trị viên hệ thống.';
    const token = authTokenService.getAccessToken();
    if (token && id.length > 20) {
      const res = await fetch(getApiUrl(`admin/users/${id}/lock`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ reason: lockReason }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Không thể khóa tài khoản giáo viên.');
      }
    }

    const current = this.teachers[index];
    const updated: TeacherDetail = {
      ...current,
      accountStatus: 'LOCKED',
      teachingStatus: 'INACTIVE',
      lockReason,
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

  public async unlockTeacherAccount(id: string): Promise<TeacherDetail> {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Không tìm thấy giáo viên.`);

    const token = authTokenService.getAccessToken();
    if (token && id.length > 20) {
      const res = await fetch(getApiUrl(`admin/users/${id}/unlock`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Không thể mở khóa tài khoản giáo viên.');
      }
    }

    const current = this.teachers[index];
    const updated: TeacherDetail = {
      ...current,
      accountStatus: 'ACTIVE',
      teachingStatus: 'ACTIVE',
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

  public async deleteTeacher(id: string): Promise<void> {
    const token = authTokenService.getAccessToken();
    if (token && id.length > 20) {
      const res = await fetch(getApiUrl(`admin/users/${id}`), {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Không thể xóa / vô hiệu hóa tài khoản giáo viên.');
      }
    }

    this.teachers = this.teachers.filter((t) => t.id !== id);
  }

  public setTeachingStatus(id: string, teachingStatus: TeacherTeachingStatus): TeacherDetail {
    const index = this.teachers.findIndex((t) => t.id === id);
    if (index === -1) throw new Error(`Không tìm thấy giáo viên.`);

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
