using System;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Features.AI.DTOs;

namespace ZhongWenHub.Features.AI.Services.Competency;

public interface ICompetencyProfileService
{
    Task<CompetencyProfileDto> GetCompetencyProfileAsync(Guid userId, CancellationToken cancellationToken = default);
}

