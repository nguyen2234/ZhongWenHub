using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Features.admin.AiProviders.DTO;

namespace ZhongWenHub.Features.Admin.AiProviders;

public interface IAiProviderManagementService
{
    Task<List<AiProviderResponse>> GetAllAsync(CancellationToken ct = default);
    Task<AiProviderResponse?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<AiProviderResponse> CreateAsync(CreateAiProviderRequest request, CancellationToken ct = default);
    Task<AiProviderResponse?> UpdateAsync(Guid id, UpdateAiProviderRequest request, CancellationToken ct = default);
    Task<bool> DeleteAsync(Guid id, CancellationToken ct = default);
    Task<bool> ToggleEnabledAsync(Guid id, bool isEnabled, CancellationToken ct = default);
    Task UpdatePrioritiesAsync(UpdateProviderPrioritiesRequest request, CancellationToken ct = default);
    Task<TestProviderResponse> TestConnectionAsync(Guid id, CancellationToken ct = default);
    Task<AiUsageSummaryDto> GetUsageSummaryAsync(int days = 7, CancellationToken ct = default);
}
