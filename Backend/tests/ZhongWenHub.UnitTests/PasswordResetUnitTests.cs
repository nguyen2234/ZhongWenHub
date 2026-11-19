using System.ComponentModel.DataAnnotations;
using ZhongWenHub.Business.Authentication.DTOs;
using ZhongWenHub.Data.Entities;

namespace ZhongWenHub.UnitTests;

public class PasswordResetUnitTests
{
    [Fact]
    public void ForgotPasswordRequestDto_RequiresValidEmail()
    {
        var invalidDto = new ForgotPasswordRequestDto { Email = "not-an-email" };
        var context = new ValidationContext(invalidDto);
        var results = new List<ValidationResult>();

        var isValid = Validator.TryValidateObject(invalidDto, context, results, true);
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage!.Contains("email"));
    }

    [Fact]
    public void ForgotPasswordRequestDto_ValidEmail_PassesValidation()
    {
        var validDto = new ForgotPasswordRequestDto { Email = "student@example.com" };
        var context = new ValidationContext(validDto);
        var results = new List<ValidationResult>();

        var isValid = Validator.TryValidateObject(validDto, context, results, true);
        Assert.True(isValid);
    }

    [Fact]
    public void ResetPasswordRequestDto_MismatchedPasswords_FailsValidation()
    {
        var dto = new ResetPasswordRequestDto
        {
            Email = "student@example.com",
            Token = "secure-token-123",
            NewPassword = "Password123!",
            ConfirmPassword = "DifferentPassword456!"
        };
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();

        var isValid = Validator.TryValidateObject(dto, context, results, true);
        Assert.False(isValid);
        Assert.Contains(results, r => r.ErrorMessage!.Contains("không khớp"));
    }

    [Fact]
    public void ResetPasswordRequestDto_ValidPayload_PassesValidation()
    {
        var dto = new ResetPasswordRequestDto
        {
            Email = "student@example.com",
            Token = "secure-token-123",
            NewPassword = "Password123!",
            ConfirmPassword = "Password123!"
        };
        var context = new ValidationContext(dto);
        var results = new List<ValidationResult>();

        var isValid = Validator.TryValidateObject(dto, context, results, true);
        Assert.True(isValid);
    }

    [Fact]
    public void RevokingRefreshToken_SetsRevocationReasonAndDeactivates()
    {
        var token = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedByIp = "127.0.0.1"
        };

        Assert.True(token.IsActive);
        token.Revoke("127.0.0.1", "Mật khẩu tài khoản đã được đặt lại");

        Assert.True(token.IsRevoked);
        Assert.False(token.IsActive);
        Assert.Equal("Mật khẩu tài khoản đã được đặt lại", token.RevocationReason);
    }

    [Fact]
    public async Task PasswordResetEmailSender_WithoutHost_LogsWarningGracefully()
    {
        var config = new TestConfiguration(new Dictionary<string, string?>
        {
            { "PasswordReset:FrontendUrl", "https://zhongwenhub.edu.vn/reset-password" }
        });

        var sender = new ZhongWenHub.Business.Authentication.PasswordResetEmailSender(
            config,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ZhongWenHub.Business.Authentication.PasswordResetEmailSender>.Instance);

        // Must not throw when host is missing
        await sender.SendPasswordResetEmailAsync("test@example.com", "sample-token-123");
    }

    private class TestConfiguration : Microsoft.Extensions.Configuration.IConfiguration
    {
        private readonly Dictionary<string, string?> _data;
        public TestConfiguration(Dictionary<string, string?> data) => _data = data;
        public string? this[string key] { get => _data.TryGetValue(key, out var v) ? v : null; set => _data[key] = value; }
        public IEnumerable<Microsoft.Extensions.Configuration.IConfigurationSection> GetChildren() => Enumerable.Empty<Microsoft.Extensions.Configuration.IConfigurationSection>();
        public Microsoft.Extensions.Primitives.IChangeToken GetReloadToken() => null!;
        public Microsoft.Extensions.Configuration.IConfigurationSection GetSection(string key) => null!;
    }
}
