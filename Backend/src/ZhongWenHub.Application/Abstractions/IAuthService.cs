using ZhongWenHub.Application.DTOs.Auth;

namespace ZhongWenHub.Application.Abstractions;

public interface IAuthService
{
    Task<AuthResultDto> LoginAsync(LoginRequestDto request, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task<AuthResultDto> RefreshTokenAsync(string rawRefreshToken, string? ipAddress, string? userAgent, CancellationToken cancellationToken = default);
    Task<bool> RevokeRefreshTokenAsync(string rawRefreshToken, string? ipAddress, string reason = "User logged out", CancellationToken cancellationToken = default);
    Task<UserDto?> GetCurrentUserProfileAsync(Guid userId, CancellationToken cancellationToken = default);
}
