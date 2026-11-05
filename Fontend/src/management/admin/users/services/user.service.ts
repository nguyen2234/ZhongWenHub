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
import { authTokenService } from '../../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

export function generateSecureRandomPassword(): string {
  const lowers = 'abcdefghjkmnpqrstuvwxyz';
  const uppers = 'ABCDEFGHJKMNPQRSTUVWXYZ';
  const numbers = '23456789';
  const specials = '!@#$%^&*';
  let pwd = '';
  pwd += uppers[Math.floor(Math.random() * uppers.length)];
  pwd += lowers[Math.floor(Math.random() * lowers.length)];
  pwd += numbers[Math.floor(Math.random() * numbers.length)];
  pwd += specials[Math.floor(Math.random() * specials.length)];
  const all = lowers + uppers + numbers + specials;
  for (let i = 0; i < 8; i++) {
    pwd += all[Math.floor(Math.random() * all.length)];
  }
  return pwd;
}

class AdminUserService {
  private users: UserDetail[] = [];
  private kpis: UserSummaryKPIs = {
    totalLearners: 0,
    activeLearners: 0,
    lockedLearners: 0,
    newLearners30d: 0,
  };
  private isSyncing = false;
  private hasSynced = false;
  private lastError: string | null = null;

  constructor() {
    this.users = [];
    this.kpis = { totalLearners: 0, activeLearners: 0, lockedLearners: 0, newLearners30d: 0 };
    this.syncFromBackend();
  }

