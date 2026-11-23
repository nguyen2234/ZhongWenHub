using ZhongWenHub.Business.AITutor.DTOs;

namespace ZhongWenHub.Business.AITutor;

public interface IAITutorService
{
    Task<AITutorChatResponseDto> ChatAsync(
        Guid userId,
        AITutorChatRequestDto request,
        CancellationToken cancellationToken = default);
}

