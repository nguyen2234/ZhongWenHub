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

        if (dto.Require2FA)
        {
            return BadRequest(new { message = "Chính sách xác thực hai yếu tố (Require2FA) chưa được hệ thống hỗ trợ. Vui lòng tắt tùy chọn này." });
        }

        if (dto.SessionTimeoutMinutes < 5 || dto.SessionTimeoutMinutes > 1440)
        {
            return BadRequest(new { message = "Thời gian hết hạn phiên làm việc (SessionTimeoutMinutes) phải từ 5 đến 1440 phút." });
        }

        if (dto.MaxLoginAttempts < 1 || dto.MaxLoginAttempts > 20)
        {
            return BadRequest(new { message = "Số lần đăng nhập sai tối đa (MaxLoginAttempts) phải từ 1 đến 20 lần." });
        }

        var allowedLanguages = new[] { "vi-VN", "zh-CN", "en-US" };
        if (!allowedLanguages.Contains(dto.DefaultLanguage))
        {
            return BadRequest(new { message = $"Ngôn ngữ mặc định '{dto.DefaultLanguage}' chưa được hỗ trợ. Các ngôn ngữ hợp lệ: vi-VN, zh-CN, en-US." });
        }

        try
        {
            var result = await _operationsService.UpdateSystemSettingsAsync(dto, cancellationToken);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }
}
