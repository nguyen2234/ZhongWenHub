using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Features.admin.AiGovernance.DTO;

namespace ZhongWenHub.Features.admin.AiGovernance;

public interface IAiTokenGovernanceService
{
    Task EnsureQuotaAvailableAsync(
        Guid userId,
        string feature,
        int estimatedTokens = 1000,
        CancellationToken ct = default);

    Task<List<AiFeatureGovernanceDto>> GetGovernanceOverviewAsync(CancellationToken ct = default);

    Task<AiFeatureGovernanceDto> UpdateGovernanceAsync(
        string featureGroup,
        UpdateAiFeatureGovernanceDto dto,
        CancellationToken ct = default);
}
