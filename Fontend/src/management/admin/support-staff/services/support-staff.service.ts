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

class AdminSupportStaffService {
  private staffList: SupportStaffDetail[] = [...INITIAL_SUPPORT_STAFF_MOCK];

  public getKPIs(): SupportStaffSummaryKPIs {
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

    // Convert full SupportStaffDetail to SupportStaffListItem
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

  public createStaff(dto: CreateSupportStaffDTO): SupportStaffDetail {
    const now = new Date();
    const id = `sp-${Date.now().toString().slice(-4)}`;
    const joinedAt = now.toLocaleDateString('vi-VN');
    const joinedDateRaw = now.toISOString();

    const newStaff: SupportStaffDetail = {
      id,
      name: dto.name.trim(),
      email: dto.email.trim(),
      phone: dto.phone?.trim() || '',
      accountStatus: 'PENDING', // Initial status is PENDING as specified
      workStatus: dto.initialWorkStatus,
      supportScopes: [...dto.supportScopes],
      shift: dto.shift,
      joinedAt,
      joinedDateRaw,
      lastActiveAt: 'Chưa đăng nhập',
      lastActiveDateRaw: joinedDateRaw,
      notes: 'Nhân viên mới tạo, đang chờ kích hoạt tài khoản.',
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
          targetName: 'Hồ sơ nhân viên mới (Chờ kích hoạt)',
          timeAgo: 'Vừa xong',
          timestamp: joinedDateRaw,
        },
      ],
    };

    this.staffList.unshift(newStaff);
    return { ...newStaff };
  }

  public updateStaff(id: string, dto: UpdateSupportStaffDTO): SupportStaffDetail {
    const index = this.staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with id ${id} not found.`);

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

  // DEDICATED WORK STATUS MUTATION - NEVER MODIFIES ACCOUNT STATUS
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

  // ACCOUNT LOCKING - NEVER MODIFIES WORK STATUS
  public lockAccount(id: string, reason?: string): SupportStaffDetail {
    const index = this.staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with id ${id} not found.`);

    const current = this.staffList[index];
    const updated: SupportStaffDetail = {
      ...current,
      accountStatus: 'LOCKED',
      recentActivities: [
        {
          id: `act-${Date.now()}`,
          actionText: reason || 'Tài khoản bị khóa bởi Quản trị viên',
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

  // ACCOUNT UNLOCKING - NEVER MODIFIES WORK STATUS
  public unlockAccount(id: string): SupportStaffDetail {
    const index = this.staffList.findIndex((s) => s.id === id);
    if (index === -1) throw new Error(`Staff with id ${id} not found.`);

    const current = this.staffList[index];
    const updated: SupportStaffDetail = {
      ...current,
      accountStatus: 'ACTIVE',
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
}

export const adminSupportStaffService = new AdminSupportStaffService();
