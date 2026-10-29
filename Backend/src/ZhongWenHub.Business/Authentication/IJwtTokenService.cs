using System.Security.Claims;
using ZhongWenHub.Business.Authentication.DTOs;

namespace ZhongWenHub.Business.Authentication;

public interface IJwtTokenService
{
    string GenerateAccessToken(UserDto user, IEnumerable<string> roles, IEnumerable<Claim>? additionalClaims = null);
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    (string RawToken, string TokenHash, DateTime ExpiresAt) GenerateRefreshToken(bool rememberMe = false);
    string HashToken(string token);
}
