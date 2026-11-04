using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Business.Users.DTOs;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/admin/dashboard")]
[Authorize(Roles = $"{RoleConstants.Admin},{RoleConstants.SuperAdmin}")]
public class AdminDashboardController : BaseApiController
{
    private readonly IAdminUserService _adminUserService;

    public AdminDashboardController(IAdminUserService adminUserService)
    {
        _adminUserService = adminUserService;
    }

    [HttpGet("stats")]
    [ProducesResponseType(typeof(AdminDashboardStatsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> GetDashboardStats(CancellationToken cancellationToken)
    {
        var stats = await _adminUserService.GetDashboardStatsAsync(cancellationToken);
        return Ok(stats);
    }
}

