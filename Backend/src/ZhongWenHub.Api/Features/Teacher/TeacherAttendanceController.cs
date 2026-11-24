using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Common.Authorization;
using ZhongWenHub.Common.DTOs;
using ZhongWenHub.Features.Teacher.DTOs;
using ZhongWenHub.Features.Teacher.Services;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/teacher/classes/{classId:guid}/attendance")]
[Authorize(Policy = PolicyConstants.TeacherAccess)]
public class TeacherAttendanceController : BaseApiController
{
    private readonly ITeacherAttendanceService _attendanceService;
    private readonly ILogger<TeacherAttendanceController> _logger;

    public TeacherAttendanceController(
        ITeacherAttendanceService attendanceService,
        ILogger<TeacherAttendanceController> logger)
    {
        _attendanceService = attendanceService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy danh sách điểm danh của lớp theo ngày chỉ định
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(IReadOnlyList<ClassAttendanceRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAttendance(
        Guid classId,
        [FromQuery] string? date,
        CancellationToken cancellationToken)
    {
        try
        {
            DateTime? parsedDate = null;
            if (!string.IsNullOrWhiteSpace(date) && DateTime.TryParse(date, out var d))
            {
                parsedDate = d;
            }

            var result = await _attendanceService.GetClassAttendanceAsync(classId, parsedDate, cancellationToken);
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
            _logger.LogError(ex, "Lỗi khi lấy thông tin điểm danh lớp {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải danh sách điểm danh.");
        }
    }

    /// <summary>
    /// Ghi nhận hoặc cập nhật danh sách điểm danh cho buổi học
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(IReadOnlyList<ClassAttendanceRecordDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RecordAttendance(
        Guid classId,
        [FromBody] RecordClassAttendanceDto dto,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _attendanceService.RecordClassAttendanceAsync(classId, dto, cancellationToken);
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
            _logger.LogError(ex, "Lỗi khi ghi nhận điểm danh lớp {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lưu kết quả điểm danh.");
        }
    }

    /// <summary>
    /// Lấy báo cáo thống kê tỷ lệ chuyên cần tổng quan của lớp học
    /// </summary>
    [HttpGet("summary")]
    [ProducesResponseType(typeof(ClassAttendanceSummaryDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAttendanceSummary(
        Guid classId,
        CancellationToken cancellationToken)
    {
        try
        {
            var summary = await _attendanceService.GetClassAttendanceSummaryAsync(classId, cancellationToken);
            return Ok(summary);
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
            _logger.LogError(ex, "Lỗi khi lấy thống kê chuyên cần lớp {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải thống kê chuyên cần.");
        }
    }
}
