using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Features.Admin;
using ZhongWenHub.Features.Admin.DTOs;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Features.Admin.Operations;

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

        if (dto.IsMaintenanceMode)
        {
            return BadRequest(new { message = "Chế độ bảo trì (IsMaintenanceMode) hiện chưa được hỗ trợ kích hoạt động từ giao diện web để đảm bảo an toàn vận hành hạ tầng." });
        }

        if (dto.MaxLoginAttempts != 5)
        {
            return BadRequest(new { message = "Số lần đăng nhập tối đa (MaxLoginAttempts) hiện đang được cố định ở mức 5 lần theo chính sách ASP.NET Core Identity và chưa hỗ trợ thay đổi động từ web." });
        }

        if (dto.SessionTimeoutMinutes != 60)
        {
            return BadRequest(new { message = "Thời gian phiên làm việc (SessionTimeoutMinutes) hiện đang được cố định ở mức 60 phút theo chính sách bảo mật JWT và chưa hỗ trợ thay đổi động từ web." });
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
