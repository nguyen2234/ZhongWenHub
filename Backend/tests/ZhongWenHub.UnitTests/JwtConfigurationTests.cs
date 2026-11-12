using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business;
using ZhongWenHub.Business.Authentication;

namespace ZhongWenHub.UnitTests;

public class JwtConfigurationTests
{
    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void AddBusiness_MissingSecret_ThrowsInvalidOperationException(string? secret)
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

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => services.AddBusiness(configuration));
        Assert.Contains("JwtSettings:Secret", ex.Message);
        Assert.Contains("tối thiểu 32 ký tự", ex.Message);
    }

    [Theory]
    [InlineData("short_secret_under_32_chars!")] // 28 chars
    [InlineData("1234567890123456789012345678901")] // 31 chars
    public void AddBusiness_SecretShorterThan32Chars_ThrowsInvalidOperationException(string shortSecret)
    {
        // Arrange
        var services = new ServiceCollection();
        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["JwtSettings:Secret"] = shortSecret,
                ["JwtSettings:Issuer"] = "ZhongWenHub",
                ["JwtSettings:Audience"] = "ZhongWenHub-Client"
            })
            .Build();

        // Act & Assert
        var ex = Assert.Throws<InvalidOperationException>(() => services.AddBusiness(configuration));
        Assert.Contains("JwtSettings:Secret", ex.Message);
        Assert.Contains("tối thiểu 32 ký tự", ex.Message);
    }

    [Fact]
    public void AddBusiness_ValidSecret32CharsOrLonger_SucceedsAndBindsConfiguration()
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
        services.AddBusiness(configuration);
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
