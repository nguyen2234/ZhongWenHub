using System;
using System.Collections.Generic;
using System.IO;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.AILearning.DTOs;

namespace ZhongWenHub.Business.AILearning.Services.Speech;

public interface IAISpeakingService
{
    Task<List<SpeakingPracticeItemDto>> GetPracticeItemsAsync(
        int hskLevel,
        string practiceType,
        CancellationToken cancellationToken = default);

    Task<SpeakingAssessmentResultDto> SubmitPracticeAsync(
        Guid userId,
        SubmitSpeakingPracticeDto request,
        Stream? audioStream,
        string? contentType,
        CancellationToken cancellationToken = default);

    Task<List<SpeakingAssessmentResultDto>> GetHistoryAsync(
        Guid userId,
        int limit = 20,
        CancellationToken cancellationToken = default);

    Task<SpeakingStatsDto> GetStatsAsync(
        Guid userId,
        CancellationToken cancellationToken = default);
}

