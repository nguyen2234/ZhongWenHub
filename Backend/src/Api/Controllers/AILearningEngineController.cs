using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Users;

namespace ZhongWenHub.Api.Controllers;

[Authorize(Policy = PolicyConstants.StudentAccess)]
[ApiController]
[Route("api/v1/ai")]
[EnableRateLimiting("AITutorRateLimit")]
public class AILearningEngineController : BaseApiController
{
    private readonly IAIConversationService _conversationService;
    private readonly IAIExerciseService _exerciseService;
    private readonly IAIErrorAnalysisService _errorAnalysisService;
    private readonly IPersonalizedLearningService _personalizedLearningService;
    private readonly ICurrentUserService _currentUserService;

    public AILearningEngineController(
        IAIConversationService conversationService,
        IAIExerciseService exerciseService,
        IAIErrorAnalysisService errorAnalysisService,
        IPersonalizedLearningService personalizedLearningService,
        ICurrentUserService currentUserService)
    {
        _conversationService = conversationService;
        _exerciseService = exerciseService;
        _errorAnalysisService = errorAnalysisService;
        _personalizedLearningService = personalizedLearningService;
        _currentUserService = currentUserService;
    }

    // ==================== CONVERSATION ====================

    [HttpGet("conversations/scenarios")]
    [ProducesResponseType(typeof(IReadOnlyList<ConversationScenarioDto>), StatusCodes.Status200OK)]
    public IActionResult GetScenarios() => Ok(_conversationService.GetScenarios());

    [HttpGet("conversations")]
    [ProducesResponseType(typeof(List<AiConversationSessionDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListConversations(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();
        return Ok(await _conversationService.ListSessionsAsync(userId.Value, cancellationToken));
    }

    [HttpGet("conversations/{sessionId:guid}")]
    [ProducesResponseType(typeof(AiConversationSessionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetConversation(Guid sessionId, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _conversationService.GetSessionDetailAsync(userId.Value, sessionId, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy phiên hội thoại", ex.Message);
        }
    }

    [HttpPost("conversations/start")]
    [ProducesResponseType(typeof(AiConversationSessionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> StartConversation(
        [FromBody] StartConversationRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _conversationService.StartSessionAsync(userId.Value, request, cancellationToken));
        }
        catch (AITutorException ex)
        {
            return ProblemDetailsResult(ex.StatusCode, ex.Title, ex.Message);
        }
    }

    [HttpPost("conversations/{sessionId:guid}/messages")]
    [ProducesResponseType(typeof(AiConversationSessionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendConversationMessage(
        Guid sessionId,
        [FromBody] SendConversationMessageRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _conversationService.SendMessageAsync(userId.Value, sessionId, request, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy phiên hội thoại", ex.Message);
        }
        catch (AITutorException ex)
        {
            return ProblemDetailsResult(ex.StatusCode, ex.Title, ex.Message);
        }
    }

    [HttpPut("conversations/{sessionId:guid}/preferences")]
    [HttpPatch("conversations/{sessionId:guid}/preferences")]
    [ProducesResponseType(typeof(AiConversationSessionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateConversationPreferences(
        Guid sessionId,
        [FromBody] UpdateConversationPreferencesDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _conversationService.UpdatePreferencesAsync(userId.Value, sessionId, request, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy phiên hội thoại", ex.Message);
        }
    }

    [HttpPost("conversations/{sessionId:guid}/end")]
    [ProducesResponseType(typeof(AiConversationSessionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> EndConversation(Guid sessionId, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _conversationService.EndSessionAsync(userId.Value, sessionId, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy phiên hội thoại", ex.Message);
        }
    }

    // ==================== AI EXERCISES ====================

    [HttpGet("exercises")]
    [ProducesResponseType(typeof(List<AiGeneratedExerciseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ListExercises(
        [FromQuery] int? hskLevel,
        [FromQuery] Guid? lessonId,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        return Ok(await _exerciseService.ListMyExercisesAsync(userId.Value, hskLevel, lessonId, cancellationToken));
    }

    [HttpPost("exercises/generate")]
    [ProducesResponseType(typeof(List<AiGeneratedExerciseDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateExercises(
        [FromBody] GenerateAiExercisesRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _exerciseService.GenerateExercisesAsync(userId.Value, request, cancellationToken));
        }
        catch (AITutorException ex)
        {
            return ProblemDetailsResult(ex.StatusCode, ex.Title, ex.Message);
        }
    }

    [HttpPost("exercises/{exerciseId:guid}/attempts")]
    [ProducesResponseType(typeof(AiExerciseAttemptResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitExerciseAttempt(
        Guid exerciseId,
        [FromBody] SubmitAiExerciseAttemptDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _exerciseService.SubmitAttemptAsync(userId.Value, exerciseId, request, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy bài tập AI", ex.Message);
        }
    }

    // ==================== ERROR ANALYSIS & PERSONALIZED LEARNING ====================

    [HttpGet("error-analysis")]
    [ProducesResponseType(typeof(ErrorAnalysisReportDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetErrorAnalysis(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        return Ok(await _errorAnalysisService.GetErrorAnalysisAsync(userId.Value, cancellationToken));
    }

    [HttpGet("recommendations")]
    [ProducesResponseType(typeof(PersonalizedLearningPlanDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPersonalizedPlan(
        [FromQuery] bool explain = false,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        return Ok(await _personalizedLearningService.GetPersonalizedPlanAsync(userId.Value, explain, cancellationToken));
    }
}
