using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ZhongWenHub.Features.AI;
using ZhongWenHub.Features.AI.DTOs;
using ZhongWenHub.Common.Authorization;
using ZhongWenHub.Features.Admin.Users;

namespace ZhongWenHub.Features.AI;

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
}
