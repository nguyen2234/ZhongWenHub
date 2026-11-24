using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Features.AI.DTOs;
using ZhongWenHub.Features.AI.Services.LearningPath;
using ZhongWenHub.Common.Authorization;
using ZhongWenHub.Features.Admin.Users;

namespace ZhongWenHub.Api.Controllers;

[Authorize(Policy = PolicyConstants.StudentAccess)]
[ApiController]
[Route("api/v1/learning-path")]
public class LearningPathController : BaseApiController
{
    private readonly ILearningPathService _learningPathService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<LearningPathController> _logger;

    public LearningPathController(
        ILearningPathService learningPathService,
        ICurrentUserService currentUserService,
        ILogger<LearningPathController> logger)
    {
        _learningPathService = learningPathService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy thông tin thiết lập mục tiêu học tập của học viên hiện tại.
    /// </summary>
    [HttpGet("goals")]
    [ProducesResponseType(typeof(LearningGoalDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetGoal(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        var goal = await _learningPathService.GetLearningGoalAsync(userId.Value, cancellationToken);
        return Ok(goal);
    }

    /// <summary>
    /// Cập nhật thiết lập mục tiêu học tập (Target HSK, Daily Minutes, Days/Week, Priority Skills, Intensity).
    /// </summary>
    [HttpPut("goals")]
    [ProducesResponseType(typeof(LearningGoalDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UpdateGoal([FromBody] UpdateLearningGoalDto dto, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var updated = await _learningPathService.UpdateLearningGoalAsync(userId.Value, dto, cancellationToken);
            return Ok(updated);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Dữ liệu mục tiêu không hợp lệ", ex.Message);
        }
        catch (ArgumentException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Tham số không hợp lệ", ex.Message);
        }
    }

    /// <summary>
    /// Sinh lộ trình học tập cá nhân hóa mới dựa trên mục tiêu, năng lực và kho bài học thực tế.
    /// </summary>
    [HttpPost("generate")]
    [ProducesResponseType(typeof(PersonalizedLearningPathDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GeneratePath([FromBody] GenerateLearningPathRequestDto? request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var path = await _learningPathService.GenerateLearningPathAsync(userId.Value, request ?? new GenerateLearningPathRequestDto(), cancellationToken);
            return Ok(path);
        }
        catch (ArgumentOutOfRangeException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Yêu cầu lộ trình không hợp lệ", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Không thể tạo lộ trình", ex.Message);
        }
    }

    /// <summary>
    /// Lấy lộ trình học tập cá nhân hóa đang active của học viên.
    /// </summary>
    [HttpGet("current")]
    [ProducesResponseType(typeof(PersonalizedLearningPathDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetCurrentPath(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        var path = await _learningPathService.GetCurrentLearningPathAsync(userId.Value, cancellationToken);
        if (path == null)
        {
            return NoContent();
        }

        return Ok(path);
    }

    /// <summary>
    /// Lấy danh sách nhiệm vụ học tập trong kế hoạch hôm nay.
    /// </summary>
    [HttpGet("daily-plan")]
    [ProducesResponseType(typeof(DailyPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetTodayPlan(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        var plan = await _learningPathService.GetTodayPlanAsync(userId.Value, cancellationToken);
        return Ok(plan);
    }

    /// <summary>
    /// Đánh dấu hoàn thành một nhiệm vụ học tập trong ngày và nhận gợi ý nhiệm vụ tiếp theo.
    /// </summary>
    [HttpPost("daily-plan/tasks/{taskId:guid}/complete")]
    [ProducesResponseType(typeof(CompleteTaskResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status403Forbidden)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CompleteTask(Guid taskId, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        try
        {
            var result = await _learningPathService.CompleteTaskAsync(userId.Value, taskId, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Không có quyền truy cập", ex.Message);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy nhiệm vụ", ex.Message);
        }
    }

    /// <summary>
    /// Điều chỉnh linh hoạt các nhiệm vụ còn lại trong ngày (Adaptive Replanning) mà không mất nhiệm vụ đã làm.
    /// </summary>
    [HttpPost("daily-plan/replan")]
    [ProducesResponseType(typeof(DailyPlanDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> ReplanToday([FromBody] AdaptiveReplanRequestDto? request, CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        var plan = await _learningPathService.ReplanTodayAsync(userId.Value, request, cancellationToken);
        return Ok(plan);
    }

    /// <summary>
    /// Lấy tiến độ tổng thể lộ trình học tập cá nhân hóa.
    /// </summary>
    [HttpGet("progress")]
    [ProducesResponseType(typeof(PersonalizedLearningProgressDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetProgress(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue) return Unauthorized();

        var progress = await _learningPathService.GetProgressAsync(userId.Value, cancellationToken);
        return Ok(progress);
    }
}