  public async syncFromBackend(): Promise<{ success: boolean; error?: string }> {
    if (this.isSyncing) return { success: !this.lastError, error: this.lastError || undefined };
    this.isSyncing = true;
    this.lastError = null;

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

      if (!usersRes.ok) {
        const errorText = `Không thể tải dữ liệu học viên từ máy chủ (HTTP ${usersRes.status}).`;
        this.lastError = errorText;
        this.users = [];
        this.hasSynced = true;
        return { success: false, error: errorText };
      }

      const usersData = await usersRes.json();
      if (usersData && Array.isArray(usersData.items)) {
        const mappedUsers: UserDetail[] = usersData.items.map((b: any) => ({
          id: b.id,
          name: b.name || b.displayName || 'Người dùng',
          email: b.email,
          avatarUrl: b.avatarUrl,
          roles: b.roles || ['STUDENT'],
          role: (b.roles && b.roles[0]) || 'STUDENT',
          hskLevel: b.hskLevel || 'HSK 1',
          status: b.status === 'SUSPENDED' ? 'LOCKED' : (b.status || 'ACTIVE'),
          progressPercentage: b.progressPercentage || 0,
          joinedAt: b.joinedAt || (b.createdAt ? new Date(b.createdAt).toLocaleDateString('vi-VN') : 'Mới tham gia'),
          joinedDateRaw: b.joinedDateRaw || (b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString()),
          lastActiveAt: b.lastActiveAt || (b.lastLoginAt ? new Date(b.lastLoginAt).toLocaleDateString('vi-VN') : 'Chưa hoạt động'),
          lastActiveDateRaw: b.lastActiveDateRaw || (b.lastLoginAt ? new Date(b.lastLoginAt).toISOString() : new Date().toISOString()),
          phone: b.phone,
          notes: b.notes,
          lockReason: b.lockReason,
          lockedAt: b.lockedAt,
          walletBalance: b.walletBalance !== undefined ? b.walletBalance : null,
          plan: b.plan !== undefined ? b.plan : null,
          planStartDate: b.planStartDate,
          planEndDate: b.planEndDate,
          walletTransactions: b.walletTransactions || [],
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
        this.lastError = null;
      } else {
        this.users = [];
        this.hasSynced = true;
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
        }
      } else {
        this.kpis = {
          totalLearners: this.users.length,
          activeLearners: this.users.filter((u) => u.status === 'ACTIVE').length,
          lockedLearners: this.users.filter((u) => u.status === 'LOCKED').length,
          newLearners30d: this.users.length,
        };
      }

      return { success: true };
    } catch (err: any) {
      const errorMsg =
        err?.message || 'Không thể kết nối đến máy chủ Backend. Vui lòng kiểm tra dịch vụ ASP.NET Core.';
      this.lastError = errorMsg;
      this.users = [];
      this.hasSynced = true;
      return { success: false, error: errorMsg };
    } finally {
      this.isSyncing = false;
    }
  }

  public getLastError(): string | null {
    return this.lastError;
  }

  public getIsSyncing(): boolean {
    return this.isSyncing;
  }

  public getKPIs(): UserSummaryKPIs {
    if (!this.hasSynced) {
      this.syncFromBackend();
    }
    const active = this.users.filter((u) => u.status === 'ACTIVE').length;
    const locked = this.users.filter((u) => u.status === 'LOCKED').length;
    return {
      totalLearners: Math.max(this.kpis.totalLearners, this.users.length),
      activeLearners: active,
      lockedLearners: locked,
      newLearners30d: Math.max(this.kpis.newLearners30d, this.users.length),
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

    // 4. Role filter
    if (filters.role && filters.role !== 'ALL') {
      const targetRole = filters.role;
      result = result.filter(
        (u) => u.roles?.includes(targetRole) || u.role === targetRole
      );
    }

    // 5. Sorting
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

    // 6. Pagination
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

  public async createUser(dto: CreateUserDTO): Promise<UserDetail> {
    const existing = this.users.find(
      (u) => u.email.toLowerCase() === dto.email.trim().toLowerCase()
    );
    if (existing) {
      throw new Error('Email này đã được sử dụng bởi người dùng khác.');
    }

    const assignedRoles = dto.roles && dto.roles.length > 0
      ? dto.roles
      : [dto.role || 'STUDENT'];

    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên để tạo tài khoản.');
    }

    const effectivePassword = dto.password?.trim() || generateSecureRandomPassword();

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
        initialHsk: dto.initialHsk || 'HSK 1',
        status: dto.status || 'ACTIVE',
        password: effectivePassword,
        roles: assignedRoles,
        notes: dto.notes,
        phone: dto.phone,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const errorMsg =
        errorData?.detail ||
        errorData?.message ||
        (errorData?.errors ? Object.values(errorData.errors).flat().join('; ') : null) ||
        'Không thể tạo tài khoản người dùng trên máy chủ.';
      throw new Error(errorMsg);
    }

    const created = await res.json();
    const newUser: UserDetail = {
      id: created.id,
      name: created.name || dto.name.trim(),
      email: created.email || dto.email.trim().toLowerCase(),
      roles: created.roles || assignedRoles,
      role: (created.roles && created.roles[0]) || assignedRoles[0],
      hskLevel: created.hskLevel || dto.initialHsk || 'HSK 1',
      status: created.status || dto.status || 'ACTIVE',
      progressPercentage: created.progressPercentage || 0,
      joinedAt: created.joinedAt || (created.createdAt ? new Date(created.createdAt).toLocaleDateString('vi-VN') : new Date().toLocaleDateString('vi-VN')),
      joinedDateRaw: created.joinedDateRaw || (created.createdAt ? new Date(created.createdAt).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)),
      lastActiveAt: created.lastActiveAt || 'Vừa mới tạo',
      lastActiveDateRaw: created.lastActiveDateRaw || new Date().toISOString(),
      phone: created.phone || dto.phone,
      notes: created.notes || dto.notes,
      learningSummary: created.learningSummary || {
        currentHsk: dto.initialHsk || 'HSK 1',
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
    if (newUser.status === 'ACTIVE') this.kpis.activeLearners += 1;

    return JSON.parse(JSON.stringify(newUser));
  }

  public async updateUser(id: string, dto: UpdateUserDTO): Promise<UserDetail> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    const emailDuplicate = this.users.find(
      (u) => u.id !== id && u.email.toLowerCase() === dto.email.trim().toLowerCase()
    );
    if (emailDuplicate) {
      throw new Error('Email này đã được sử dụng bởi người dùng khác.');
    }

    const targetRoles = dto.roles && dto.roles.length > 0
      ? dto.roles
      : dto.role ? [dto.role] : user.roles;

    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên để cập nhật người dùng.');
    }

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
        hskLevel: dto.hskLevel,
        status: dto.status,
        roles: targetRoles,
        notes: dto.notes,
        phone: dto.phone,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => null);
      const errorMsg =
        errorData?.detail ||
        errorData?.message ||
        'Không thể cập nhật thông tin người dùng trên máy chủ.';
      throw new Error(errorMsg);
    }

    user.name = dto.name.trim();
    user.email = dto.email.trim().toLowerCase();
    user.hskLevel = dto.hskLevel;
    user.status = dto.status;
    if (targetRoles) {
      user.roles = targetRoles;
      user.role = targetRoles[0];
    }
    if (dto.notes !== undefined) {
      user.notes = dto.notes;
    }
    if (dto.phone !== undefined) {
      user.phone = dto.phone;
    }
    user.learningSummary.currentHsk = dto.hskLevel;

    return JSON.parse(JSON.stringify(user));
  }

  public async lockUser(id: string, reason?: string): Promise<UserDetail> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    const lockReason = reason || 'Tài khoản tạm thời bị khóa bởi Quản trị viên.';
    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên để khóa tài khoản.');
    }

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
      throw new Error(errData?.detail || errData?.message || 'Không thể khóa tài khoản này.');
    }

    user.status = 'LOCKED';
    user.lockReason = lockReason;
    user.lockedAt = new Date().toLocaleString('vi-VN');

    return JSON.parse(JSON.stringify(user));
  }

  public async unlockUser(id: string): Promise<UserDetail> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên để mở khóa tài khoản.');
    }

    const res = await fetch(getApiUrl(`admin/users/${id}/unlock`), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || errData?.message || 'Không thể mở khóa tài khoản này.');
    }

    user.status = 'ACTIVE';
    delete user.lockReason;
    delete user.lockedAt;

    return JSON.parse(JSON.stringify(user));
  }

  public async deleteUser(id: string): Promise<void> {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new Error('Không tìm thấy người dùng.');
    }

    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên để xóa tài khoản.');
    }

    const res = await fetch(getApiUrl(`admin/users/${id}`), {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => null);
      throw new Error(errData?.detail || errData?.message || 'Không thể vô hiệu hóa tài khoản này.');
    }

    this.users = this.users.filter((u) => u.id !== id);
    this.kpis.totalLearners = Math.max(0, this.kpis.totalLearners - 1);
  }

  public async resetPasswordAsync(
    id: string,
    dto: { newPassword: string; confirmPassword?: string }
  ): Promise<{ message: string }> {
    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên.');
    }

    const res = await fetch(getApiUrl(`admin/users/${id}/reset-password`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.title || err?.message || 'Không thể đặt lại mật khẩu.');
    }

    return await res.json().catch(() => ({ message: 'Đặt lại mật khẩu thành công.' }));
  }

  public async adjustWalletBalanceAsync(
    id: string,
    dto: { amount: number; reason: string }
  ): Promise<{ message: string; newBalance?: number }> {
    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên.');
    }

    const res = await fetch(getApiUrl(`admin/users/${id}/wallet/adjust`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.title || err?.message || 'Không thể điều chỉnh số dư.');
    }

    const data = await res.json().catch(() => ({ message: 'Thành công' }));
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1 && data.newBalance !== undefined) {
      this.users[idx].walletBalance = data.newBalance;
    }
    return data;
  }

  public async updateSubscriptionPlanAsync(
    id: string,
    dto: { plan: string; durationMonths?: number }
  ): Promise<{ message: string; plan?: string; startDate?: string; endDate?: string }> {
    const token = authTokenService.getAccessToken();
    if (!token) {
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên.');
    }

    const res = await fetch(getApiUrl(`admin/users/${id}/subscription`), {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
      body: JSON.stringify(dto),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.title || err?.message || 'Không thể cập nhật gói sử dụng.');
    }

    const data = await res.json().catch(() => ({ message: 'Thành công' }));
    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1 && data.plan) {
      this.users[idx].plan = data.plan;
      if (data.startDate) this.users[idx].planStartDate = data.startDate;
      if (data.endDate) this.users[idx].planEndDate = data.endDate;
    }
    return data;
  }

  public async getUserDetailAsync(id: string): Promise<UserDetail> {
    const token = authTokenService.getAccessToken();
    if (!token) {
      const cached = this.users.find((u) => u.id === id);
      if (cached) return cached;
      throw new Error('Yêu cầu phiên đăng nhập quản trị viên.');
    }

    const res = await fetch(getApiUrl(`admin/users/${id}`), {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      credentials: 'include',
    });

    if (!res.ok) {
      const cached = this.users.find((u) => u.id === id);
      if (cached) return cached;
      throw new Error('Không tìm thấy thông tin người dùng.');
    }

    const data = await res.json();
    const detail: UserDetail = {
      id: data.id,
      name: data.name || data.displayName || 'Người dùng',
      email: data.email,
      avatarUrl: data.avatarUrl,
      roles: data.roles || ['STUDENT'],
      role: (data.roles && data.roles[0]) || 'STUDENT',
      hskLevel: data.hskLevel || 'HSK 1',
      status: data.status === 'SUSPENDED' ? 'LOCKED' : (data.status || 'ACTIVE'),
      progressPercentage: data.progressPercentage || 0,
      joinedAt: data.joinedAt || (data.createdAt ? new Date(data.createdAt).toLocaleDateString('vi-VN') : 'Mới tham gia'),
      joinedDateRaw: data.joinedDateRaw || (data.createdAt ? new Date(data.createdAt).toISOString() : new Date().toISOString()),
      lastActiveAt: data.lastActiveAt || (data.lastLoginAt ? new Date(data.lastLoginAt).toLocaleDateString('vi-VN') : 'Chưa hoạt động'),
      lastActiveDateRaw: data.lastActiveDateRaw || (data.lastLoginAt ? new Date(data.lastLoginAt).toISOString() : new Date().toISOString()),
      phone: data.phone,
      notes: data.notes,
      lockReason: data.lockReason,
      lockedAt: data.lockedAt,
      walletBalance: data.walletBalance !== undefined ? data.walletBalance : null,
      plan: data.plan !== undefined ? data.plan : null,
      planStartDate: data.planStartDate,
      planEndDate: data.planEndDate,
      walletTransactions: data.walletTransactions || [],
      learningSummary: data.learningSummary || {
        currentHsk: data.hskLevel || 'HSK 1',
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

    const idx = this.users.findIndex((u) => u.id === id);
    if (idx !== -1) {
      this.users[idx] = detail;
    }

    return detail;
  }

  private toListItem(u: UserDetail): UserListItem {
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      avatarUrl: u.avatarUrl,
      roles: u.roles,
      role: u.role || (u.roles && u.roles[0]),
      hskLevel: u.hskLevel,
      status: u.status,
      progressPercentage: u.progressPercentage,
      joinedAt: u.joinedAt,
      joinedDateRaw: u.joinedDateRaw,
      lastActiveAt: u.lastActiveAt,
      lastActiveDateRaw: u.lastActiveDateRaw,
      walletBalance: u.walletBalance,
      plan: u.plan,
      planStartDate: u.planStartDate,
      planEndDate: u.planEndDate,
    };
  }
}

export const adminUserService = new AdminUserService();
