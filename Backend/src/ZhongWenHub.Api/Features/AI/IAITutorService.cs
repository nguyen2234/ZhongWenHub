using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Business.AITutor.DTOs;

namespace ZhongWenHub.Business.AITutor;

public interface IAITutorService
{
    Task<AITutorChatResponseDto> ChatAsync(
        Guid userId,
        AITutorChatRequestDto request,
        CancellationToken cancellationToken = default);

    Task<List<AITutorSessionSummaryDto>> GetSessionsAsync(
        Guid userId,
        int limit = 20,
        CancellationToken ct = default);

    Task<AITutorSessionDetailDto?> GetSessionDetailAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken ct = default);

    Task<Guid> CreateSessionAsync(
        Guid userId,
        CreateAITutorSessionDto dto,
        CancellationToken ct = default);

    Task<bool> DeleteSessionAsync(
        Guid userId,
        Guid sessionId,
        CancellationToken ct = default);
}

