using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.AILearning.DTOs;

namespace ZhongWenHub.Business.AILearning;

public interface IAILetterWritingService
{
    Task<GeneratedLetterResponseDto> GenerateLetterAsync(
        Guid userId,
        GenerateLetterRequestDto request,
        CancellationToken ct = default);

    Task<List<LetterSummaryDto>> GetHistoryAsync(
        Guid userId,
        int limit = 20,
        CancellationToken ct = default);

    Task<GeneratedLetterResponseDto?> GetLetterDetailAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken ct = default);
}
