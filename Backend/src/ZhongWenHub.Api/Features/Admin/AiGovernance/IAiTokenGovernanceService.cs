using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Features.admin.AiGovernance.DTO;

namespace ZhongWenHub.Features.admin.AiGovernance;

public sealed record AiTokenReservation(
    Guid ReservationId,
    string FeatureGroup,
    int EstimatedTokens,
    int MaxAllowedOutputTokens);

public interface IAiTokenGovernanceService
{
    Task<AiTokenReservation> ReserveQuotaAsync(
        Guid userId,
        string feature,
        int estimatedTokens = 1000,
        CancellationToken ct = default);

    Task SettleQuotaAsync(
        Guid reservationId,
        AIProviderResponse? response,
        bool success,
        string? errorCode = null,
        CancellationToken ct = default);

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
