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
[Route("")]
[Authorize(Policy = PolicyConstants.TeacherAccess)]
public class TeacherAssignmentsController : BaseApiController
{
    private readonly ITeacherAssignmentService _assignmentService;
    private readonly ILogger<TeacherAssignmentsController> _logger;

    public TeacherAssignmentsController(
        ITeacherAssignmentService assignmentService,
        ILogger<TeacherAssignmentsController> logger)
    {
        _assignmentService = assignmentService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách bài tập được phân trang theo bộ lọc
    /// </summary>
    [HttpGet("api/v1/teacher/assignments")]
    [ProducesResponseType(typeof(PagedResponse<AssignmentSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAssignments([FromQuery] AssignmentFilterDto filter, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _assignmentService.GetAssignmentsAsync(filter, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách bài tập.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải danh sách bài tập.");
        }
    }

    /// <summary>
    /// Lấy chi tiết một bài tập bao gồm danh sách câu hỏi và lớp được giao
    /// </summary>
    [HttpGet("api/v1/teacher/assignments/{id:guid}")]
    [ProducesResponseType(typeof(AssignmentDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAssignmentById(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var assignment = await _assignmentService.GetAssignmentByIdAsync(id, cancellationToken);
            return Ok(assignment);
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
            _logger.LogError(ex, "Lỗi khi lấy chi tiết bài tập {AssignmentId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải chi tiết bài tập.");
        }
    }

    /// <summary>
    /// Tạo bài tập mới
    /// </summary>
    [HttpPost("api/v1/teacher/assignments")]
    [ProducesResponseType(typeof(AssignmentDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateAssignment([FromBody] CreateAssignmentDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _assignmentService.CreateAssignmentAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetAssignmentById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tạo bài tập mới.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tạo bài tập.");
        }
    }

    /// <summary>
    /// Chỉnh sửa bài tập (chỉ cho phép khi ở trạng thái DRAFT hoặc cập nhật thông tin cho phép)
    /// </summary>
    [HttpPut("api/v1/teacher/assignments/{id:guid}")]
    [ProducesResponseType(typeof(AssignmentDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAssignment(Guid id, [FromBody] UpdateAssignmentDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _assignmentService.UpdateAssignmentAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Invalid Operation", ex.Message);
        }
        catch (ArgumentException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi cập nhật bài tập {AssignmentId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi cập nhật bài tập.");
        }
    }

    /// <summary>
    /// Xóa hoặc lưu trữ bài tập
    /// </summary>
    [HttpDelete("api/v1/teacher/assignments/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteAssignment(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _assignmentService.DeleteAssignmentAsync(id, cancellationToken);
            return Ok(new { success = result, message = "Đã xóa bài tập thành công." });
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
            _logger.LogError(ex, "Lỗi khi xóa bài tập {AssignmentId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi xóa bài tập.");
        }
    }

    /// <summary>
    /// Xuất bản bài tập để học sinh trong các lớp được giao có thể thấy và làm bài
    /// </summary>
    [HttpPost("api/v1/teacher/assignments/{id:guid}/publish")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> PublishAssignment(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _assignmentService.PublishAssignmentAsync(id, cancellationToken);
            return Ok(new { success = result, message = "Đã xuất bản bài tập thành công." });
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Invalid Operation", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi xuất bản bài tập {AssignmentId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi xuất bản bài tập.");
        }
    }

    /// <summary>
    /// Đóng hạn nộp bài tập
    /// </summary>
    [HttpPost("api/v1/teacher/assignments/{id:guid}/close")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseAssignment(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _assignmentService.CloseAssignmentAsync(id, cancellationToken);
            return Ok(new { success = result, message = "Đã đóng bài tập thành công." });
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
            _logger.LogError(ex, "Lỗi khi đóng bài tập {AssignmentId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi đóng bài tập.");
        }
    }

    /// <summary>
    /// Lấy danh sách toàn bộ bài nộp của học sinh cho bài tập này
    /// </summary>
    [HttpGet("api/v1/teacher/assignments/{id:guid}/submissions")]
    [ProducesResponseType(typeof(IReadOnlyList<TeacherSubmissionItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubmissions(Guid id, [FromQuery] string? status, CancellationToken cancellationToken)
    {
        try
        {
            var list = await _assignmentService.GetSubmissionsAsync(id, status, cancellationToken);
            return Ok(list);
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
            _logger.LogError(ex, "Lỗi khi lấy danh sách bài nộp của bài tập {AssignmentId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải danh sách bài nộp.");
        }
    }

    /// <summary>
    /// Lấy chi tiết bài nộp của học sinh (đáp án, điểm, câu tự luận cần chấm)
    /// </summary>
    [HttpGet("api/v1/teacher/submissions/{id:guid}")]
    [HttpGet("api/v1/teacher/assignments/{assignmentId:guid}/submissions/{id:guid}")]
    [ProducesResponseType(typeof(TeacherSubmissionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetSubmissionDetail(Guid id, [FromRoute] Guid? assignmentId, CancellationToken cancellationToken)
    {
        try
        {
            var detail = await _assignmentService.GetSubmissionDetailAsync(id, cancellationToken);
            return Ok(detail);
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
            _logger.LogError(ex, "Lỗi khi lấy chi tiết bài nộp {SubmissionId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải chi tiết bài nộp.");
        }
    }

    /// <summary>
    /// Giáo viên chấm điểm và ghi nhận xét cho bài nộp của học sinh
    /// </summary>
    [HttpPost("api/v1/teacher/submissions/{id:guid}/grade")]
    [HttpPost("api/v1/teacher/assignments/{assignmentId:guid}/submissions/{id:guid}/grade")]
    [ProducesResponseType(typeof(TeacherSubmissionDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GradeSubmission(Guid id, [FromRoute] Guid? assignmentId, [FromBody] GradeSubmissionDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _assignmentService.GradeSubmissionAsync(id, dto, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (ArgumentException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi chấm điểm bài nộp {SubmissionId}", id);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lưu kết quả chấm bài.");
        }
    }
}
