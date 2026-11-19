import { authTokenService } from '../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

export interface AIServiceModel {
  id: string;
  name: string;
  role: string;
  provider: string;
  latencyMs: number;
  uptime: string;
  usagePercent: number;
  status: 'HEALTHY' | 'DEGRADED' | 'MAINTENANCE';
  description: string;
  totalEvents?: number;
}

export interface AIOperationsStats {
  totalRequests: number;
  averageLatencyMs: number;
  successRate: number;
  totalTokens: number;
  services: AIServiceModel[];
}

export interface HskDistributionItem {
  level: string;
  count: number;
  percentage: number;
  color: string;
}

export interface SkillMetricItem {
  skill: string;
  hours: number;
  avgScore: number;
}

export interface AnalyticsReport {
  activeStudents: number;
  completionRate: number;
  learningHours: number;
  retentionRate: number;
  hskDistribution: HskDistributionItem[];
  skillMetrics: SkillMetricItem[];
}

export interface SystemSettings {
  platformName: string;
  contactEmail: string;
  slogan: string;
  defaultLanguage: string;
  timezone: string;
  maxLoginAttempts: number;
  sessionTimeoutMinutes: number;
  require2FA: boolean;
  systemNotice: string;
  isMaintenanceMode: boolean;
  lastUpdatedAt?: string;
}

class AdminOperationsService {
  private getHeaders(): Record<string, string> {
    const token = authTokenService.getAccessToken();
    const headers: Record<string, string> = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  public async getAIOperationsStats(): Promise<AIOperationsStats | null> {
    try {
      const res = await fetch(getApiUrl('admin/operations/ai-stats'), {
        headers: this.getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async getAnalyticsReport(range: string = '30d'): Promise<AnalyticsReport | null> {
    try {
      const res = await fetch(getApiUrl(`admin/operations/analytics?range=${encodeURIComponent(range)}`), {
        headers: this.getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async getSystemSettings(): Promise<SystemSettings | null> {
    try {
      const res = await fetch(getApiUrl('admin/operations/settings'), {
        headers: this.getHeaders(),
        credentials: 'include',
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  public async updateSystemSettings(settings: SystemSettings): Promise<SystemSettings> {
    const res = await fetch(getApiUrl('admin/operations/settings'), {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(settings),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Lưu cấu hình thất bại (HTTP ${res.status}).`);
    }

    return await res.json();
  }
}

export const adminOperationsService = new AdminOperationsService();
