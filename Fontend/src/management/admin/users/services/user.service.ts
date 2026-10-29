import type {
  CreateUserDTO,
  PaginatedResponse,
  UpdateUserDTO,
  UserDetail,
  UserFilters,
  UserListItem,
  UserSort,
  UserSummaryKPIs,
} from '../types/user.types';
import { INITIAL_USER_KPIS, INITIAL_USERS } from '../data/mockUserData';
import { authTokenService } from '../../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

class AdminUserService {
  private users: UserDetail[] = [...INITIAL_USERS];
  private kpis: UserSummaryKPIs = { ...INITIAL_USER_KPIS };
  private initialActiveCount = INITIAL_USERS.filter((u) => u.status === 'ACTIVE').length;
  private initialLockedCount = INITIAL_USERS.filter((u) => u.status === 'LOCKED').length;
  private isSyncing = false;
  private hasSynced = false;

  constructor() {
    this.syncFromBackend();
  }

  public async syncFromBackend(): Promise<void> {
    if (this.isSyncing) return;
    this.isSyncing = true;

    try {
      const token = authTokenService.getAccessToken();
      const headers: Record<string, string> = {
        Accept: 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Fetch users and KPIs in parallel
      const [usersRes, kpisRes] = await Promise.all([
        fetch(getApiUrl('admin/users?page=1&pageSize=100'), {
          headers,
          credentials: 'include',
        }),
        fetch(getApiUrl('admin/users/kpis'), {
          headers,
          credentials: 'include',
        }),
      ]);

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        if (usersData && Array.isArray(usersData.items) && usersData.items.length > 0) {
          const mappedUsers: UserDetail[] = usersData.items.map((b: any) => ({
            id: b.id,
            name: b.name || b.displayName || 'Người dùng',
            email: b.email,
            avatarUrl: b.avatarUrl,
            hskLevel: b.hskLevel || 'HSK 1',
            status: b.status === 'SUSPENDED' ? 'LOCKED' : (b.status || 'ACTIVE'),
            progressPercentage: b.progressPercentage || 0,
            joinedAt: b.joinedAt || '28/10/2026',
            joinedDateRaw: b.joinedDateRaw || new Date().toISOString().slice(0, 10),
            lastActiveAt: b.lastActiveAt || 'Vừa mới tạo',
            lastActiveDateRaw: b.lastActiveDateRaw || new Date().toISOString(),
            phone: b.phone,
            notes: b.notes,
            lockReason: b.lockReason,
            lockedAt: b.lockedAt,
            learningSummary: b.learningSummary || {
              currentHsk: b.hskLevel || 'HSK 1',
              totalXp: 0,
              streakDays: 0,
              completedLessons: 0,
              totalLessons: 35,
              progressPercentage: 0,
              vocabularyMastered: 0,
              srsReviewDue: 0,
              lastStudySession: 'Chưa có hoạt động học tập',
            },
          }));

          this.users = mappedUsers;
          this.hasSynced = true;
        }
      }

      if (kpisRes.ok) {
        const kpisData = await kpisRes.json();
        if (kpisData) {
          this.kpis = {
            totalLearners: kpisData.totalLearners ?? this.users.length,
            activeLearners: kpisData.activeLearners ?? this.users.filter((u) => u.status === 'ACTIVE').length,
            lockedLearners: kpisData.lockedLearners ?? this.users.filter((u) => u.status === 'LOCKED').length,
            newLearners30d: kpisData.newLearners30d ?? this.users.length,
          };
          this.initialActiveCount = this.kpis.activeLearners;
          this.initialLockedCount = this.kpis.lockedLearners;
        }
      }
    } catch {
      // In offline or non-authenticated test mode, fallback gracefully to initial data
    } finally {
      this.isSyncing = false;
    }
  }

  public getKPIs(): UserSummaryKPIs {
    if (!this.hasSynced) {
      this.syncFromBackend();
    }
    const active = this.users.filter((u) => u.status === 'ACTIVE').length;
    const locked = this.users.filter((u) => u.status === 'LOCKED').length;
    return {
      totalLearners: this.kpis.totalLearners,
      activeLearners: this.kpis.activeLearners + (active - this.initialActiveCount),
      lockedLearners: this.kpis.lockedLearners + (locked - this.initialLockedCount),
      newLearners30d: this.kpis.newLearners30d,
    };
  }

