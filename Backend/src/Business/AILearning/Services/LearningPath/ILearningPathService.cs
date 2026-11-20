using System;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.AILearning.DTOs;

namespace ZhongWenHub.Business.AILearning.Services.LearningPath;

public interface ILearningPathService
{
    Task<LearningGoalDto> GetLearningGoalAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<LearningGoalDto> UpdateLearningGoalAsync(Guid userId, UpdateLearningGoalDto request, CancellationToken cancellationToken = default);
    Task<PersonalizedLearningPathDto> GenerateLearningPathAsync(Guid userId, GenerateLearningPathRequestDto request, CancellationToken cancellationToken = default);
    Task<PersonalizedLearningPathDto?> GetCurrentLearningPathAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<DailyPlanDto> GetTodayPlanAsync(Guid userId, CancellationToken cancellationToken = default);
    Task<CompleteTaskResponseDto> CompleteTaskAsync(Guid userId, Guid taskId, CancellationToken cancellationToken = default);
    Task<DailyPlanDto> ReplanTodayAsync(Guid userId, AdaptiveReplanRequestDto? request = null, CancellationToken cancellationToken = default);
    Task<PersonalizedLearningProgressDto> GetProgressAsync(Guid userId, CancellationToken cancellationToken = default);
}

