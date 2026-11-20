using System;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Business.Authentication.DTOs;

namespace ZhongWenHub.IntegrationTests;

public class TestEmailSenderSpy : IPasswordResetEmailSender
{
    public string? LastToEmail { get; private set; }
    public string? LastResetToken { get; private set; }
    public int SendCount { get; private set; }

    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default)
    {
        LastToEmail = toEmail;
        LastResetToken = resetToken;
        SendCount++;
        return Task.CompletedTask;
    }
}

public class PasswordResetIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;
    private readonly JsonSerializerOptions _jsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase
    };

    public PasswordResetIntegrationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task CompletePasswordResetWorkflow_WithRealSqlServer_EnforcesSecurityAndOneTimeToken()
    {
        var emailSpy = new TestEmailSenderSpy();

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddSingleton<IPasswordResetEmailSender>(emailSpy);
            });
        }).CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var testEmail = "student@zhongwenhub.edu.vn";
        var newPassword = "NewSecretPassword2026!#";

        // 1. Request Password Reset
        var forgotRequest = new ForgotPasswordRequestDto
        {
            Email = testEmail
        };

        var forgotResponse = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", forgotRequest);
        Assert.Equal(HttpStatusCode.OK, forgotResponse.StatusCode);

        var forgotRawJson = await forgotResponse.Content.ReadAsStringAsync();
        using (var doc = JsonDocument.Parse(forgotRawJson))
        {
            var root = doc.RootElement;
            Assert.True(root.GetProperty("success").GetBoolean());
            Assert.False(string.IsNullOrWhiteSpace(root.GetProperty("message").GetString()));

            // SECURITY GATE: Verify resetToken does NOT exist in the response JSON!
            Assert.False(root.TryGetProperty("resetToken", out _), "Security failure: resetToken was exposed in HTTP response!");
        }

        // Verify the email spy received the reset token
        Assert.Equal(1, emailSpy.SendCount);
        Assert.Equal(testEmail, emailSpy.LastToEmail);
        Assert.False(string.IsNullOrWhiteSpace(emailSpy.LastResetToken));

        var validToken = emailSpy.LastResetToken!;

        // 2. Attempt Reset with Invalid / Tampered Token
        var tamperedRequest = new ResetPasswordRequestDto
        {
            Email = testEmail,
            Token = "tampered-token-invalid",
            NewPassword = newPassword,
            ConfirmPassword = newPassword
        };

        var tamperedResponse = await client.PostAsJsonAsync("/api/v1/auth/reset-password", tamperedRequest);
        Assert.Equal(HttpStatusCode.BadRequest, tamperedResponse.StatusCode);

        // 3. Reset Password with Valid Token from Email
        var validResetRequest = new ResetPasswordRequestDto
        {
            Email = testEmail,
            Token = validToken,
            NewPassword = newPassword,
            ConfirmPassword = newPassword
        };

        var resetResponse = await client.PostAsJsonAsync("/api/v1/auth/reset-password", validResetRequest);
        var resetContent = await resetResponse.Content.ReadAsStringAsync();
        Assert.True(resetResponse.StatusCode == HttpStatusCode.OK, $"Reset failed with {resetResponse.StatusCode}: {resetContent}");

        // 4. Verify login succeeds with the NEW password on SQL Server
        var loginWithNewPass = new LoginRequestDto
        {
            UsernameOrEmail = testEmail,
            Password = newPassword
        };

        var loginResponse = await client.PostAsJsonAsync("/api/v1/auth/login", loginWithNewPass);
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);

        // 5. Verify the token CANNOT be re-used (One-time use protection)
        var reuseResponse = await client.PostAsJsonAsync("/api/v1/auth/reset-password", validResetRequest);
        Assert.Equal(HttpStatusCode.BadRequest, reuseResponse.StatusCode);

        // 6. Restore original password so subsequent test runs remain idempotent
        var restoreForgot = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", forgotRequest);
        Assert.Equal(HttpStatusCode.OK, restoreForgot.StatusCode);
        Assert.Equal(2, emailSpy.SendCount);

        var restoreReset = await client.PostAsJsonAsync("/api/v1/auth/reset-password", new ResetPasswordRequestDto
        {
            Email = testEmail,
            Token = emailSpy.LastResetToken!,
            NewPassword = "StudentPassword123!",
            ConfirmPassword = "StudentPassword123!"
        });
        Assert.Equal(HttpStatusCode.OK, restoreReset.StatusCode);
    }

    [Fact]
    public async Task ForgotPassword_WhenEmailSenderFails_Returns503WithoutPretendingSuccess()
    {
        var failingSender = new FailingEmailSenderStub();

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.AddSingleton<IPasswordResetEmailSender>(failingSender);
            });
        }).CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var request = new ForgotPasswordRequestDto { Email = "student@zhongwenhub.edu.vn" };
        var response = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", request);

        Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);
    }
}

public class FailingEmailSenderStub : IPasswordResetEmailSender
{
    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default)
    {
        throw new System.Net.Mail.SmtpException("SMTP host connection refused. Mail service unreachable.");
    }
}
