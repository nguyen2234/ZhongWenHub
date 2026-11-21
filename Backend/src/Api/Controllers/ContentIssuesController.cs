using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Content.Services;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/content-manager/issues")]
[Route("api/v1/content/issues")]
[Authorize(Roles = $"{RoleConstants.ContentManager},{RoleConstants.Admin},{RoleConstants.Support}")]
public class ContentIssuesController : BaseApiController
{
    private readonly IContentIssueService _contentIssueService;
    private readonly ILogger<ContentIssuesController> _logger;

    public ContentIssuesController(
        IContentIssueService contentIssueService,
        ILogger<ContentIssuesController> logger)
    {
        _contentIssueService = contentIssueService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(List<ContentIssueDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetIssues([FromQuery] ContentIssueFilterDto filter, CancellationToken cancellationToken)
    {
        var issues = await _contentIssueService.GetIssuesAsync(filter, cancellationToken);
        return Ok(issues);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(ContentIssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetIssueById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var issue = await _contentIssueService.GetIssueByIdAsync(id, cancellationToken);
        if (issue == null)
        {
            return NotFound(new { message = $"Không tìm thấy báo cáo lỗi học liệu với ID: {id}" });
        }
        return Ok(issue);
    }

    [HttpPost]
    [Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.Support}")]
    [ProducesResponseType(typeof(ContentIssueDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CreateIssue([FromBody] CreateContentIssueDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.TargetContentId))
        {
            return BadRequest(new { message = "Tiêu đề và mã học liệu mục tiêu là bắt buộc." });
        }

        var issue = await _contentIssueService.CreateIssueAsync(dto, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, issue);
    }

    [HttpPost("{id:guid}/assign")]
    [Authorize(Roles = $"{RoleConstants.ContentManager},{RoleConstants.Admin}")]
    [ProducesResponseType(typeof(ContentIssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AssignIssue([FromRoute] Guid id, [FromBody] AssignContentIssueDto? dto, CancellationToken cancellationToken)
    {
        var cmId = GetUserId();
        var cmName = dto?.ContentManagerName ?? User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Content Manager";

        try
        {
            var issue = await _contentIssueService.AssignToContentManagerAsync(id, cmId, cmName, cancellationToken);
            return Ok(issue);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "AssignIssue failed for issue {IssueId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpPost("{id:guid}/resolve")]
    [Authorize(Roles = $"{RoleConstants.ContentManager},{RoleConstants.Admin}")]
    [ProducesResponseType(typeof(ContentIssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResolveIssue([FromRoute] Guid id, [FromBody] ResolveContentIssueDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Notes))
        {
            return BadRequest(new { message = "Vui lòng nhập ghi chú khắc phục lỗi học liệu." });
        }

        var actorName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Content Manager";

        try
        {
            var issue = await _contentIssueService.ResolveIssueAsync(id, dto, actorName, cancellationToken);
            return Ok(issue);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ResolveIssue failed for issue {IssueId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpPost("{id:guid}/reopen")]
    [Authorize(Roles = $"{RoleConstants.Support},{RoleConstants.Admin}")]
    [ProducesResponseType(typeof(ContentIssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ReopenIssue([FromRoute] Guid id, [FromBody] ReopenContentIssueDto dto, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(dto.Reason))
        {
            return BadRequest(new { message = "Vui lòng nhập lý do mở lại báo cáo lỗi." });
        }

        var actorName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Support Staff";

        try
        {
            var issue = await _contentIssueService.ReopenIssueAsync(id, dto, actorName, cancellationToken);
            return Ok(issue);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ReopenIssue failed for issue {IssueId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    [HttpPost("{id:guid}/close")]
    [Authorize(Roles = $"{RoleConstants.Support},{RoleConstants.Admin}")]
    [ProducesResponseType(typeof(ContentIssueDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> CloseIssue([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var actorName = User.FindFirstValue("name") ?? User.FindFirstValue(ClaimTypes.Name) ?? "Support Staff";

        try
        {
            var issue = await _contentIssueService.CloseIssueAsync(id, actorName, cancellationToken);
            return Ok(issue);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "CloseIssue failed for issue {IssueId}", id);
            return StatusCode(StatusCodes.Status500InternalServerError, new ProblemDetails
            {
                Title = "Internal Server Error",
                Detail = "Đã xảy ra lỗi trong quá trình xử lý yêu cầu.",
                Status = StatusCodes.Status500InternalServerError
            });
        }
    }

    private Guid GetUserId()
    {
        var claim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}
