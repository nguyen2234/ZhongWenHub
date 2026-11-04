import { authTokenService } from '../../../core/api/client/auth-token.service';
import type { RecentUser } from '../types/dashboard.types';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

export interface AdminDashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalStaff: number;
  totalCourses?: number | null;
  totalClasses?: number | null;
  pendingSupportTickets?: number | null;
  activeUsers: number;
  lockedUsers: number;
  newUsers30d: number;
}

class AdminDashboardService {
  public async fetchDashboardStats(): Promise<AdminDashboardStats | null> {
    try {
      const token = authTokenService.getAccessToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl('admin/dashboard/stats'), {
        headers,
        credentials: 'include',
      });

      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async fetchRecentUsers(limit: number = 5): Promise<RecentUser[] | null> {
    try {
      const token = authTokenService.getAccessToken();
      const headers: Record<string, string> = { Accept: 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(getApiUrl(`admin/users?page=1&pageSize=${limit}`), {
        headers,
        credentials: 'include',
      });

      if (!res.ok) return null;
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) return null;

      return data.items.map((item: any) => ({
        id: item.id,
        name: item.name || 'Người dùng',
        email: item.email,
        hskLevel: item.hskLevel || 'HSK 1',
        joinedAt: item.joinedAt || 'Hôm nay',
        status: (item.status === 'ACTIVE' ? 'active' : item.status === 'PENDING' ? 'pending' : 'inactive') as 'active' | 'inactive' | 'pending',
      }));
    } catch {
      return null;
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
