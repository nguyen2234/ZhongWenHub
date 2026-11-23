using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.AITutor.DTOs;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Users;

namespace ZhongWenHub.Api.Controllers;

[Authorize(Policy = PolicyConstants.StudentAccess)]
[ApiController]
[Route("api/v1/ai-tutor")]
[EnableRateLimiting("AITutorRateLimit")]
public class AITutorController : BaseApiController
{
    private readonly IAITutorService _aiTutorService;
    private readonly ICurrentUserService _currentUserService;

    public AITutorController(
        IAITutorService aiTutorService,
        ICurrentUserService currentUserService)
    {
        _aiTutorService = aiTutorService;
        _currentUserService = currentUserService;
    }

    [HttpPost("chat")]
    [ProducesResponseType(typeof(AITutorChatResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> Chat(
        [FromBody] AITutorChatRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var response = await _aiTutorService.ChatAsync(userId.Value, request, cancellationToken);
            return Ok(response);
        }
        catch (AITutorException ex)
        {
            return ProblemDetailsResult(ex.StatusCode, ex.Title, ex.Message);
        }
    }

    [HttpGet("sessions")]
    [ProducesResponseType(typeof(List<AITutorSessionSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSessions(
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var sessions = await _aiTutorService.GetSessionsAsync(userId.Value, limit, cancellationToken);
        return Ok(sessions);
    }

    [HttpPost("sessions")]
    [ProducesResponseType(typeof(object), StatusCodes.Status200OK)]
    public async Task<IActionResult> CreateSession(
        [FromBody] CreateAITutorSessionDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var sessionId = await _aiTutorService.CreateSessionAsync(userId.Value, dto, cancellationToken);
        return Ok(new { sessionId });
    }

    [HttpGet("sessions/{id:guid}")]
    [ProducesResponseType(typeof(AITutorSessionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSessionDetail(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var detail = await _aiTutorService.GetSessionDetailAsync(userId.Value, id, cancellationToken);
        if (detail == null)
        {
            return NotFound(new { message = "Không tìm thấy phiên hội thoại với Trợ giảng AI." });
        }

        return Ok(detail);
    }

    [HttpDelete("sessions/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteSession(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var deleted = await _aiTutorService.DeleteSessionAsync(userId.Value, id, cancellationToken);
        if (!deleted)
        {
            return NotFound(new { message = "Không tìm thấy phiên hội thoại để xóa." });
        }

        return NoContent();
    }
}
