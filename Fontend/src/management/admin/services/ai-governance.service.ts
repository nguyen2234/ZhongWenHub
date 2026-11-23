import { authTokenService } from '../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

export interface AiFeatureGovernance {
  id: string;
  featureGroup: string;
  displayNameVi: string;
  descriptionVi?: string | null;
  isEnabled: boolean;
  dailyTokenQuota: number;
  monthlyTokenQuota: number;
  userDailyRequestLimit: number;
  maxTokensPerRequest: number;
  tokensUsedToday: number;
  tokensUsedThisMonth: number;
  requestsToday: number;
  updatedAt?: string | null;
}

export interface UpdateAiFeatureGovernancePayload {
  isEnabled: boolean;
  dailyTokenQuota: number;
  monthlyTokenQuota: number;
  userDailyRequestLimit: number;
  maxTokensPerRequest: number;
}

class AiGovernanceService {
  private getHeaders(): Record<string, string> {
    const token = authTokenService.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return headers;
  }

  async getOverview(): Promise<AiFeatureGovernance[]> {
    const url = getApiUrl('admin/ai-governance/overview');
    const res = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Không thể tải cấu hình AI Governance (${res.status}): ${errText || res.statusText}`);
    }

    return res.json();
  }

  async updateGovernance(
    featureGroup: string,
    payload: UpdateAiFeatureGovernancePayload
  ): Promise<AiFeatureGovernance> {
    const url = getApiUrl(`admin/ai-governance/${encodeURIComponent(featureGroup)}`);
    const res = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Cập nhật cấu hình thất bại (${res.status}): ${errText || res.statusText}`);
    }

    return res.json();
  }
}

export const aiGovernanceService = new AiGovernanceService();
