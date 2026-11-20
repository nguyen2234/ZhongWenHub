using System;
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
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

    public void ValidateConfiguration()
    {
        // Spy configuration is always valid by default
    }

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
        var tamperedContent = await tamperedResponse.Content.ReadAsStringAsync();
        Assert.True(tamperedResponse.StatusCode == HttpStatusCode.BadRequest, $"Tampered reset expected BadRequest but got {tamperedResponse.StatusCode}: {tamperedContent}");

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

    [Fact]
    public async Task ForgotPassword_WithRealSmtpSocketSandbox_TransmitsFullEmailAndTokenOverNetwork()
    {
        await using var server = new IntegrationTestMockSmtpServer();

        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((ctx, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["PasswordReset:MailHost"] = "127.0.0.1",
                    ["PasswordReset:MailPort"] = server.Port.ToString(),
                    ["PasswordReset:EnableSsl"] = "false",
                    ["PasswordReset:From"] = "no-reply@zhongwenhub.edu.vn",
                    ["PasswordReset:FrontendUrl"] = "https://zhongwenhub.edu.vn/reset-password"
                });
            });
        }).CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        var request = new ForgotPasswordRequestDto { Email = "student@zhongwenhub.edu.vn" };
        var response = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", request);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var body = await response.Content.ReadAsStringAsync();
        using (var doc = JsonDocument.Parse(body))
        {
            Assert.True(doc.RootElement.GetProperty("success").GetBoolean());
            Assert.False(doc.RootElement.TryGetProperty("resetToken", out _));
        }

        // Wait for SMTP transmission to finish over TCP loopback
        await server.WaitForMessageAsync(TimeSpan.FromSeconds(5));

        lock (server.ReceivedLines)
        {
            Assert.Contains(server.ReceivedLines, l => l.Contains("RCPT TO:<student@zhongwenhub.edu.vn>"));
            Assert.Contains(server.ReceivedLines, l => l.Contains("MAIL FROM:<no-reply@zhongwenhub.edu.vn>"));

            var base64Lines = server.ReceivedLines
                .SkipWhile(l => !l.StartsWith("Content-Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
                .Skip(1)
                .SkipWhile(string.IsNullOrWhiteSpace)
                .TakeWhile(l => l != ".");

            var base64Body = string.Concat(base64Lines);
            var decodedHtml = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(base64Body));

            Assert.Contains("https://zhongwenhub.edu.vn/reset-password", decodedHtml);
            Assert.Contains("student%40zhongwenhub.edu.vn", decodedHtml);
        }
    }

    [Fact]
    public async Task ForgotPassword_WhenMailHostNotConfigured_Returns503ForBothExistingAndUnknownAccounts()
    {
        var client = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureAppConfiguration((ctx, config) =>
            {
                config.AddInMemoryCollection(new Dictionary<string, string?>
                {
                    ["PasswordReset:MailHost"] = "",
                    ["PasswordReset:FrontendUrl"] = "https://zhongwenhub.edu.vn/reset-password"
                });
            });
        }).CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = false });

        // Existing account
        var existingResp = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", new ForgotPasswordRequestDto { Email = "student@zhongwenhub.edu.vn" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, existingResp.StatusCode);

        // Unknown account
        var unknownResp = await client.PostAsJsonAsync("/api/v1/auth/forgot-password", new ForgotPasswordRequestDto { Email = "nonexistent_user_999@random.com" });
        Assert.Equal(HttpStatusCode.ServiceUnavailable, unknownResp.StatusCode);
    }
}

public class FailingEmailSenderStub : IPasswordResetEmailSender
{
    public void ValidateConfiguration()
    {
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default)
    {
        throw new System.Net.Mail.SmtpException("SMTP host connection refused. Mail service unreachable.");
    }
}

public class IntegrationTestMockSmtpServer : IAsyncDisposable
{
    private readonly System.Net.Sockets.TcpListener _listener;
    private readonly CancellationTokenSource _cts = new();
    private readonly TaskCompletionSource<bool> _messageReceivedTcs = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private readonly Task _listenTask;
    public int Port { get; }
    public List<string> ReceivedLines { get; } = new();

    public IntegrationTestMockSmtpServer()
    {
        _listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
        _listener.Start();
        Port = ((System.Net.IPEndPoint)_listener.LocalEndpoint).Port;
        _listenTask = Task.Run(ListenLoop);
    }

    public async Task<bool> WaitForMessageAsync(TimeSpan timeout)
    {
        using var timeoutCts = new CancellationTokenSource(timeout);
        try
        {
            var completedTask = await Task.WhenAny(_messageReceivedTcs.Task, Task.Delay(timeout, timeoutCts.Token));
            return completedTask == _messageReceivedTcs.Task;
        }
        catch
        {
            return false;
        }
    }

    private async Task ListenLoop()
    {
        try
        {
            using var client = await _listener.AcceptTcpClientAsync(_cts.Token);
            using var stream = client.GetStream();
            using var reader = new StreamReader(stream, System.Text.Encoding.ASCII);
            using var writer = new StreamWriter(stream, System.Text.Encoding.ASCII) { AutoFlush = true };

            await writer.WriteLineAsync("220 localhost ESMTP ZhongWenHubMockSmtp");

            bool inData = false;
            while (!_cts.IsCancellationRequested)
            {
                var line = await reader.ReadLineAsync(_cts.Token);
                if (line == null) break;
                lock (ReceivedLines) ReceivedLines.Add(line);

                if (inData)
                {
                    if (line == ".")
                    {
                        inData = false;
                        await writer.WriteLineAsync("250 2.0.0 OK message queued");
                        _messageReceivedTcs.TrySetResult(true);
                    }
                    continue;
                }

                if (line.StartsWith("EHLO", StringComparison.OrdinalIgnoreCase) || line.StartsWith("HELO", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("250-localhost");
                    await writer.WriteLineAsync("250 OK");
                }
                else if (line.StartsWith("MAIL FROM", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("250 2.1.0 Sender OK");
                }
                else if (line.StartsWith("RCPT TO", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("250 2.1.5 Recipient OK");
                }
                else if (line.StartsWith("DATA", StringComparison.OrdinalIgnoreCase))
                {
                    inData = true;
                    await writer.WriteLineAsync("354 Start mail input; end with <CRLF>.<CRLF>");
                }
                else if (line.StartsWith("QUIT", StringComparison.OrdinalIgnoreCase))
                {
                    await writer.WriteLineAsync("221 2.0.0 Service closing transmission channel");
                    break;
                }
                else
                {
                    await writer.WriteLineAsync("250 OK");
                }
            }
        }
        catch
        {
            // Disposed
        }
    }

    public async ValueTask DisposeAsync()
    {
        _cts.Cancel();
        _listener.Stop();
        try { await _listenTask; } catch { }
        _cts.Dispose();
    }
}
