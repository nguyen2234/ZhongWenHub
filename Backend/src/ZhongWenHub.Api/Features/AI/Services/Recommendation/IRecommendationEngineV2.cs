using System;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Features.AI.DTOs;

namespace ZhongWenHub.Features.AI.Services.Recommendation;

public interface IRecommendationEngineV2
{
    Task<PersonalizedLearningPlanV2Dto> GetPlanV2Async(
        Guid userId,
        int? availableMinutes = null,
        bool explainWithAi = false,
        CancellationToken cancellationToken = default);
}

