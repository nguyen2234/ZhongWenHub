using ZhongWenHub.Features.AI.DTOs;

namespace ZhongWenHub.Features.AI;

public interface IAITutorService
{
    Task<AITutorChatResponseDto> ChatAsync(
        Guid userId,
        AITutorChatRequestDto request,
        CancellationToken cancellationToken = default);
}

