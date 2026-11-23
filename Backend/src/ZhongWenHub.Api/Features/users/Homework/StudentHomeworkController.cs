using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Teacher.DTOs;
using ZhongWenHub.Business.Teacher.Services;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/student/homework")]
[Authorize(Policy = PolicyConstants.StudentAccess)]
public class StudentHomeworkController : BaseApiController
{
    private readonly IStudentHomeworkService _homeworkService;
    private readonly ILogger<StudentHomeworkController> _logger;

    public StudentHomeworkController(
        IStudentHomeworkService homeworkService,
        ILogger<StudentHomeworkController> logger)
    {
        _homeworkService = homeworkService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách bài tập được giao cho học viên hiện tại qua các lớp đã tham gia
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<StudentHomeworkSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyHomework([FromQuery] string? status, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _homeworkService.GetMyHomeworkListAsync(status, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách bài tập của học viên.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải danh sách bài tập về nhà.");
        }
    }

    /// <summary>
    /// Bắt đầu một lượt làm bài mới (trả về danh sách câu hỏi đã giấu đáp án đúng)
    /// </summary>
    [HttpPost("{assignmentId:guid}/start")]
    [ProducesResponseType(typeof(StudentAssignmentTakingDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> StartAttempt(
        Guid assignmentId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _homeworkService.StartHomeworkAttemptAsync(assignmentId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi bắt đầu làm bài tập {AssignmentId}", assignmentId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi mở đề bài tập.");
        }
    }

    /// <summary>
    /// Nộp bài làm của học viên để chấm tự động các câu trắc nghiệm và ghi nhận lượt làm
    /// </summary>
    [HttpPost("submissions/{submissionId:guid}/submit")]
    [ProducesResponseType(typeof(StudentHomeworkResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> SubmitHomework(
        Guid submissionId,
        [FromBody] SubmitHomeworkDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _homeworkService.SubmitHomeworkAsync(submissionId, dto, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi nộp bài làm {SubmissionId}", submissionId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi nộp bài làm.");
        }
    }

    /// <summary>
    /// Xem kết quả và lời giải của bài tập đã nộp (chỉ hiện đáp án nếu giáo viên cho phép)
    /// </summary>
    [HttpGet("submissions/{submissionId:guid}/result")]
    [ProducesResponseType(typeof(StudentHomeworkResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubmissionResult(
        Guid submissionId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _homeworkService.GetHomeworkResultAsync(submissionId, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xem kết quả bài làm {SubmissionId}", submissionId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải kết quả bài nộp.");
        }
    }
}
