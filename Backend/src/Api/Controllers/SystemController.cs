using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/system")]
public class SystemController : BaseApiController
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IWebHostEnvironment _env;

    public SystemController(ApplicationDbContext dbContext, IWebHostEnvironment env)
    {
        _dbContext = dbContext;
        _env = env;
    }

    [HttpGet("info")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(SystemInfoResponseDto), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetSystemInfo(CancellationToken cancellationToken)
    {
        var dbCanConnect = false;
        try
        {
            dbCanConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
        }
        catch
        {
            dbCanConnect = false;
        }

        var info = new SystemInfoResponseDto
        {
            AppName = "ZhongWenHub Backend (BE-1)",
            Version = "1.0.0",
            Environment = _env.EnvironmentName,
            TimestampUtc = DateTime.UtcNow,
            DatabaseStatus = dbCanConnect ? "Healthy (Connected)" : "Degraded (Cannot connect)",
            DotNetVersion = System.Environment.Version.ToString()
        };

        return Ok(info);
    }

    [HttpGet("health")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHealth(CancellationToken cancellationToken)
    {
        var dbCanConnect = await _dbContext.Database.CanConnectAsync(cancellationToken);
        if (!dbCanConnect)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { status = "Unhealthy", database = "Disconnected" });
        }

        return Ok(new { status = "Healthy", database = "Connected", timestamp = DateTime.UtcNow });
    }

    // Role & Policy Verification Test Endpoints
    [HttpGet("admin-test")]
    [Authorize(Policy = PolicyConstants.AdminAccess)]
    public IActionResult AdminOnly()
    {
        return Ok(new { message = "Truy cập thành công với chính sách AdminAccess." });
    }

    [HttpGet("superadmin-test")]
    [Authorize(Policy = PolicyConstants.SystemSettingsManage)]
    public IActionResult SuperAdminOnly()
    {
        return Ok(new { message = "Truy cập thành công với chính sách SystemSettingsManage (SUPER_ADMIN)." });
    }

    [HttpGet("teacher-test")]
    [Authorize(Policy = PolicyConstants.TeacherAccess)]
    public IActionResult TeacherOnly()
    {
        return Ok(new { message = "Truy cập thành công với chính sách TeacherAccess." });
    }

    [HttpGet("support-test")]
    [Authorize(Policy = PolicyConstants.SupportAccess)]
    public IActionResult SupportOnly()
    {
        return Ok(new { message = "Truy cập thành công với chính sách SupportAccess." });
    }

    [HttpGet("content-manager-test")]
    [Authorize(Policy = PolicyConstants.ContentManagementAccess)]
    public IActionResult ContentManagerOnly()
    {
        return Ok(new { message = "Truy cập thành công với chính sách ContentManagementAccess." });
    }

    [HttpGet("student-test")]
    [Authorize(Policy = PolicyConstants.StudentAccess)]
    public IActionResult StudentOnly()
    {
        return Ok(new { message = "Truy cập thành công với chính sách StudentAccess." });
    }
}
