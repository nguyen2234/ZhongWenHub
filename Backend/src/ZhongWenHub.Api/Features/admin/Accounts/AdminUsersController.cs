using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Business.Users.DTOs;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/admin/users")]
[Authorize(Policy = PolicyConstants.UserManagementAccess)]
public class AdminUsersController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AdminUsersController> _logger;

    public AdminUsersController(
        IAdminUserService adminUserService,
        ICurrentUserService currentUserService,
        ILogger<AdminUsersController> logger)
    {
        _adminUserService = adminUserService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpGet]
    [ProducesResponseType(typeof(PagedResponse<AdminUserListItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetUsers([FromQuery] AdminUserFilterDto filter, CancellationToken cancellationToken)
    {
        var result = await _adminUserService.GetUsersAsync(filter, cancellationToken);
        return Ok(result);
    }

    [HttpGet("kpis")]
    [ProducesResponseType(typeof(AdminUserKpisDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetKpis(CancellationToken cancellationToken)
    {
        var result = await _adminUserService.GetKpisAsync(cancellationToken);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetUserById([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var user = await _adminUserService.GetUserByIdAsync(id, cancellationToken);
        if (user == null)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy", "Người dùng không tồn tại trên hệ thống.");
        }

        return Ok(user);
    }

    [HttpPost]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status201Created)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> CreateUser([FromBody] CreateAdminUserDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Dữ liệu không hợp lệ", "Vui lòng kiểm tra lại thông tin người dùng.", errors);
        }

        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.CreateUserAsync(dto, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể tạo tài khoản.");
        }

        return StatusCode(StatusCodes.Status201Created, user);
    }

    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    [ProducesResponseType(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> UpdateUser([FromRoute] Guid id, [FromBody] UpdateAdminUserDto dto, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Dữ liệu không hợp lệ", "Vui lòng kiểm tra lại thông tin người dùng.", errors);
        }

        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.UpdateUserAsync(id, dto, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể cập nhật người dùng.");
        }

        return Ok(user);
    }

    [HttpPost("{id:guid}/lock")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LockUser([FromRoute] Guid id, [FromBody] LockUserRequestDto? request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.LockUserAsync(id, request?.Reason, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể khóa tài khoản.");
        }

        return Ok(user);
    }

    [HttpPost("{id:guid}/unlock")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UnlockUser([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.UnlockUserAsync(id, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể mở khóa tài khoản.");
        }

        return Ok(user);
    }

    [HttpPatch("{id:guid}/status")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateStatus([FromRoute] Guid id, [FromBody] StatusUpdateRequestDto request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.UpdateStatusAsync(id, request.Status, request.Reason, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể cập nhật trạng thái.");
        }

        return Ok(user);
    }

    [HttpPut("{id:guid}/roles")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRoles([FromRoute] Guid id, [FromBody] UpdateUserRolesDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(kvp => kvp.Key, kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray());

            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Dữ liệu không hợp lệ", "Vui lòng kiểm tra lại danh sách vai trò.", errors);
        }

        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.UpdateRolesAsync(id, request.Roles, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể cập nhật vai trò.");
        }

        return Ok(user);
    }

    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteUser([FromRoute] Guid id, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, errorMessage, statusCode) = await _adminUserService.DeleteUserAsync(id, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể xóa người dùng.");
        }

        return Ok(new { success = true, message = "Đã vô hiệu hóa tài khoản thành công." });
    }

    [HttpGet("roles")]
    [ProducesResponseType(typeof(List<AdminRoleItemDto>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetRoles(CancellationToken cancellationToken)
    {
        var roles = await _adminUserService.GetRolesSummaryAsync(cancellationToken);
        return Ok(roles);
    }

    [HttpPut("roles/{roleName}/description")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateRoleDescription([FromRoute] string roleName, [FromBody] UpdateRoleDescriptionDto request, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, errorMessage, statusCode) = await _adminUserService.UpdateRoleDescriptionAsync(roleName, request.Description, currentUserId, ipAddress, cancellationToken);
        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác thất bại", errorMessage ?? "Không thể cập nhật mô tả vai trò.");
        }

        return Ok(new { success = true, message = "Đã cập nhật mô tả vai trò thành công." });
    }

    [HttpPost("{id:guid}/reset-password")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ResetPassword([FromRoute] Guid id, [FromBody] ResetUserPasswordDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, errorMessage, statusCode) = await _adminUserService.ResetPasswordAsync(
            id, dto, currentUserId, ipAddress, cancellationToken);

        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Thao tác không thành công", errorMessage ?? "Không thể đặt lại mật khẩu.");
        }

        return Ok(new { message = "Đặt lại mật khẩu thành công." });
    }

    [HttpPost("{id:guid}/wallet/adjust")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> AdjustWallet([FromRoute] Guid id, [FromBody] AdjustWalletBalanceDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.AdjustWalletBalanceAsync(
            id, dto, currentUserId, ipAddress, cancellationToken);

        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Điều chỉnh số dư thất bại", errorMessage ?? "Không thể điều chỉnh số dư ví.");
        }

        return Ok(user);
    }

    [HttpPut("{id:guid}/subscription")]
    [ProducesResponseType(typeof(AdminUserDetailDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> UpdateSubscription([FromRoute] Guid id, [FromBody] UpdateSubscriptionPlanDto dto, CancellationToken cancellationToken)
    {
        var currentUserId = _currentUserService.UserId ?? Guid.Empty;
        var ipAddress = GetClientIpAddress();

        var (success, user, errorMessage, statusCode) = await _adminUserService.UpdateSubscriptionPlanAsync(
            id, dto, currentUserId, ipAddress, cancellationToken);

        if (!success)
        {
            return ProblemDetailsResult(statusCode, "Cập nhật gói thất bại", errorMessage ?? "Không thể cập nhật gói sử dụng.");
        }

        return Ok(user);
    }

    private string? GetClientIpAddress()
    {
        if (Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
        {
            var ip = forwarded.FirstOrDefault()?.Split(',').FirstOrDefault()?.Trim();
            if (!string.IsNullOrWhiteSpace(ip)) return ip;
        }

        return HttpContext.Connection.RemoteIpAddress?.ToString();
    }
}

public class StatusUpdateRequestDto
{
    public string Status { get; set; } = string.Empty;
    public string? Reason { get; set; }
}


public class UpdateRoleDescriptionDto
{
    public string Description { get; set; } = string.Empty;
}
