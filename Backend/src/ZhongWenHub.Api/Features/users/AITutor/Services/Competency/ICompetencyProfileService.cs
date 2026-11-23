using System;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.AILearning.DTOs;

namespace ZhongWenHub.Business.AILearning.Services.Competency;

public interface ICompetencyProfileService
{
    Task<CompetencyProfileDto> GetCompetencyProfileAsync(Guid userId, CancellationToken cancellationToken = default);
}

