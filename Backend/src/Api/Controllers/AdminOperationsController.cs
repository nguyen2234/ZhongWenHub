using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Admin;
using ZhongWenHub.Business.Admin.DTOs;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/admin/operations")]
[Authorize(Roles = RoleConstants.Admin)]
public class AdminOperationsController : BaseApiController
{
    private readonly IAdminOperationsService _operationsService;

    public AdminOperationsController(IAdminOperationsService operationsService)
    {
        _operationsService = operationsService;
    }

    [HttpGet("ai-stats")]
    [ProducesResponseType(typeof(AdminAIOperationsStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAIOperationsStats(CancellationToken cancellationToken)
    {
        var result = await _operationsService.GetAIOperationsStatsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("analytics")]
    [ProducesResponseType(typeof(AdminAnalyticsReportDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAnalyticsReport([FromQuery] string range = "30d", CancellationToken cancellationToken = default)
    {
        var result = await _operationsService.GetAnalyticsReportAsync(range, cancellationToken);
        return Ok(result);
    }

    [HttpGet("settings")]
    [ProducesResponseType(typeof(AdminSystemSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetSystemSettings(CancellationToken cancellationToken)
    {
        var result = await _operationsService.GetSystemSettingsAsync(cancellationToken);
        return Ok(result);
    }

    [HttpPut("settings")]
    [ProducesResponseType(typeof(AdminSystemSettingsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> UpdateSystemSettings([FromBody] AdminSystemSettingsDto dto, CancellationToken cancellationToken)
    {
        if (dto == null)
        {
            return BadRequest(new { message = "Dữ liệu cấu hình không hợp lệ." });
        }

        var result = await _operationsService.UpdateSystemSettingsAsync(dto, cancellationToken);
        return Ok(result);
    }
}
