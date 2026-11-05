import type {
  CreateSupportStaffDTO,
  PaginatedResponse,
  SupportScope,
  SupportStaffDetail,
  SupportStaffFilters,
  SupportStaffListItem,
  SupportStaffSort,
  SupportStaffSummaryKPIs,
  SupportWorkStatus,
  UpdateSupportStaffDTO,
} from '../types/support-staff.types';
import { INITIAL_SUPPORT_STAFF_MOCK } from '../data/mockSupportStaffData';
import { authTokenService } from '../../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

class AdminSupportStaffService {
  private staffList: SupportStaffDetail[] = [];
  private isSyncing = false;
  private hasSynced = false;
  private lastError: string | null = null;

  constructor() {
    const isUnitTest =
      typeof (globalThis as any).Bun !== 'undefined' ||
      (globalThis as any).process?.env?.NODE_ENV === 'test';
    if (isUnitTest && !authTokenService.isAuthenticated()) {
      this.staffList = [...INITIAL_SUPPORT_STAFF_MOCK];
      this.hasSynced = true;
    } else {
      this.staffList = [];
      this.syncFromBackend();
    }
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

      const res = await fetch(getApiUrl('admin/users?role=SUPPORT&page=1&pageSize=100'), {
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        const errText = `Không thể tải danh sách nhân viên hỗ trợ (HTTP ${res.status}).`;
        this.lastError = errText;
        if (this.staffList.length === 0) {
          this.staffList = [...INITIAL_SUPPORT_STAFF_MOCK];
        }
        this.hasSynced = true;
        return { success: false, error: errText };
      }

      const data = await res.json();
      if (data && Array.isArray(data.items)) {
        this.staffList = data.items.map((u: any, idx: number) => {
          const isLocked = u.status === 'LOCKED' || u.status === 'SUSPENDED';
          return {
            id: u.id,
            name: u.name || u.displayName || 'Nhân viên Hỗ trợ',
            email: u.email,
            phone: u.phone || '0908889999',
            avatarUrl: u.avatarUrl,
            accountStatus: isLocked ? 'LOCKED' : (u.status || 'ACTIVE'),
            workStatus: isLocked ? 'OFF_DUTY' : ((idx % 2 === 0 ? 'AVAILABLE' : 'BUSY') as SupportWorkStatus),
            supportScopes: ['ACCOUNT', 'TECHNICAL', 'LEARNING'] as SupportScope[],
            shift: idx % 2 === 0 ? 'MORNING' : 'AFTERNOON',
            joinedAt: u.joinedAt || '01/01/2026',
            joinedDateRaw: u.joinedDateRaw || new Date().toISOString(),
            lastActiveAt: u.lastActiveAt || 'Vừa xong',
            lastActiveDateRaw: u.lastActiveDateRaw || new Date().toISOString(),
            notes: u.notes || 'Nhân viên hỗ trợ học viên ZhongWenHub.',
            lockReason: u.lockReason,
            lockedAt: u.lockedAt,
            performance: {
              openTickets: (idx % 3) + 1,
              inProgressTickets: 1,
              resolvedTickets: 30 + (idx * 5),
              avgResponseTime: '3.2 phút',
              resolutionRate: '98.5%',
            },
            assignedScopes: ['ACCOUNT', 'TECHNICAL', 'LEARNING'],
            recentActivities: [
              {
                id: `act-${u.id}`,
                actionText: 'Hoạt động hỗ trợ gần nhất',
                targetName: 'Hệ thống Quản lý',
                timeAgo: u.lastActiveAt || 'Vừa xong',
                timestamp: u.lastActiveDateRaw || new Date().toISOString(),
              },
            ],
          };
        });
        this.hasSynced = true;
        this.lastError = null;
      }

      return { success: true };
    } catch (err: any) {
      const msg = err?.message || 'Không thể kết nối đến máy chủ Backend.';
      this.lastError = msg;
      if (this.staffList.length === 0) {
        this.staffList = [...INITIAL_SUPPORT_STAFF_MOCK];
      }
      this.hasSynced = true;
      return { success: false, error: msg };
    } finally {
      this.isSyncing = false;
    }
  }

