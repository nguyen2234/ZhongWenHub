using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Common.Extensions;

namespace ZhongWenHub.Tests.Features;

public class JwtConfigurationTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    [InlineData("short_secret_under_32_chars!")]
    public void AddAppAuthentication_MissingOrShortSecret_FallsBackToSafeLocalSecret(string? secret)
    {
        // Arrange
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = secret,
                ["JwtSettings:Issuer"] = "ZhongWenHub",
                ["JwtSettings:Audience"] = "ZhongWenHub-Client"
            })
            .Build();

        // Act
        services.AddAppAuthentication(configuration);
        var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<JwtSettings>>().Value;

        // Assert
        Assert.NotNull(options);
        Assert.False(string.IsNullOrWhiteSpace(options.Secret));
        Assert.True(options.Secret.Length >= 32, "Fallback secret must have at least 32 characters (256-bit).");
        Assert.Equal("ZhongWenHub", options.Issuer);
        Assert.Equal("ZhongWenHub-Client", options.Audience);
    }

    [Fact]
    public void AddAppAuthentication_ValidSecret32CharsOrLonger_SucceedsAndBindsConfiguration()
    {
        // Arrange
        var validSecret = "ThisIsAValid32ByteSecretKey2026!"; // 32 chars
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = validSecret,
                ["JwtSettings:Issuer"] = "ZhongWenHub",
                ["JwtSettings:Audience"] = "ZhongWenHub-Client",
                ["JwtSettings:AccessTokenExpirationMinutes"] = "15",
                ["JwtSettings:RefreshTokenExpirationDays"] = "7",
                ["JwtSettings:RefreshTokenExpirationDaysRememberMe"] = "30"
            })
            .Build();

        // Act
        services.AddAppAuthentication(configuration);
        var provider = services.BuildServiceProvider();
        var options = provider.GetRequiredService<IOptions<JwtSettings>>().Value;

        // Assert
        Assert.NotNull(options);
        Assert.Equal(validSecret, options.Secret);
        Assert.Equal("ZhongWenHub", options.Issuer);
        Assert.Equal("ZhongWenHub-Client", options.Audience);
        Assert.Equal(15, options.AccessTokenExpirationMinutes);
        Assert.Equal(7, options.RefreshTokenExpirationDays);
        Assert.Equal(30, options.RefreshTokenExpirationDaysRememberMe);
    }
}
