using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.Admin.DTOs;

namespace ZhongWenHub.Business.Admin.Services;

public interface IAiProviderConfigService
{
    Task<List<AiProviderConfigDto>> GetProvidersAsync(CancellationToken cancellationToken = default);
    Task<AiProviderConfigDto?> GetProviderByIdAsync(Guid id, CancellationToken cancellationToken = default);
    Task<AiProviderConfigDto> CreateProviderAsync(CreateAiProviderDto dto, CancellationToken cancellationToken = default);
    Task<AiProviderConfigDto> UpdateProviderAsync(Guid id, UpdateAiProviderDto dto, CancellationToken cancellationToken = default);
    Task<AiProviderConfigDto> ToggleProviderAsync(Guid id, bool isEnabled, CancellationToken cancellationToken = default);
    Task<TestAiProviderResultDto> TestConnectionAsync(Guid id, CancellationToken cancellationToken = default);
}
