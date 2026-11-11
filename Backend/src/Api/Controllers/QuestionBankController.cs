using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.QuestionBank;
using ZhongWenHub.Business.QuestionBank.DTOs;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/question-bank")]
public class QuestionBankController : BaseApiController
{
    private readonly IQuestionBankService _questionBankService;

    public QuestionBankController(IQuestionBankService questionBankService)
    {
        _questionBankService = questionBankService;
    }

    private Guid? GetCurrentUserId()
    {
        var idStr = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
            ?? User.FindFirst("sub")?.Value;
        return Guid.TryParse(idStr, out var id) ? id : null;
    }

    // =========================================================================
    // Content Management Endpoints (Admin & ContentManager only)
    // =========================================================================

    [HttpGet]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(PagedResponse<QuestionBankItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetQuestionBank(
        [FromQuery] int? hskLevel,
        [FromQuery] string? skill,
        [FromQuery] string? type,
        [FromQuery] string? difficulty,
        [FromQuery] string? status,
        [FromQuery] string? reviewStatus,
        [FromQuery] Guid? lessonId,
        [FromQuery] Guid? grammarPointId,
        [FromQuery] Guid? vocabularyId,
        [FromQuery] string? tag,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var res = await _questionBankService.GetQuestionBankAsync(
            hskLevel, skill, type, difficulty, status, reviewStatus,
            lessonId, grammarPointId, vocabularyId, tag, search,
            page, pageSize, cancellationToken);
        return Ok(res);
    }

    [HttpGet("stats")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(QuestionBankStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetStats(CancellationToken cancellationToken = default)
    {
        var stats = await _questionBankService.GetStatsAsync(cancellationToken);
        return Ok(stats);
    }

    [HttpGet("{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(QuestionBankItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetById(Guid id, CancellationToken cancellationToken = default)
    {
        var item = await _questionBankService.GetByIdAsync(id, cancellationToken);
        if (item == null) return ProblemDetailsResult(404, "Not Found", "Không tìm thấy câu hỏi.");
        return Ok(item);
    }

    [HttpPost]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(QuestionBankItemDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Create(
        [FromBody] CreateQuestionBankItemDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        try
        {
            var created = await _questionBankService.CreateAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return ProblemDetailsResult(400, "Validation Error", ex.Message);
        }
    }

    [HttpPut("{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(QuestionBankItemDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Update(
        Guid id,
        [FromBody] UpdateQuestionBankItemDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        try
        {
            var updated = await _questionBankService.UpdateAsync(id, dto, cancellationToken);
            if (updated == null) return ProblemDetailsResult(404, "Not Found", "Không tìm thấy câu hỏi.");
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return ProblemDetailsResult(400, "Validation Error", ex.Message);
        }
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken = default)
    {
        try
        {
            var deleted = await _questionBankService.DeleteAsync(id, cancellationToken);
            if (!deleted) return ProblemDetailsResult(404, "Not Found", "Không tìm thấy câu hỏi.");
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(409, "Conflict", ex.Message);
        }
    }

    [HttpPost("check-duplicates")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(CheckDuplicatesResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> CheckDuplicates(
        [FromBody] CheckDuplicatesRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var result = await _questionBankService.CheckDuplicatesAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("import")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(ImportQuestionsResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ImportQuestions(
        [FromBody] ImportQuestionsRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var result = await _questionBankService.ImportQuestionsAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpGet("export")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(List<QuestionBankItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> ExportQuestions(
        [FromQuery] int? hskLevel,
        [FromQuery] string? skill,
        [FromQuery] string? status,
        [FromQuery] string? reviewStatus,
        [FromQuery] int limit = 1000,
        CancellationToken cancellationToken = default)
    {
        var items = await _questionBankService.ExportQuestionsAsync(
            hskLevel, skill, status, reviewStatus, limit, cancellationToken);
        return Ok(items);
    }

    [HttpPost("generate")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(GenerateQuestionsResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GenerateQuestions(
        [FromBody] GenerateQuestionsRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var result = await _questionBankService.GenerateQuestionsAsync(dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/review")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(QuestionBankItemDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> ReviewQuestion(
        Guid id,
        [FromBody] ReviewQuestionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        try
        {
            var updated = await _questionBankService.ReviewAsync(id, userId.Value, dto, cancellationToken);
            if (updated == null) return ProblemDetailsResult(404, "Not Found", "Không tìm thấy câu hỏi.");
            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return ProblemDetailsResult(400, "Validation Error", ex.Message);
        }
    }

    [HttpPost("batch-review")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(BatchActionResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> BatchReview(
        [FromBody] BatchReviewQuestionsRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        var result = await _questionBankService.BatchReviewAsync(userId.Value, dto, cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/publish")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(QuestionBankItemDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> PublishQuestion(
        Guid id,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        try
        {
            var updated = await _questionBankService.PublishAsync(id, userId.Value, cancellationToken);
            if (updated == null) return ProblemDetailsResult(404, "Not Found", "Không tìm thấy câu hỏi.");
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(400, "Publish Blocked", ex.Message);
        }
    }

    [HttpPost("batch-publish")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    [ProducesResponseType(typeof(BatchActionResultDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> BatchPublish(
        [FromBody] List<Guid> questionIds,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        var result = await _questionBankService.BatchPublishAsync(userId.Value, questionIds ?? [], cancellationToken);
        return Ok(result);
    }

    [HttpPost("{id:guid}/report")]
    [Authorize]
    [ProducesResponseType(typeof(ReportQuestionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReportQuestion(
        Guid id,
        [FromBody] ReportQuestionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        var result = await _questionBankService.ReportQuestionAsync(id, userId.Value, dto, cancellationToken);
        if (result == null) return ProblemDetailsResult(404, "Not Found", "Không tìm thấy câu hỏi.");
        return Ok(result);
    }

    // =========================================================================
    // Student Adaptive Practice Sessions (NO answer leak before submit)
    // =========================================================================

    [HttpGet("recommendations")]
    [Authorize]
    [ProducesResponseType(typeof(AdaptiveRecommendationsResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAdaptiveRecommendations(CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        var res = await _questionBankService.GetAdaptiveRecommendationsAsync(userId.Value, cancellationToken);
        return Ok(res);
    }

    [HttpPost("practice-sessions")]
    [Authorize]
    [ProducesResponseType(typeof(PracticeSessionDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreatePracticeSession(
        [FromBody] CreatePracticeSessionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        try
        {
            var session = await _questionBankService.CreatePracticeSessionAsync(userId.Value, dto, cancellationToken);
            return CreatedAtAction(nameof(GetPracticeSession), new { sessionId = session.SessionId }, session);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(400, "Cannot Create Practice Session", ex.Message);
        }
    }

    [HttpGet("practice-sessions/{sessionId:guid}")]
    [Authorize]
    [ProducesResponseType(typeof(PracticeSessionDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetPracticeSession(
        Guid sessionId,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        var session = await _questionBankService.GetPracticeSessionAsync(userId.Value, sessionId, cancellationToken);
        if (session == null) return ProblemDetailsResult(404, "Not Found", "Không tìm thấy phiên luyện tập.");
        return Ok(session);
    }

    [HttpPost("practice-sessions/{sessionId:guid}/submit")]
    [Authorize]
    [ProducesResponseType(typeof(SubmitPracticeSessionResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitPracticeSession(
        Guid sessionId,
        [FromBody] SubmitPracticeSessionRequestDto dto,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        try
        {
            var result = await _questionBankService.SubmitPracticeSessionAsync(userId.Value, sessionId, dto, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(404, "Not Found", ex.Message);
        }
    }

    [HttpGet("practice-history")]
    [Authorize]
    [ProducesResponseType(typeof(List<PracticeSessionHistoryItemDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetPracticeHistory(
        [FromQuery] int limit = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetCurrentUserId();
        if (!userId.HasValue) return Unauthorized();
        var items = await _questionBankService.GetPracticeHistoryAsync(userId.Value, limit, cancellationToken);
        return Ok(items);
    }
}