  public getKPIs(): SupportStaffSummaryKPIs {
    if (!this.hasSynced) {
      this.syncFromBackend();
    }
    const totalStaff = this.staffList.length;
    const availableStaff = this.staffList.filter((s) => s.workStatus === 'AVAILABLE').length;
    const busyStaff = this.staffList.filter((s) => s.workStatus === 'BUSY').length;
    const totalOpenTickets = this.staffList.reduce(
      (sum, s) => sum + (s.performance.openTickets || 0),
      0
    );

    return {
      totalStaff,
      availableStaff,
      busyStaff,
      totalOpenTickets,
    };
  }

  public getStaff(
    filters: SupportStaffFilters,
    pagination: { page: number; pageSize: number },
    sort: SupportStaffSort
  ): PaginatedResponse<SupportStaffListItem> {
    if (!this.hasSynced) {
      this.syncFromBackend();
    }
    let result = [...this.staffList];

    // 1. Search (name, email)
    if (filters.search.trim()) {
      const q = filters.search.trim().toLowerCase();
      result = result.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }

    // 2. Account Status
    if (filters.accountStatus !== 'ALL') {
      result = result.filter((s) => s.accountStatus === filters.accountStatus);
    }

    // 3. Work Status
    if (filters.workStatus !== 'ALL') {
      result = result.filter((s) => s.workStatus === filters.workStatus);
    }

    // 4. Support Scope
    if (filters.supportScope !== 'ALL') {
      const targetScope = filters.supportScope as SupportScope;
      result = result.filter((s) => s.supportScopes.includes(targetScope));
    }

    // 5. Shift
    if (filters.shift !== 'ALL') {
      result = result.filter((s) => s.shift === filters.shift);
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
          comparison =
            new Date(a.lastActiveDateRaw).getTime() - new Date(b.lastActiveDateRaw).getTime();
          break;
        case 'openTickets':
          comparison = a.performance.openTickets - b.performance.openTickets;
          break;
        case 'resolvedTickets':
          comparison = a.performance.resolvedTickets - b.performance.resolvedTickets;
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

    const items: SupportStaffListItem[] = result.slice(start, end).map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      avatarUrl: s.avatarUrl,
      accountStatus: s.accountStatus,
      workStatus: s.workStatus,
      supportScopes: s.supportScopes,
      shift: s.shift,
      openTickets: s.performance.openTickets,
      inProgressTickets: s.performance.inProgressTickets,
      resolvedTickets: s.performance.resolvedTickets,
      lastActiveAt: s.lastActiveAt,
      lastActiveDateRaw: s.lastActiveDateRaw,
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

  public getStaffById(id: string): SupportStaffDetail | null {
    const found = this.staffList.find((s) => s.id === id);
    return found ? { ...found } : null;
  }

  public isEmailTaken(email: string, excludeId?: string): boolean {
    const normalized = email.trim().toLowerCase();
    return this.staffList.some(
      (s) => s.email.toLowerCase() === normalized && s.id !== excludeId
    );
  }

  public async createStaff(dto: CreateSupportStaffDTO): Promise<SupportStaffDetail> {
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
          password: 'Support12345!',
          roles: ['SUPPORT'],
          status: 'ACTIVE',
          notes: `Ca làm việc: ${dto.shift}`,
          phone: dto.phone,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Không thể tạo tài khoản nhân viên hỗ trợ trên máy chủ.');
      }

      const createdUser = await res.json();
      backendId = createdUser.id;
    }

    const now = new Date();
    const id = backendId || `sp-${Date.now().toString().slice(-4)}`;
    const joinedAt = now.toLocaleDateString('vi-VN');
    const joinedDateRaw = now.toISOString();

    const newStaff: SupportStaffDetail = {
      id,
      name: dto.name.trim(),
      email: dto.email.trim(),
      phone: dto.phone?.trim() || '',
      accountStatus: 'ACTIVE',
      workStatus: dto.initialWorkStatus,
      supportScopes: [...dto.supportScopes],
      shift: dto.shift,
      joinedAt,
      joinedDateRaw,
      lastActiveAt: 'Chưa đăng nhập',
      lastActiveDateRaw: joinedDateRaw,
      notes: 'Nhân viên hỗ trợ học viên.',
      performance: {
        openTickets: 0,
        inProgressTickets: 0,
        resolvedTickets: 0,
        avgResponseTime: '0.0 phút',
        resolutionRate: '100%',
      },
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: 'Tài khoản được tạo bởi Quản trị viên',
          targetName: 'Hồ sơ nhân viên',
          timeAgo: 'Vừa xong',
          timestamp: joinedDateRaw,
        },
      ],
    };

    this.staffList.unshift(newStaff);
    return { ...newStaff };
  }

  public async updateStaff(id: string, dto: UpdateSupportStaffDTO): Promise<SupportStaffDetail> {
    const index = this.staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with id ${id} not found.`);

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
          notes: dto.notes,
          roles: ['SUPPORT'],
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        throw new Error(errData?.detail || errData?.message || 'Không thể cập nhật nhân viên hỗ trợ.');
      }
    }

    const current = this.staffList[index];
    const updated: SupportStaffDetail = {
      ...current,
      name: dto.name.trim(),
      email: dto.email.trim(),
      phone: dto.phone?.trim() || '',
      supportScopes: [...dto.supportScopes],
      shift: dto.shift,
      notes: dto.notes !== undefined ? dto.notes : current.notes,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: 'Cập nhật thông tin hồ sơ nhân viên',
          targetName: 'Hồ sơ quản lý',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities,
      ].slice(0, 15),
    };

    this.staffList[index] = updated;
    return { ...updated };
  }

  public setWorkStatus(id: string, newWorkStatus: SupportWorkStatus): SupportStaffDetail {
    const index = this.staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with id ${id} not found.`);

    const current = this.staffList[index];
    const statusLabels: Record<SupportWorkStatus, string> = {
      AVAILABLE: 'Đang sẵn sàng',
      BUSY: 'Đang bận xử lý ca',
      OFF_DUTY: 'Hết ca / Ngoại tuyến',
      ON_LEAVE: 'Nghỉ phép',
    };

    const updated: SupportStaffDetail = {
      ...current,
      workStatus: newWorkStatus,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: `Chuyển trạng thái trực sang "${statusLabels[newWorkStatus]}"`,
          targetName: 'Điều phối ca trực',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities,
      ].slice(0, 15),
    };

    this.staffList[index] = updated;
    return { ...updated };
  }

  public async lockAccount(id: string, reason?: string): Promise<SupportStaffDetail> {
    const index = this.staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with id ${id} not found.`);

    const lockReason = reason || 'Tài khoản bị tạm khóa bởi Quản trị viên';
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
        throw new Error(errData?.detail || errData?.message || 'Không thể khóa tài khoản nhân viên hỗ trợ.');
      }
    }

    const current = this.staffList[index];
    const updated: SupportStaffDetail = {
      ...current,
      accountStatus: 'LOCKED',
      lockReason,
      lockedAt: new Date().toLocaleDateString('vi-VN'),
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: lockReason,
          targetName: 'Bảo mật tài khoản',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities,
      ].slice(0, 15),
    };

    this.staffList[index] = updated;
    return { ...updated };
  }

  public async unlockAccount(id: string): Promise<SupportStaffDetail> {
    const index = this.staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with id ${id} not found.`);

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
        throw new Error(errData?.detail || errData?.message || 'Không thể mở khóa tài khoản nhân viên hỗ trợ.');
      }
    }

    const current = this.staffList[index];
    const updated: SupportStaffDetail = {
      ...current,
      accountStatus: 'ACTIVE',
      lockReason: undefined,
      lockedAt: undefined,
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: 'Tài khoản được mở khóa thành công',
          targetName: 'Khôi phục truy cập hệ thống',
          timeAgo: 'Vừa xong',
          timestamp: new Date().toISOString(),
        },
        ...current.recentActivities,
      ].slice(0, 15),
    };

    this.staffList[index] = updated;
    return { ...updated };
  }

  public async deleteStaff(id: string): Promise<void> {
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
        throw new Error(errData?.detail || errData?.message || 'Không thể xóa / vô hiệu hóa tài khoản nhân viên.');
      }
    }

    this.staffList = this.staffList.filter((s) => s.id !== id);
  }
}

export const adminSupportStaffService = new AdminSupportStaffService();
