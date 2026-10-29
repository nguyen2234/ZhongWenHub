using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.UnitTests;

public class JwtTokenServiceTests
{
    private readonly JwtSettings _jwtSettings;
    private readonly JwtTokenService _service;

    public JwtTokenServiceTests()
    {
        _jwtSettings = new JwtSettings
        {
            Secret = "ZhongWenHub_Super_Secret_Unit_Test_Key_2026_Must_Be_Long_Enough!",
            Issuer = "ZhongWenHub-Test",
            Audience = "ZhongWenHub-Client-Test",
            AccessTokenExpirationMinutes = 15,
            RefreshTokenExpirationDays = 7,
            RefreshTokenExpirationDaysRememberMe = 30
        };

        var options = Options.Create(_jwtSettings);
        _service = new JwtTokenService(options);
    }

    [Fact]
    public void GenerateAccessToken_ValidUser_ReturnsValidJwtWithCorrectClaims()
    {
        // Arrange
        var user = new UserDto
        {
            Id = Guid.NewGuid().ToString(),
            Username = "teststudent",
            Email = "student@test.com",
            DisplayName = "Test Student",
            Status = "ACTIVE"
        };
        var roles = new[] { RoleConstants.Student };

        // Act
        var token = _service.GenerateAccessToken(user, roles);

        // Assert
        Assert.NotNull(token);
        Assert.NotEmpty(token);

        var handler = new JwtSecurityTokenHandler();
        Assert.True(handler.CanReadToken(token));

        var jwtToken = handler.ReadJwtToken(token);
        Assert.Equal(_jwtSettings.Issuer, jwtToken.Issuer);
        Assert.Contains(jwtToken.Audiences, a => a == _jwtSettings.Audience);
        Assert.Equal(user.Id, jwtToken.Claims.First(c => c.Type == JwtRegisteredClaimNames.Sub).Value);
        Assert.Equal(user.Email, jwtToken.Claims.First(c => c.Type == JwtRegisteredClaimNames.Email).Value);
        Assert.Contains(jwtToken.Claims, c => (c.Type == "role" || c.Type == "roles" || c.Type == ClaimTypes.Role) && c.Value == RoleConstants.Student);
    }

    [Fact]
    public void GenerateRefreshToken_ReturnsRandom64BytesUrlSafeToken()
    {
        // Act
        var (token1, hash1, expiry1) = _service.GenerateRefreshToken(false);
        var (token2, hash2, expiry2) = _service.GenerateRefreshToken(true);

        // Assert
        Assert.NotEmpty(token1);
        Assert.NotEmpty(hash1);
        Assert.NotEmpty(token2);
        Assert.NotEmpty(hash2);
        Assert.NotEqual(token1, token2);
        Assert.NotEqual(hash1, hash2);

        // Expiry verification
        Assert.True(expiry1 > DateTime.UtcNow);
        Assert.True(expiry2 > expiry1); // rememberMe has longer lifespan
    }

    [Fact]
    public void HashToken_ProducesConsistentSha256Hex()
    {
        // Arrange
        var rawToken = "sample-secure-random-refresh-token-12345";

        // Act
        var hash1 = _service.HashToken(rawToken);
        var hash2 = _service.HashToken(rawToken);

        // Assert
        Assert.Equal(hash1, hash2);
        Assert.Equal(64, hash1.Length); // 256 bits = 32 bytes = 64 hex chars
    }

    [Fact]
    public void GetPrincipalFromExpiredToken_ValidSignature_ExtractsClaims()
    {
        // Arrange
        var user = new UserDto
        {
            Id = Guid.NewGuid().ToString(),
            Username = "adminuser",
            Email = "admin@test.com",
            DisplayName = "Admin User",
            Status = "ACTIVE"
        };
        var roles = new[] { RoleConstants.Admin };
        var token = _service.GenerateAccessToken(user, roles);

        // Act
        var principal = _service.GetPrincipalFromExpiredToken(token);

        // Assert
        Assert.NotNull(principal);
        var sub = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? principal.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
        Assert.Equal(user.Id, sub);
        var email = principal.FindFirst(ClaimTypes.Email)?.Value ?? principal.FindFirst(JwtRegisteredClaimNames.Email)?.Value;
        Assert.Equal(user.Email, email);
        Assert.True(principal.IsInRole(RoleConstants.Admin));
    }
}
