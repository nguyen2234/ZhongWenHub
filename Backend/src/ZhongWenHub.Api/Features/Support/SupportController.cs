using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Common.Authorization;
using ZhongWenHub.Api.Features.Support.DTOs;
using ZhongWenHub.Api.Features.Support.Services;

namespace ZhongWenHub.Features.Support;

[ApiController]
[Route("api/v1/support")]
[Authorize]
public class SupportController : ControllerBase
{
    private readonly ISupportTicketService _ticketService;

    public SupportController(ISupportTicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpGet("tickets")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    [ProducesResponseType(typeof(List<SupportTicketDto>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetTickets([FromQuery] TicketFiltersDto filters, CancellationToken cancellationToken)
    {
        var result = await _ticketService.GetTicketsAsync(filters, cancellationToken);
        return Ok(result);
    }

    [HttpGet("tickets/{id}")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    [ProducesResponseType(typeof(SupportTicketDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetTicketById([FromRoute] string id, CancellationToken cancellationToken)
    {
        var result = await _ticketService.GetTicketByIdAsync(id, cancellationToken);
        if (result == null) return NotFound(new { message = $"Không tìm thấy vé hỗ trợ: {id}" });
        return Ok(result);
    }

    [HttpPost("tickets")]
    [ProducesResponseType(typeof(SupportTicketDto), StatusCodes.Status201Created)]
    public async Task<IActionResult> CreateTicket([FromBody] CreateSupportTicketDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var userName = User.Identity?.Name ?? "student";
        var userEmail = User.FindFirstValue(ClaimTypes.Email) ?? "student@zhongwenhub.edu.vn";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "STUDENT";

        var result = await _ticketService.CreateTicketAsync(userId, userName, userEmail, role, dto, cancellationToken);
        return StatusCode(StatusCodes.Status201Created, result);
    }

    [HttpPatch("tickets/{id}/status")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    [ProducesResponseType(typeof(SupportTicketDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> UpdateStatus([FromRoute] string id, [FromBody] UpdateTicketStatusDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var userName = User.Identity?.Name ?? "support";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "SUPPORT";

        try
        {
            var result = await _ticketService.UpdateStatusAsync(id, dto, userId, userName, role, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Không tìm thấy vé hỗ trợ: {id}" });
        }
    }

    [HttpPost("tickets/{id}/assign")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    [ProducesResponseType(typeof(SupportTicketDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AssignTicket([FromRoute] string id, [FromBody] AssignTicketDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var userName = User.Identity?.Name ?? "support";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "SUPPORT";

        try
        {
            var result = await _ticketService.AssignTicketAsync(id, dto, userId, userName, role, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Không tìm thấy vé hỗ trợ: {id}" });
        }
    }

    [HttpPost("tickets/{id}/messages")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    [ProducesResponseType(typeof(SupportTicketDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> AddMessage([FromRoute] string id, [FromBody] AddTicketMessageDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var userName = User.Identity?.Name ?? "support";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "SUPPORT";

        try
        {
            var result = await _ticketService.AddMessageAsync(id, dto, userId, userName, role, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Không tìm thấy vé hỗ trợ: {id}" });
        }
    }

    [HttpPost("tickets/{id}/escalate-content-issue")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    [ProducesResponseType(typeof(SupportTicketDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> EscalateContentIssue([FromRoute] string id, [FromBody] EscalateContentIssueDto dto, CancellationToken cancellationToken)
    {
        var userId = GetCurrentUserId();
        var userName = User.Identity?.Name ?? "support";
        var role = User.FindFirstValue(ClaimTypes.Role) ?? "SUPPORT";

        try
        {
            var result = await _ticketService.EscalateToContentIssueAsync(id, dto, userId, userName, role, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = $"Không tìm thấy vé hỗ trợ: {id}" });
        }
    }

    [HttpGet("metrics")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    [ProducesResponseType(typeof(SupportMetricsDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetMetrics(CancellationToken cancellationToken)
    {
        var result = await _ticketService.GetMetricsAsync(cancellationToken);
        return Ok(result);
    }

    private Guid GetCurrentUserId()
    {
        var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("sub");
        if (Guid.TryParse(idClaim, out var guid)) return guid;
        return Guid.NewGuid();
    }
}
