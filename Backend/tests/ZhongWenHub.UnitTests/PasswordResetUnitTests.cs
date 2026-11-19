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
}
