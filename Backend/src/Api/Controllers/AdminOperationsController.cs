using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Controllers;
using Microsoft.AspNetCore.Mvc.Infrastructure;
using ZhongWenHub.Business.Admin;
using ZhongWenHub.Business.Admin.DTOs;
using ZhongWenHub.Business.Admin.Services;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/admin/operations")]
[Authorize(Roles = RoleConstants.Admin)]
public class AdminOperationsController : BaseApiController
{
    private readonly IAdminOperationsService _operationsService;
    private readonly IAiProviderConfigService _aiProviderService;
    private readonly IActionDescriptorCollectionProvider _actionDescriptorProvider;

    public AdminOperationsController(
        IAdminOperationsService operationsService,
        IAiProviderConfigService aiProviderService,
        IActionDescriptorCollectionProvider actionDescriptorProvider)
    {
        _operationsService = operationsService;
        _aiProviderService = aiProviderService;
        _actionDescriptorProvider = actionDescriptorProvider;
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

    // --- AI Provider Configurations ---

    [HttpGet("ai-providers")]
    [ProducesResponseType(typeof(List<AiProviderConfigDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetAiProviders(CancellationToken cancellationToken)
    {
        var providers = await _aiProviderService.GetProvidersAsync(cancellationToken);
        return Ok(providers);
    }

    [HttpGet("ai-providers/{id:guid}")]
    [ProducesResponseType(typeof(AiProviderConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetAiProviderById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var provider = await _aiProviderService.GetProviderByIdAsync(id, cancellationToken);
        if (provider == null) return NotFound(new { message = "Không tìm thấy cấu hình AI provider." });
        return Ok(provider);
    }

    [HttpPost("ai-providers")]
    [ProducesResponseType(typeof(AiProviderConfigDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> CreateAiProvider([FromBody] CreateAiProviderDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var provider = await _aiProviderService.CreateProviderAsync(dto, cancellationToken);
            return StatusCode(StatusCodes.Status201Created, provider);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("ai-providers/{id:guid}")]
    [ProducesResponseType(typeof(AiProviderConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateAiProvider([FromRoute] Guid id, [FromBody] UpdateAiProviderDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid) return BadRequest(ModelState);

        try
        {
            var provider = await _aiProviderService.UpdateProviderAsync(id, dto, cancellationToken);
            return Ok(provider);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPatch("ai-providers/{id:guid}/toggle")]
    [ProducesResponseType(typeof(AiProviderConfigDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ToggleAiProvider([FromRoute] Guid id, [FromBody] ToggleAiProviderDto dto, CancellationToken cancellationToken)
    {
        try
        {
            var provider = await _aiProviderService.ToggleProviderAsync(id, dto.IsEnabled, cancellationToken);
            return Ok(provider);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("ai-providers/{id:guid}/test-connection")]
    [ProducesResponseType(typeof(TestAiProviderResultDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> TestAiProviderConnection([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _aiProviderService.TestConnectionAsync(id, cancellationToken);
            return Ok(result);
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    // --- API Registry Inventory ---

    [HttpGet("api-registry")]
    [ProducesResponseType(typeof(List<ApiRegistryItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public IActionResult GetApiRegistry()
    {
        var actionDescriptors = _actionDescriptorProvider.ActionDescriptors.Items
            .OfType<ControllerActionDescriptor>()
            .Where(a => !a.ControllerName.StartsWith("Swagger", StringComparison.OrdinalIgnoreCase))
            .OrderBy(a => a.ControllerName)
            .ThenBy(a => a.ActionName)
            .ToList();

        var registry = new List<ApiRegistryItemDto>();

        foreach (var action in actionDescriptors)
        {
            var httpMethod = action.EndpointMetadata
                .OfType<HttpMethodMetadata>()
                .FirstOrDefault()?.HttpMethods.FirstOrDefault() ?? "GET";

            var authorizeAttrs = action.EndpointMetadata.OfType<AuthorizeAttribute>().ToList();
            var allowAnonymous = action.EndpointMetadata.OfType<AllowAnonymousAttribute>().Any();

            var roles = string.Join(",", authorizeAttrs.Where(a => !string.IsNullOrEmpty(a.Roles)).Select(a => a.Roles));
            var policies = string.Join(",", authorizeAttrs.Where(a => !string.IsNullOrEmpty(a.Policy)).Select(a => a.Policy));

            registry.Add(new ApiRegistryItemDto
            {
                HttpMethod = httpMethod,
                RoutePath = "/" + (action.AttributeRouteInfo?.Template ?? "").TrimStart('/'),
                ControllerName = action.ControllerName,
                ActionName = action.ActionName,
                RequiresAuth = !allowAnonymous && (authorizeAttrs.Any() || action.ControllerTypeInfo.GetCustomAttributes(typeof(AuthorizeAttribute), true).Any()),
                RequiredRole = string.IsNullOrEmpty(roles) ? null : roles,
                RequiredPolicy = string.IsNullOrEmpty(policies) ? null : policies
            });
        }

        return Ok(registry);
    }
}
