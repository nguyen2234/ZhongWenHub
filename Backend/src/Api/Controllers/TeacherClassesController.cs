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
[Route("api/v1/teacher")]
[Authorize]
public class TeacherClassesController : BaseApiController
{
    private readonly ITeacherClassService _teacherClassService;
    private readonly ILogger<TeacherClassesController> _logger;

    public TeacherClassesController(
        ITeacherClassService teacherClassService,
        ILogger<TeacherClassesController> logger)
    {
        _teacherClassService = teacherClassService;
        _logger = logger;
    }

    /// <summary>
    /// Lấy toàn bộ dữ liệu tổng hợp cho Teacher Dashboard (KPIs, lịch dạy sắp tới, lớp đang dạy)
    /// </summary>
    [HttpGet("dashboard")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(TeacherDashboardDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        try
        {
            var data = await _teacherClassService.GetDashboardAsync(cancellationToken);
            return Ok(data);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi tải dữ liệu Teacher Dashboard.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tải dữ liệu trang tổng quan.");
        }
    }

    /// <summary>
    /// Lấy thống kê tổng quan các lớp học (KPI strip) mà không cần tải toàn bộ danh sách lớp
    /// </summary>
    [HttpGet("classes/stats")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(TeacherClassStatsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClassStats(CancellationToken cancellationToken)
    {
        try
        {
            var stats = await _teacherClassService.GetClassStatsAsync(cancellationToken);
            return Ok(stats);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy thống kê lớp giảng dạy.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lấy thống kê lớp học.");
        }
    }

    /// <summary>
    /// Lấy danh sách lớp học có phân trang, bộ lọc và sắp xếp
    /// </summary>
    [HttpGet("classes")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(PagedResponse<ClassSummaryDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClasses([FromQuery] ClassFilterDto filter, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _teacherClassService.GetClassesAsync(filter, cancellationToken);
            return Ok(result);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách lớp giảng dạy.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lấy danh sách lớp học.");
        }
    }

    /// <summary>
    /// Xem thông tin chi tiết một lớp học
    /// </summary>
    [HttpGet("classes/{classId:guid}")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(ClassDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetClassById(Guid classId, CancellationToken cancellationToken)
    {
        try
        {
            var detail = await _teacherClassService.GetClassByIdAsync(classId, cancellationToken);
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
            _logger.LogError(ex, "Lỗi khi lấy chi tiết lớp học {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lấy chi tiết lớp học.");
        }
    }

    /// <summary>
    /// Tạo lớp giảng dạy mới
    /// </summary>
    [HttpPost("classes")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(TeachingClassDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateClass([FromBody] CreateTeachingClassDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var created = await _teacherClassService.CreateClassAsync(dto, cancellationToken);
            return CreatedAtAction(nameof(GetClassById), new { classId = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
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
            _logger.LogError(ex, "Lỗi khi tạo lớp giảng dạy mới.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi tạo lớp học.");
        }
    }

    /// <summary>
    /// Cập nhật thông tin lớp giảng dạy
    /// </summary>
    [HttpPut("classes/{classId:guid}")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(TeachingClassDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateClass(Guid classId, [FromBody] UpdateTeachingClassDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updated = await _teacherClassService.UpdateClassAsync(classId, dto, cancellationToken);
            return Ok(updated);
        }
        catch (KeyNotFoundException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", ex.Message);
        }
        catch (InvalidOperationException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Bad Request", ex.Message);
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
            _logger.LogError(ex, "Lỗi khi cập nhật lớp học {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi cập nhật lớp học.");
        }
    }

    /// <summary>
    /// Lưu trữ lớp học (Archive)
    /// </summary>
    [HttpDelete("classes/{classId:guid}")]
    [HttpPost("classes/{classId:guid}/archive")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ArchiveClass(Guid classId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _teacherClassService.ArchiveClassAsync(classId, cancellationToken);
            return Ok(new { success = result, message = "Lớp học đã được chuyển vào lưu trữ." });
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
            _logger.LogError(ex, "Lỗi khi lưu trữ lớp học {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lưu trữ lớp học.");
        }
    }

    /// <summary>
    /// Lấy danh sách thành viên trong lớp học
    /// </summary>
    [HttpGet("classes/{classId:guid}/members")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(IReadOnlyList<ClassMemberViewDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClassMembers(
        Guid classId,
        [FromQuery] string? search,
        [FromQuery] string? status,
        CancellationToken cancellationToken)
    {
        try
        {
            var members = await _teacherClassService.GetClassMembersAsync(classId, search, status, cancellationToken);
            return Ok(members);
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
            _logger.LogError(ex, "Lỗi khi lấy danh sách học viên lớp {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lấy danh sách học viên.");
        }
    }

    /// <summary>
    /// Ghi danh học viên vào lớp học
    /// </summary>
    [HttpPost("classes/{classId:guid}/members")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(ClassMemberViewDto), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddMember(
        Guid classId,
        [FromBody] AddClassMemberDto dto,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var member = await _teacherClassService.AddMemberAsync(classId, dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, member);
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
            _logger.LogError(ex, "Lỗi khi thêm học viên vào lớp {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi ghi danh học viên.");
        }
    }

    /// <summary>
    /// Xóa học viên khỏi lớp học
    /// </summary>
    [HttpDelete("classes/{classId:guid}/members/{studentId:guid}")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RemoveMember(
        Guid classId,
        Guid studentId,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _teacherClassService.RemoveMemberAsync(classId, studentId, cancellationToken);
            return Ok(new { success = result, message = "Đã xóa học viên khỏi lớp học thành công." });
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
            _logger.LogError(ex, "Lỗi khi xóa học viên {StudentId} khỏi lớp {ClassId}", studentId, classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi xóa học viên.");
        }
    }

    /// <summary>
    /// Lấy thời khóa biểu tuần của lớp học
    /// </summary>
    [HttpGet("classes/{classId:guid}/schedules")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(IReadOnlyList<ClassScheduleDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetClassSchedules(Guid classId, CancellationToken cancellationToken)
    {
        try
        {
            var schedules = await _teacherClassService.GetClassSchedulesAsync(classId, cancellationToken);
            return Ok(schedules);
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
            _logger.LogError(ex, "Lỗi khi lấy thời khóa biểu lớp {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lấy thời khóa biểu.");
        }
    }

    /// <summary>
    /// Cập nhật / thay thế thời khóa biểu tuần của lớp học
    /// </summary>
    [HttpPut("classes/{classId:guid}/schedules")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    [ProducesResponseType(typeof(IReadOnlyList<ClassScheduleDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> UpdateClassSchedules(
        Guid classId,
        [FromBody] List<ClassScheduleDto> schedules,
        CancellationToken cancellationToken)
    {
        try
        {
            var result = await _teacherClassService.UpdateClassSchedulesAsync(classId, schedules, cancellationToken);
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
            _logger.LogError(ex, "Lỗi khi cập nhật thời khóa biểu lớp {ClassId}", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi cập nhật thời khóa biểu.");
        }
    }

    /// <summary>
    /// Lấy danh sách các lớp học mà học viên hiện tại đang được ghi danh tham gia
    /// </summary>
    [HttpGet("my-enrolled-classes")]
    [Authorize(Policy = PolicyConstants.StudentAccess)]
    [ProducesResponseType(typeof(IReadOnlyList<StudentEnrolledClassDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMyEnrolledClasses(CancellationToken cancellationToken)
    {
        try
        {
            var classes = await _teacherClassService.GetMyEnrolledClassesAsync(cancellationToken);
            return Ok(classes);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy danh sách lớp học của học viên.");
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lấy danh sách lớp học của học viên.");
        }
    }

    /// <summary>
    /// Lấy metadata lớp học mà học viên hiện tại đang được ghi danh tham gia.
    /// Dành riêng cho học viên (StudentAccess), chỉ cho phép truy cập các lớp mình đang được ghi danh.
    /// Không bao gồm danh sách thành viên hoặc dữ liệu quản trị lớp học.
    /// </summary>
    [HttpGet("my-enrolled-classes/{classId:guid}")]
    [Authorize(Policy = PolicyConstants.StudentAccess)]
    [ProducesResponseType(typeof(StudentEnrolledClassDto), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiProblemDetailsDto), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetMyEnrolledClassById(Guid classId, CancellationToken cancellationToken)
    {
        try
        {
            var enrolledClass = await _teacherClassService.GetMyEnrolledClassByIdAsync(classId, cancellationToken);
            if (enrolledClass == null)
            {
                return ProblemDetailsResult(StatusCodes.Status404NotFound, "Not Found", $"Bạn không được ghi danh hoặc không tìm thấy lớp học '{classId}'.");
            }
            return Ok(enrolledClass);
        }
        catch (UnauthorizedAccessException ex)
        {
            return ProblemDetailsResult(StatusCodes.Status403Forbidden, "Forbidden", ex.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Lỗi khi lấy thông tin chi tiết lớp học {ClassId} của học viên.", classId);
            return ProblemDetailsResult(StatusCodes.Status500InternalServerError, "Internal Server Error", "Đã xảy ra lỗi khi lấy thông tin lớp học.");
        }
    }
}
