using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Learning;
using ZhongWenHub.Business.Learning.DTOs;
using ZhongWenHub.Business.Users;

namespace ZhongWenHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/v1/[controller]")]
public class LearningController : BaseApiController
{
    private readonly ILearningService _learningService;
    private readonly ICurrentUserService _currentUserService;

    public LearningController(ILearningService learningService, ICurrentUserService currentUserService)
    {
        _learningService = learningService;
        _currentUserService = currentUserService;
    }

    private Guid? GetCurrentUserId() => _currentUserService.UserId;

    [HttpGet("me")]
    public async Task<ActionResult<StudentLearningStateDto>> GetMyState(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.GetStudentLearningStateAsync(userId.Value, cancellationToken);
        return Ok(state);
    }

    [HttpPut("me/preferences")]
    public async Task<ActionResult<StudentLearningStateDto>> UpdateMyPreferences(
        [FromBody] UpdateLearningPreferencesDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.UpdatePreferencesAsync(userId.Value, dto, cancellationToken);
        return Ok(state);
    }

    [HttpGet("me/lessons")]
    public async Task<ActionResult<List<LessonProgressDto>>> GetMyLessons(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var lessons = await _learningService.GetLessonProgressesAsync(userId.Value, cancellationToken);
        return Ok(lessons);
    }

    [HttpPut("me/lessons/{lessonId}/progress")]
    public async Task<ActionResult<LessonProgressDto>> UpdateLessonStep(
        [FromRoute] string lessonId,
        [FromBody] UpdateLessonStepDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var result = await _learningService.UpdateLessonStepAsync(userId.Value, lessonId, dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("me/lessons/{lessonId}/complete")]
    public async Task<ActionResult<StudentLearningStateDto>> CompleteLesson(
        [FromRoute] string lessonId,
        [FromBody] CompleteLessonDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.CompleteLessonAsync(userId.Value, lessonId, dto, cancellationToken);
        return Ok(state);
    }

    [HttpGet("me/activities")]
    public async Task<ActionResult<Dictionary<string, DailyActivityDto>>> GetMyActivities(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var activities = await _learningService.GetDailyActivitiesAsync(userId.Value, cancellationToken);
        return Ok(activities);
    }

    [HttpPost("me/practice-attempts")]
    public async Task<ActionResult<StudentLearningStateDto>> RecordPracticeAttempt(
        [FromBody] RecordPracticeAttemptDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.RecordPracticeAttemptAsync(userId.Value, dto, cancellationToken);
        return Ok(state);
    }

    [HttpPost("me/practice-sessions")]
    public async Task<ActionResult<StudentLearningStateDto>> RecordPracticeSession(
        [FromBody] PracticeSessionResultDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.RecordPracticeSessionAsync(userId.Value, dto, cancellationToken);
        return Ok(state);
    }

    [HttpGet("me/vocabulary")]
    public async Task<ActionResult<Dictionary<string, UserVocabularyStateDto>>> GetVocabularyProgress(CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var vocab = await _learningService.GetVocabularyProgressAsync(userId.Value, cancellationToken);
        return Ok(vocab);
    }

    [HttpPost("me/vocabulary/reviews")]
    public async Task<ActionResult<StudentLearningStateDto>> RecordSrsReview(
        [FromBody] SrsReviewRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.RecordSrsReviewAsync(userId.Value, dto, cancellationToken);
        return Ok(state);
    }

    [HttpPost("me/vocabulary/session-complete")]
    public async Task<ActionResult<StudentLearningStateDto>> CompleteSrsSession(
        [FromBody] CompleteSrsSessionDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.CompleteSrsSessionAsync(userId.Value, dto, cancellationToken);
        return Ok(state);
    }

    [HttpPost("me/vocabulary")]
    public async Task<ActionResult<StudentLearningStateDto>> AddVocabulary(
        [FromBody] AddVocabularyRequestDto dto,
        CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue)
        {
            return Unauthorized(new { message = "Người dùng chưa xác thực." });
        }

        var state = await _learningService.AddVocabularyAsync(userId.Value, dto, cancellationToken);
        return Ok(state);
    }
}
