using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Business.Users;

namespace ZhongWenHub.Api.Controllers;

[ApiController]
[Route("api/v1/auth")]
public class AuthController : BaseApiController
{
    private const string RefreshTokenCookieKey = "refreshToken";
    private readonly IAuthService _authService;
    private readonly ICurrentUserService _currentUserService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        IAuthService _authService,
        ICurrentUserService currentUserService,
        ILogger<AuthController> logger)
    {
        this._authService = _authService;
        _currentUserService = currentUserService;
        _logger = logger;
    }

    [HttpPost("login")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto request, CancellationToken cancellationToken)
    {
        if (!ModelState.IsValid)
        {
            var errors = ModelState
                .Where(x => x.Value?.Errors.Count > 0)
                .ToDictionary(
                    kvp => kvp.Key,
                    kvp => kvp.Value!.Errors.Select(e => e.ErrorMessage).ToArray()
                );

            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Dữ liệu không hợp lệ", "Vui lòng kiểm tra lại thông tin đăng nhập.", errors);
        }

        var ipAddress = GetClientIpAddress();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _authService.LoginAsync(request, ipAddress, userAgent, cancellationToken);

        if (!result.Success)
        {
            return ProblemDetailsResult(result.StatusCode, result.ErrorTitle ?? "Lỗi đăng nhập", result.ErrorDetail ?? "Không thể hoàn tất đăng nhập.", result.ValidationErrors);
        }

        if (!string.IsNullOrEmpty(result.RawRefreshToken) && result.RefreshTokenExpiresAt.HasValue)
        {
            SetRefreshTokenCookie(result.RawRefreshToken, result.RefreshTokenExpiresAt.Value);
        }

        return Ok(result.LoginResponse);
    }

    [HttpPost("refresh")]
    [HttpPost("refresh-token")]
    [AllowAnonymous]
    [ProducesResponseType(typeof(LoginResponseDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto? bodyRequest, CancellationToken cancellationToken)
    {
        var rawToken = Request.Cookies[RefreshTokenCookieKey] ?? bodyRequest?.RefreshToken;

        if (string.IsNullOrWhiteSpace(rawToken))
        {
            return ProblemDetailsResult(StatusCodes.Status400BadRequest, "Thiếu thông tin xác thực", "Không tìm thấy refresh token trong cookie hoặc payload.");
        }

        var ipAddress = GetClientIpAddress();
        var userAgent = Request.Headers.UserAgent.ToString();

        var result = await _authService.RefreshTokenAsync(rawToken, ipAddress, userAgent, cancellationToken);

        if (!result.Success)
        {
            // Clear invalid or compromised cookie
            ClearRefreshTokenCookie();
            return ProblemDetailsResult(result.StatusCode, result.ErrorTitle ?? "Lỗi xác thực", result.ErrorDetail ?? "Không thể gia hạn phiên đăng nhập.");
        }

        if (!string.IsNullOrEmpty(result.RawRefreshToken) && result.RefreshTokenExpiresAt.HasValue)
        {
            SetRefreshTokenCookie(result.RawRefreshToken, result.RefreshTokenExpiresAt.Value);
        }

        return Ok(result.LoginResponse);
    }

    [HttpPost("logout")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    public async Task<IActionResult> Logout([FromBody] RefreshTokenRequestDto? bodyRequest, CancellationToken cancellationToken)
    {
        var rawToken = Request.Cookies[RefreshTokenCookieKey] ?? bodyRequest?.RefreshToken;
        var ipAddress = GetClientIpAddress();

        if (!string.IsNullOrWhiteSpace(rawToken))
        {
            await _authService.RevokeRefreshTokenAsync(rawToken, ipAddress, "Đăng xuất bởi người dùng", cancellationToken);
        }

        ClearRefreshTokenCookie();

        return Ok(new { message = "Đăng xuất thành công." });
    }

    [HttpGet("me")]
    [Authorize]
    [ProducesResponseType(typeof(UserDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> GetCurrentUser(CancellationToken cancellationToken)
    {
        var userId = _currentUserService.UserId;
        if (!userId.HasValue)
        {
            return ProblemDetailsResult(StatusCodes.Status401Unauthorized, "Chưa xác thực", "Không thể xác định danh tính người dùng.");
        }

        var user = await _authService.GetCurrentUserProfileAsync(userId.Value, cancellationToken);
        if (user == null)
        {
            return ProblemDetailsResult(StatusCodes.Status404NotFound, "Không tìm thấy", "Thông tin tài khoản không tồn tại trên hệ thống.");
        }

        return Ok(user);
    }

    private void SetRefreshTokenCookie(string token, DateTime expiresAt)
    {
        var cookieOptions = new CookieOptions
        {
            HttpOnly = true,
            Secure = Request.IsHttps,
            SameSite = SameSiteMode.Lax,
            Expires = expiresAt,
            Path = "/api/v1/auth"
        };

        Response.Cookies.Append(RefreshTokenCookieKey, token, cookieOptions);
    }

    private void ClearRefreshTokenCookie()
    {
        Response.Cookies.Delete(RefreshTokenCookieKey, new CookieOptions
        {
            Path = "/api/v1/auth"
        });
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
