import { authTokenService } from '../../../core/api/client/auth-token.service';

function getApiUrl(endpoint: string): string {
  const base = (import.meta.env?.VITE_API_BASE_URL as string) || '/api/v1';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanEndpoint = endpoint.replace(/^\/+/, '');
  return `${cleanBase}/${cleanEndpoint}`;
}

export interface AiProviderConfig {
  id: string;
  name: string;
  providerType: 'GEMINI' | 'OPENAI' | 'OPENAI_COMPATIBLE';
  baseUrl?: string | null;
  maskedApiKey: string;
  defaultModel: string;
  capabilities: string[];
  isEnabled: boolean;
  priority: number;
  timeoutSeconds: number;
  maxRetries: number;
  maxTokens?: number | null;
  temperature?: number | null;
  lastHealthStatus: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' | 'UNCHECKED';
  lastHealthMessage?: string | null;
  lastCheckedAt?: string | null;
  createdAt: string;
  updatedAt?: string | null;
}

export interface CreateAiProviderPayload {
  name: string;
  providerType: string;
  baseUrl?: string;
  apiKey: string;
  defaultModel: string;
  capabilities?: string[];
  isEnabled?: boolean;
  priority?: number;
  timeoutSeconds?: number;
  maxRetries?: number;
  maxTokens?: number | null;
  temperature?: number | null;
}

export interface UpdateAiProviderPayload {
  name: string;
  providerType: string;
  baseUrl?: string;
  apiKey?: string;
  defaultModel: string;
  capabilities?: string[];
  isEnabled?: boolean;
  priority?: number;
  timeoutSeconds?: number;
  maxRetries?: number;
  maxTokens?: number | null;
  temperature?: number | null;
}

export interface TestConnectionResult {
  isSuccess: boolean;
  statusCode: number;
  latencyMs: number;
  message: string;
  status: string;
  testedAt: string;
}

export interface AiUsageSummary {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalTokens: number;
  averageLatencyMs: number;
  providers: Array<{
    provider: string;
    requests: number;
    successRequests: number;
    totalTokens: number;
    averageLatencyMs: number;
  }>;
}

class AiProviderService {
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

  public async getAll(): Promise<AiProviderConfig[]> {
    const res = await fetch(getApiUrl('admin/ai-providers'), {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Tải danh sách AI Provider thất bại (HTTP ${res.status}).`);
    }
    return await res.json();
  }

  public async getById(id: string): Promise<AiProviderConfig> {
    const res = await fetch(getApiUrl(`admin/ai-providers/${id}`), {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Tải thông tin AI Provider thất bại (HTTP ${res.status}).`);
    }
    return await res.json();
  }

  public async create(payload: CreateAiProviderPayload): Promise<AiProviderConfig> {
    const res = await fetch(getApiUrl('admin/ai-providers'), {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Thêm AI Provider thất bại (HTTP ${res.status}).`);
    }
    return await res.json();
  }

  public async update(id: string, payload: UpdateAiProviderPayload): Promise<AiProviderConfig> {
    const res = await fetch(getApiUrl(`admin/ai-providers/${id}`), {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Cập nhật AI Provider thất bại (HTTP ${res.status}).`);
    }
    return await res.json();
  }

  public async delete(id: string): Promise<void> {
    const res = await fetch(getApiUrl(`admin/ai-providers/${id}`), {
      method: 'DELETE',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Xóa AI Provider thất bại (HTTP ${res.status}).`);
    }
  }

  public async toggleEnabled(id: string, isEnabled: boolean): Promise<void> {
    const res = await fetch(getApiUrl(`admin/ai-providers/${id}/enabled`), {
      method: 'PATCH',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ isEnabled }),
    });
    if (!res.ok) {
      throw new Error(`Cập nhật trạng thái kích hoạt thất bại (HTTP ${res.status}).`);
    }
  }

  public async testConnection(id: string): Promise<TestConnectionResult> {
    const res = await fetch(getApiUrl(`admin/ai-providers/${id}/test`), {
      method: 'POST',
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.detail || err?.message || `Kiểm tra kết nối thất bại (HTTP ${res.status}).`);
    }
    return await res.json();
  }

  public async updatePriorities(priorities: Array<{ id: string; priority: number }>): Promise<void> {
    const res = await fetch(getApiUrl('admin/ai-providers/priorities'), {
      method: 'PUT',
      headers: this.getHeaders(),
      credentials: 'include',
      body: JSON.stringify({ priorities }),
    });
    if (!res.ok) {
      throw new Error(`Cập nhật thứ tự ưu tiên thất bại (HTTP ${res.status}).`);
    }
  }

  public async getUsageSummary(days: number = 7): Promise<AiUsageSummary> {
    const res = await fetch(getApiUrl(`admin/ai-providers/usage?days=${days}`), {
      headers: this.getHeaders(),
      credentials: 'include',
    });
    if (!res.ok) {
      throw new Error(`Tải dữ liệu sử dụng AI thất bại (HTTP ${res.status}).`);
    }
    return await res.json();
  }
}

export const aiProviderService = new AiProviderService();
