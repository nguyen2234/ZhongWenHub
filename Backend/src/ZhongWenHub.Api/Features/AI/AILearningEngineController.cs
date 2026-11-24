using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.RateLimiting;
using ZhongWenHub.Features.AI;
using ZhongWenHub.Features.AI.DTOs;
using ZhongWenHub.Features.AI.Services.Competency;
using ZhongWenHub.Features.AI.Services.Diagnostic;
using ZhongWenHub.Features.AI.Services.Recommendation;
using ZhongWenHub.Features.AI.Services.Speech;
using ZhongWenHub.Common.Authorization;
using ZhongWenHub.Features.Admin.Users;

namespace ZhongWenHub.Features.AI;

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
    private readonly ICompetencyProfileService _competencyService;
    private readonly IRecommendationEngineV2 _recommendationEngineV2;
    private readonly IDiagnosticAssessmentService _diagnosticService;
    private readonly ICurrentUserService _currentUserService;

    public AILearningEngineController(
        IAIConversationService conversationService,
        IAIExerciseService exerciseService,
        IAIErrorAnalysisService errorAnalysisService,
        IPersonalizedLearningService personalizedLearningService,
        ICompetencyProfileService competencyService,
        IRecommendationEngineV2 recommendationEngineV2,
        IDiagnosticAssessmentService diagnosticService,
        ICurrentUserService currentUserService)
    {
        _conversationService = conversationService;
        _exerciseService = exerciseService;
        _errorAnalysisService = errorAnalysisService;
        _personalizedLearningService = personalizedLearningService;
        _competencyService = competencyService;
        _recommendationEngineV2 = recommendationEngineV2;
        _diagnosticService = diagnosticService;
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

    [HttpPost("conversations/{sessionId:guid}/messages/audio")]
    [Consumes("multipart/form-data")]
    [ProducesResponseType(typeof(AiConversationSessionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SendConversationAudioMessage(
        Guid sessionId,
        [FromForm] SendConversationAudioFormRequest form,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        if (form.Audio == null || form.Audio.Length == 0)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Yêu cầu không hợp lệ", "Tệp âm thanh ghi âm không được để trống.");
        }

        try
        {
            await using var stream = form.Audio.OpenReadStream();
            return Ok(await _conversationService.SendAudioMessageAsync(userId.Value, sessionId, stream, form.Audio.ContentType, form.RequestVietnamese, cancellationToken));
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

    [HttpPost("exercises/adaptive/session")]
    [ProducesResponseType(typeof(AdaptiveSessionDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateAdaptiveSession(
        [FromBody] GenerateAdaptiveSessionRequestDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _exerciseService.GenerateAdaptiveSessionAsync(userId.Value, request, cancellationToken));
        }
        catch (AITutorException ex)
        {
            return ProblemDetailsResult(ex.StatusCode, ex.Title, ex.Message);
        }
    }

    // ==================== ERROR ANALYSIS & PERSONALIZED LEARNING ====================

    [HttpPost("error-analysis/explain")]
    [ProducesResponseType(typeof(AIErrorAnalysisDetailDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExplainErrorDetail(
        [FromBody] RequestErrorAnalysisDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            return Ok(await _errorAnalysisService.AnalyzeErrorDetailAsync(userId.Value, request, cancellationToken));
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
    }

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

    // ==================== COMPETENCY PROFILE & RECOMMENDATIONS V2 ====================

    [HttpGet("competency-profile")]
    [ProducesResponseType(typeof(CompetencyProfileDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetCompetencyProfile(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        return Ok(await _competencyService.GetCompetencyProfileAsync(userId.Value, cancellationToken));
    }

    [HttpGet("recommendations/v2")]
    [ProducesResponseType(typeof(PersonalizedLearningPlanV2Dto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPersonalizedPlanV2(
        [FromQuery] int? availableMinutes = null,
        [FromQuery] bool explain = false,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        return Ok(await _recommendationEngineV2.GetPlanV2Async(userId.Value, availableMinutes, explain, cancellationToken));
    }

    // ==================== ADAPTIVE HSK DIAGNOSTIC ASSESSMENT ====================

    [HttpPost("diagnostic/start")]
    [ProducesResponseType(typeof(DiagnosticSessionStartDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> StartDiagnosticSession(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        return Ok(await _diagnosticService.StartSessionAsync(userId.Value, cancellationToken));
    }

    [HttpPost("diagnostic/submit")]
    [ProducesResponseType(typeof(DiagnosticResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> SubmitDiagnosticSession(
        [FromBody] DiagnosticSubmissionDto submission,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var result = await _diagnosticService.SubmitAssessmentAsync(userId.Value, submission, cancellationToken);
            return Ok(result);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("diagnostic/confirm-target")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> ConfirmTargetHsk(
        [FromBody] ConfirmTargetHskDto request,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            await _diagnosticService.ApplyConfirmedTargetHskAsync(userId.Value, request.TargetHskLevel, cancellationToken);
            return Ok(new { success = true, targetHskLevel = request.TargetHskLevel });
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("diagnostic/latest")]
    [ProducesResponseType(typeof(DiagnosticResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetLatestDiagnosticResult(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        var result = await _diagnosticService.GetLatestResultAsync(userId.Value, cancellationToken);
        return Ok(result);
    }
}

public sealed class SendConversationAudioFormRequest
{
    public IFormFile Audio { get; set; } = null!;
    public bool RequestVietnamese { get; set; }
}
