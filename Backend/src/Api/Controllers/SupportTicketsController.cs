using System;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Support.DTOs;
using ZhongWenHub.Business.Support.Services;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/support/tickets")]
[Authorize]
public class SupportTicketsController : BaseApiController
{
    private readonly ISupportTicketService _ticketService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<SupportTicketsController> _logger;

    public SupportTicketsController(
        ISupportTicketService ticketService,
        ICurrentUserService currentUserService,
        ILogger<SupportTicketsController> logger)
    {
        _ticketService = ticketService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    /// <summary>
    /// Tất cả role đã đăng nhập đều có thể gửi báo cáo sự cố
    /// </summary>
    [HttpPost]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> CreateTicket(
        [FromBody] CreateTicketRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = _currentUserService.UserId ?? Guid.Empty;
        var userName = _currentUserService.Username ?? _currentUserService.Email ?? "Người dùng";
        var userEmail = _currentUserService.Email ?? "user@zhongwenhub.local";
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? RoleConstants.Student;

        try
        {
            var ticket = await _ticketService.CreateTicketAsync(request, userId, userName, userEmail, userRole, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, ticket);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    /// <summary>
    /// Báo cáo của tôi: Xem danh sách các vé do chính mình gửi
    /// </summary>
    [HttpGet("my-reports")]
    [ProducesResponseType(typeof(PagedResponse<TicketSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> GetMyReports(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = _currentUserService.UserId ?? Guid.Empty;
        var result = await _ticketService.GetMyReportsAsync(userId, page, pageSize, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Xem chi tiết vé và lịch sử trao đổi (Bảo vệ IDOR: chỉ reporter hoặc nhân viên hỗ trợ/admin)
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicketDetail(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? Guid.Empty;
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? RoleConstants.Student;

        try
        {
            var ticket = await _ticketService.GetTicketDetailAsync(id, userId, userRole, cancellationToken);
            if (ticket == null)
            {
                return NotFound(new { message = "Không tìm thấy báo cáo sự cố yêu cầu." });
            }
            return Ok(ticket);
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetTicketDetail failed for ticket {TicketId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Gửi phản hồi hoặc ghi chú nội bộ vào vé
    /// </summary>
    [HttpPost("{id:guid}/messages")]
    [ProducesResponseType(typeof(TicketMessageDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AddMessage(
        [FromRoute] Guid id,
        [FromBody] AddTicketMessageRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        var userId = _currentUserService.UserId ?? Guid.Empty;
        var userName = _currentUserService.Username ?? _currentUserService.Email ?? "Người dùng";
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? RoleConstants.Student;

        try
        {
            var message = await _ticketService.AddMessageAsync(id, request, userId, userName, userRole, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, message);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AddMessage failed for ticket {TicketId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Mở lại vé đã giải quyết (chỉ người gửi báo cáo)
    /// </summary>
    [HttpPost("{id:guid}/reopen")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReopenTicket(
        [FromRoute] Guid id,
        CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId ?? Guid.Empty;
        var userName = _currentUserService.Username ?? _currentUserService.Email ?? "Người dùng";

        try
        {
            var ticket = await _ticketService.ReopenTicketAsync(id, userId, userName, cancellationToken);
            return Ok(ticket);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (UnauthorizedAccessException ex)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ReopenTicket failed for ticket {TicketId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    // --- STAFF ONLY ENDPOINTS (Support & Admin only) ---

    /// <summary>
    /// Hộp thư tiếp nhận sự cố toàn hệ thống (Dành cho Support, Admin)
    /// </summary>
    [HttpGet]
    [Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.Support}")]
    [ProducesResponseType(typeof(PagedResponse<TicketSummaryDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAllTickets(
        [FromQuery] TicketFilterDto filter,
        CancellationToken cancellationToken)
    {
        var result = await _ticketService.GetAllTicketsAsync(filter, cancellationToken);
        return Ok(result);
    }

    /// <summary>
    /// Thống kê KPIs vận hành hỗ trợ (Support, Admin)
    /// </summary>
    [HttpGet("metrics")]
    [Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.Support}")]
    [ProducesResponseType(typeof(SupportMetricsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetMetrics(CancellationToken cancellationToken)
    {
        var metrics = await _ticketService.GetMetricsAsync(cancellationToken);
        return Ok(metrics);
    }

    /// <summary>
    /// Danh sách nhân viên hỗ trợ thực tế để phân công vé (Support, Admin)
    /// </summary>
    [HttpGet("staff")]
    [Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.Support}")]
    [ProducesResponseType(typeof(List<SupportStaffDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSupportStaff(CancellationToken cancellationToken)
    {
        var staff = await _ticketService.GetSupportStaffAsync(cancellationToken);
        return Ok(staff);
    }

    /// <summary>
    /// Phân công nhân viên phụ trách vé (Support, Admin)
    /// </summary>
    [HttpPatch("{id:guid}/assign")]
    [Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.Support}")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignTicket(
        [FromRoute] Guid id,
        [FromBody] AssignTicketRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = _currentUserService.UserId ?? Guid.Empty;
        var userName = _currentUserService.Username ?? _currentUserService.Email ?? "Nhân viên hỗ trợ";

        try
        {
            var ticket = await _ticketService.AssignTicketAsync(id, request, userId, userName, cancellationToken);
            return Ok(ticket);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AssignTicket failed for ticket {TicketId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Cập nhật trạng thái vé: IN_PROGRESS, WAITING_STUDENT, RESOLVED, CLOSED (Support, Admin)
    /// </summary>
    [HttpPatch("{id:guid}/status")]
    [Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.Support}")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus(
        [FromRoute] Guid id,
        [FromBody] UpdateTicketStatusRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = _currentUserService.UserId ?? Guid.Empty;
        var userName = _currentUserService.Username ?? _currentUserService.Email ?? "Nhân viên hỗ trợ";
        var userRole = User.FindFirstValue(ClaimTypes.Role) ?? RoleConstants.Support;

        try
        {
            var ticket = await _ticketService.UpdateStatusAsync(id, request, userId, userName, userRole, cancellationToken);
            return Ok(ticket);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "UpdateStatus failed for ticket {TicketId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    /// <summary>
    /// Chuyển tiếp lỗi học liệu sang Content Manager (Support, Admin)
    /// </summary>
    [HttpPost("{id:guid}/escalate-content")]
    [Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.Support}")]
    [ProducesResponseType(typeof(TicketDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> EscalateContent(
        [FromRoute] Guid id,
        [FromBody] EscalateContentIssueRequestDto request,
        CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        var userId = _currentUserService.UserId ?? Guid.Empty;
        var userName = _currentUserService.Username ?? _currentUserService.Email ?? "Nhân viên hỗ trợ";

        try
        {
            var ticket = await _ticketService.EscalateToContentIssueAsync(id, request, userId, userName, cancellationToken);
            return Ok(ticket);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EscalateContent failed for ticket {TicketId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }
}
