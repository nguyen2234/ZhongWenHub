using System.Security.Claims;
using ZhongWenHub.Features.Auth.DTOs;

namespace ZhongWenHub.Features.Auth;

public interface IJwtTokenService
{
    string GenerateAccessToken(UserDto user, IEnumerable<string> roles, IEnumerable<Claim>? additionalClaims = null);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    (string RawToken, string TokenHash, DateTime ExpiresAt) GenerateRefreshToken(bool rememberMe = false);
    string HashToken(string token);
}