  public getUsers(
    filters: UserFilters,
    pagination: { page: number; pageSize: number },
    sort?: UserSort
  ): PaginatedResponse<UserListItem> {
    if (!this.hasSynced) {
      this.syncFromBackend();
    }
    let result = [...this.users];

    // 1. Search filter (Name or Email)
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
      );
    }

    // 2. Status filter
    if (filters.status !== 'ALL') {
      result = result.filter((u) => u.status === filters.status);
    }

    // 3. HSK Level filter (data-driven)
    if (filters.hskLevel !== 'ALL') {
      result = result.filter((u) => u.hskLevel === filters.hskLevel);
    }

    // 4. Sorting
    if (sort) {
      result.sort((a, b) => {
        let cmp = 0;
        switch (sort.field) {
          case 'name':
            cmp = a.name.localeCompare(b.name, 'vi');
            break;
          case 'joinedDate':
            cmp = a.joinedDateRaw.localeCompare(b.joinedDateRaw);
            break;
          case 'lastActive':
            cmp = a.lastActiveDateRaw.localeCompare(b.lastActiveDateRaw);
            break;
          case 'hskLevel':
            cmp = a.hskLevel.localeCompare(b.hskLevel);
            break;
          case 'progress':
            cmp = a.progressPercentage - b.progressPercentage;
            break;
          default:
            cmp = 0;
        }
        return sort.direction === 'asc' ? cmp : -cmp;
      });
    }

    // 5. Pagination
    const totalItems = result.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pagination.pageSize));
    const currentPage = Math.min(Math.max(1, pagination.page), totalPages);
    const startIndex = (currentPage - 1) * pagination.pageSize;
    const items = result.slice(startIndex, startIndex + pagination.pageSize);

    return {
      items: items.map(this.toListItem),
      totalItems,
      currentPage,
      page: currentPage,
      totalPages,
      pageSize: pagination.pageSize,
    };
  }

  public getUserById(id: string): UserDetail | null {
    const user = this.users.find((u) => u.id === id);
    return user ? JSON.parse(JSON.stringify(user)) : null;
  }

  public createUser(dto: CreateUserDTO): UserDetail {
    const existing = this.users.find((u) => u.email.toLowerCase() === dto.email.trim().toLowerCase());
    if (existing) {
      throw new Error('Email này đã được sử dụng bởi học viên khác.');
    }

    const newId = `u-${Date.now().toString().slice(-4)}`;
    const now = new Date();
    const joinedAt = `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
    const joinedDateRaw = now.toISOString().slice(0, 10);

    const newUser: UserDetail = {
      id: newId,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      hskLevel: dto.initialHsk,
      status: dto.status,
      progressPercentage: 0,
      joinedAt,
      joinedDateRaw,
      lastActiveAt: 'Vừa mới tạo',
      lastActiveDateRaw: now.toISOString(),
      notes: dto.notes,
      learningSummary: {
        currentHsk: dto.initialHsk,
        totalXp: 0,
        streakDays: 0,
        completedLessons: 0,
        totalLessons: 35,
        progressPercentage: 0,
        vocabularyMastered: 0,
        srsReviewDue: 0,
        lastStudySession: 'Chưa có hoạt động học tập',
      },
    };

    this.users.unshift(newUser);
    this.kpis.totalLearners += 1;
    this.kpis.newLearners30d += 1;
    if (dto.status === 'ACTIVE') this.kpis.activeLearners += 1;

    // Send async create request to backend in background
    const token = authTokenService.getAccessToken();
    if (token) {
      fetch(getApiUrl('admin/users'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          initialHsk: dto.initialHsk,
          status: dto.status,
          notes: dto.notes,
        }),
      }).catch(() => {
        // Log or handle background error
      });
    }

    return JSON.parse(JSON.stringify(newUser));
  }

  public updateUser(id: string, dto: UpdateUserDTO): UserDetail {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('Không tìm thấy học viên.');
    }

    const emailDuplicate = this.users.find(
      (u) => u.id !== id && u.email.toLowerCase() === dto.email.trim().toLowerCase()
    );
    if (emailDuplicate) {
      throw new Error('Email này đã được sử dụng bởi học viên khác.');
    }

    user.name = dto.name.trim();
    user.email = dto.email.trim().toLowerCase();
    user.hskLevel = dto.hskLevel;
    user.status = dto.status;
    if (dto.notes !== undefined) {
      user.notes = dto.notes;
    }
    user.learningSummary.currentHsk = dto.hskLevel;

    // Send update request to backend if valid guid
    const token = authTokenService.getAccessToken();
    if (token && id.length > 20) {
      fetch(getApiUrl(`admin/users/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({
          name: dto.name.trim(),
          email: dto.email.trim().toLowerCase(),
          hskLevel: dto.hskLevel,
          status: dto.status,
          notes: dto.notes,
        }),
      }).catch(() => {});
    }

    return JSON.parse(JSON.stringify(user));
  }

  public lockUser(id: string, reason?: string): UserDetail {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('Không tìm thấy học viên.');
    }

    user.status = 'LOCKED';
    user.lockReason = reason || 'Tài khoản tạm thời bị khóa bởi Quản trị viên.';
    user.lockedAt = new Date().toLocaleString('vi-VN');

    const token = authTokenService.getAccessToken();
    if (token && id.length > 20) {
      fetch(getApiUrl(`admin/users/${id}/lock`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ reason: user.lockReason }),
      }).catch(() => {});
    }

    return JSON.parse(JSON.stringify(user));
  }

  public unlockUser(id: string): UserDetail {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('Không tìm thấy học viên.');
    }

    user.status = 'ACTIVE';
    delete user.lockReason;
    delete user.lockedAt;

    const token = authTokenService.getAccessToken();
    if (token && id.length > 20) {
      fetch(getApiUrl(`admin/users/${id}/unlock`), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      }).catch(() => {});
    }

    return JSON.parse(JSON.stringify(user));
  }

  private toListItem(u: UserDetail): UserListItem {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      hskLevel: u.hskLevel,
      status: u.status,
      progressPercentage: u.progressPercentage,
      joinedAt: u.joinedAt,
      joinedDateRaw: u.joinedDateRaw,
      lastActiveAt: u.lastActiveAt,
      lastActiveDateRaw: u.lastActiveDateRaw,
    };
  }
}

export const adminUserService = new AdminUserService();
