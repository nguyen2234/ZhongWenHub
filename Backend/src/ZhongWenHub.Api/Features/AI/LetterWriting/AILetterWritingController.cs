using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ZhongWenHub.Api.Controllers;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Users;

namespace ZhongWenHub.Api.Features.AI.LetterWriting;

[Authorize(Policy = PolicyConstants.StudentAccess)]
[ApiController]
[Route("api/v1/ai/letters")]
[EnableRateLimiting("AITutorRateLimit")]
public class AILetterWritingController : BaseApiController
{
    private readonly IAILetterWritingService _letterWritingService;
    private readonly ICurrentUserService _currentUserService;

    public AILetterWritingController(
        IAILetterWritingService letterWritingService,
        ICurrentUserService currentUserService)
    {
        _letterWritingService = letterWritingService;
        _currentUserService = currentUserService;
    }

    [HttpPost("generate")]
    [ProducesResponseType(typeof(GeneratedLetterResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status429TooManyRequests)]
    public async Task<IActionResult> Generate(
        [FromBody] GenerateLetterRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        try
        {
            var response = await _letterWritingService.GenerateLetterAsync(userId.Value, request, cancellationToken);
            return Ok(response);
        }
        catch (AITutorException ex)
        {
            return ProblemDetailsResult(ex.StatusCode, ex.Title, ex.Message);
        }
    }

    [HttpGet("history")]
    [ProducesResponseType(typeof(List<LetterSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetHistory(
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var list = await _letterWritingService.GetHistoryAsync(userId.Value, limit, cancellationToken);
        return Ok(list);
    }

    [HttpGet("{sessionId:guid}")]
    [ProducesResponseType(typeof(GeneratedLetterResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetDetail(
        Guid sessionId,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return Unauthorized();
        }

        var detail = await _letterWritingService.GetLetterDetailAsync(userId.Value, sessionId, cancellationToken);
        if (detail == null)
        {
            return NotFound(new { message = "Không tìm thấy nội dung bức thư." });
        }

        return Ok(detail);
    }
}
