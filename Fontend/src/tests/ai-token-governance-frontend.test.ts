import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { aiGovernanceService, type AiFeatureGovernance, type UpdateAiFeatureGovernancePayload } from '../management/admin/services/ai-governance.service';

describe('AI Token Governance Frontend Service & Contracts', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('getOverview fetches all 3 feature groups from /api/v1/admin/ai-governance/overview', async () => {
    const mockData: AiFeatureGovernance[] = [
      {
        id: 'gov-1',
        featureGroup: 'AI_LETTER_WRITING',
        displayNameVi: 'Viết thư bằng AI',
        descriptionVi: 'Trợ lý biên soạn thư',
        isEnabled: true,
        dailyTokenQuota: 300000,
        monthlyTokenQuota: 9000000,
        userDailyRequestLimit: 20,
        maxTokensPerRequest: 2048,
        tokensUsedToday: 15000,
        tokensUsedThisMonth: 120000,
        requestsToday: 10,
        updatedAt: '2026-11-23T12:00:00Z',
      },
      {
        id: 'gov-2',
        featureGroup: 'AI_TUTOR',
        displayNameVi: 'Trợ giảng AI',
        descriptionVi: 'Gia sư giải đáp thắc mắc',
        isEnabled: true,
        dailyTokenQuota: 1000000,
        monthlyTokenQuota: 30000000,
        userDailyRequestLimit: 50,
        maxTokensPerRequest: 2048,
        tokensUsedToday: 80000,
        tokensUsedThisMonth: 650000,
        requestsToday: 42,
        updatedAt: '2026-11-23T12:00:00Z',
      },
      {
        id: 'gov-3',
        featureGroup: 'AI_CONVERSATION',
        displayNameVi: 'Hội thoại AI',
        descriptionVi: 'Luyện phản xạ giao tiếp',
        isEnabled: false,
        dailyTokenQuota: 800000,
        monthlyTokenQuota: 24000000,
        userDailyRequestLimit: 40,
        maxTokensPerRequest: 1024,
        tokensUsedToday: 0,
        tokensUsedThisMonth: 25000,
        requestsToday: 0,
        updatedAt: '2026-11-23T12:00:00Z',
      },
    ];

    globalThis.fetch = mock(() =>
      Promise.resolve(new Response(JSON.stringify(mockData), { status: 200, headers: { 'Content-Type': 'application/json' } }))
    ) as any;

    const result = await aiGovernanceService.getOverview();
    expect(result).toHaveLength(3);
    expect(result[0].featureGroup).toBe('AI_LETTER_WRITING');
    expect(result[1].featureGroup).toBe('AI_TUTOR');
    expect(result[2].featureGroup).toBe('AI_CONVERSATION');
    expect(result[2].isEnabled).toBe(false);
  });

  it('updateGovernance sends PUT request to /api/v1/admin/ai-governance/:featureGroup with updated quota and circuit breaker', async () => {
    let capturedUrl = '';
    let capturedMethod = '';
    let capturedBody = '';

    const payload: UpdateAiFeatureGovernancePayload = {
      isEnabled: true,
      dailyTokenQuota: 500000,
      monthlyTokenQuota: 15000000,
      userDailyRequestLimit: 30,
      maxTokensPerRequest: 4096,
    };

    globalThis.fetch = mock((url: string, init?: RequestInit) => {
      capturedUrl = url;
      capturedMethod = init?.method || '';
      capturedBody = init?.body as string;

      return Promise.resolve(
        new Response(
          JSON.stringify({
            id: 'gov-1',
            featureGroup: 'AI_LETTER_WRITING',
            displayNameVi: 'Viết thư bằng AI',
            ...payload,
            tokensUsedToday: 0,
            tokensUsedThisMonth: 0,
            requestsToday: 0,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      );
    }) as any;

    const updated = await aiGovernanceService.updateGovernance('AI_LETTER_WRITING', payload);
    expect(capturedUrl).toContain('/admin/ai-governance/AI_LETTER_WRITING');
    expect(capturedMethod).toBe('PUT');
    expect(JSON.parse(capturedBody)).toEqual(payload);
    expect(updated.dailyTokenQuota).toBe(500000);
    expect(updated.maxTokensPerRequest).toBe(4096);
  });

  it('updateGovernance throws descriptive Error when API responds with 400 or 500', async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify({ message: 'Daily quota must be at least 10,000 tokens' }), {
          status: 400,
          statusText: 'Bad Request',
        })
      )
    ) as any;

    await expect(
      aiGovernanceService.updateGovernance('AI_TUTOR', {
        isEnabled: true,
        dailyTokenQuota: 1000,
        monthlyTokenQuota: 100000,
        userDailyRequestLimit: 10,
        maxTokensPerRequest: 1024,
      })
    ).rejects.toThrow('Cập nhật cấu hình thất bại (400)');
  });
});
