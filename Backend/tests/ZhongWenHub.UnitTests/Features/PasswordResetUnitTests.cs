using System.ComponentModel.DataAnnotations;
using ZhongWenHub.Features.Auth.DTOs;
using ZhongWenHub.Models.Users;

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
    public async Task PasswordResetEmailSender_WithoutHost_ThrowsInvalidOperationException()
    {
        var config = new TestConfiguration(new Dictionary<string, string?>
        {
            { "PasswordReset:FrontendUrl", "https://zhongwenhub.edu.vn/reset-password" },
            { "PasswordReset:MailHost", "" }
        });

        var sender = new ZhongWenHub.Features.Auth.PasswordResetEmailSender(
            config,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ZhongWenHub.Features.Auth.PasswordResetEmailSender>.Instance);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sender.SendPasswordResetEmailAsync("test@example.com", "sample-token-123"));

        Assert.Contains("PasswordReset:MailHost", ex.Message);
    }

    [Fact]
    public async Task PasswordResetEmailSender_InsecureFrontendUrl_ThrowsInvalidOperationException()
    {
        var config = new TestConfiguration(new Dictionary<string, string?>
        {
            { "PasswordReset:MailHost", "smtp.example.com" },
            { "PasswordReset:FrontendUrl", "http://insecure-site.com/reset-password" }
        });

        var sender = new ZhongWenHub.Features.Auth.PasswordResetEmailSender(
            config,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ZhongWenHub.Features.Auth.PasswordResetEmailSender>.Instance);

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            sender.SendPasswordResetEmailAsync("test@example.com", "sample-token-123"));

        Assert.Contains("HTTPS", ex.Message);
    }

    [Fact]
    public async Task PasswordResetEmailSender_CancellationRequested_ThrowsOperationCanceledException()
    {
        var config = new TestConfiguration(new Dictionary<string, string?>
        {
            { "PasswordReset:MailHost", "smtp.example.com" },
            { "PasswordReset:FrontendUrl", "https://zhongwenhub.edu.vn/reset-password" }
        });

        var sender = new ZhongWenHub.Features.Auth.PasswordResetEmailSender(
            config,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ZhongWenHub.Features.Auth.PasswordResetEmailSender>.Instance);

        using var cts = new CancellationTokenSource();
        cts.Cancel();

        await Assert.ThrowsAsync<OperationCanceledException>(() =>
            sender.SendPasswordResetEmailAsync("test@example.com", "sample-token-123", cts.Token));
    }

    [Fact]
    public async Task PasswordResetEmailSender_SmtpFailure_ThrowsExceptionWithoutSwallowing()
    {
        var config = new TestConfiguration(new Dictionary<string, string?>
        {
            { "PasswordReset:MailHost", "127.0.0.1" },
            { "PasswordReset:MailPort", "59999" }, // Closed port
            { "PasswordReset:EnableSsl", "false" },
            { "PasswordReset:FrontendUrl", "https://zhongwenhub.edu.vn/reset-password" }
        });

        var sender = new ZhongWenHub.Features.Auth.PasswordResetEmailSender(
            config,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ZhongWenHub.Features.Auth.PasswordResetEmailSender>.Instance);

        await Assert.ThrowsAnyAsync<Exception>(() =>
            sender.SendPasswordResetEmailAsync("test@example.com", "sample-token-123"));
    }

    [Fact]
    public async Task PasswordResetEmailSender_RealSmtpSocketServer_TransmitsFullEmailAndResetLink()
    {
        await using var server = new LightweightMockSmtpServer();

        var config = new TestConfiguration(new Dictionary<string, string?>
        {
            { "PasswordReset:MailHost", "127.0.0.1" },
            { "PasswordReset:MailPort", server.Port.ToString() },
            { "PasswordReset:EnableSsl", "false" },
            { "PasswordReset:From", "no-reply@zhongwenhub.edu.vn" },
            { "PasswordReset:FrontendUrl", "https://zhongwenhub.edu.vn/reset-password" }
        });

        var sender = new ZhongWenHub.Features.Auth.PasswordResetEmailSender(
            config,
            Microsoft.Extensions.Logging.Abstractions.NullLogger<ZhongWenHub.Features.Auth.PasswordResetEmailSender>.Instance);

        using var testCts = new CancellationTokenSource(TimeSpan.FromSeconds(15));
        await sender.SendPasswordResetEmailAsync("learner@zhongwenhub.edu.vn", "real-smtp-token-98765", testCts.Token);

        var messageReceived = await server.WaitForMessageAsync(TimeSpan.FromSeconds(5));
        Assert.True(messageReceived, "Mock SMTP server did not receive the queued message within 5 seconds.");

        lock (server.ReceivedLines)
        {
            Assert.Contains(server.ReceivedLines, l => l.Contains("learner@zhongwenhub.edu.vn"));
            Assert.Contains(server.ReceivedLines, l => l.Contains("RCPT TO:<learner@zhongwenhub.edu.vn>"));
            Assert.Contains(server.ReceivedLines, l => l.Contains("MAIL FROM:<no-reply@zhongwenhub.edu.vn>"));

            // Reconstruct MIME base64 payload
            var base64Lines = server.ReceivedLines
                .SkipWhile(l => !l.StartsWith("Content-Transfer-Encoding", StringComparison.OrdinalIgnoreCase))
                .Skip(1) // skip Content-Transfer-Encoding header
                .SkipWhile(string.IsNullOrWhiteSpace)
                .TakeWhile(l => l != ".");

            var base64Body = string.Concat(base64Lines);
            var decodedHtml = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(base64Body));

            Assert.Contains("real-smtp-token-98765", decodedHtml);
            Assert.Contains("https://zhongwenhub.edu.vn/reset-password", decodedHtml);
        }
    }

    private class LightweightMockSmtpServer : IAsyncDisposable
    {
        private readonly System.Net.Sockets.TcpListener _listener;
        private readonly CancellationTokenSource _cts = new();
        private readonly TaskCompletionSource<bool> _messageReceivedTcs = new(TaskCreationOptions.RunContinuationsAsynchronously);
        private readonly Task _listenTask;
        public int Port { get; }
        public List<string> ReceivedLines { get; } = new();

        public LightweightMockSmtpServer()
        {
            _listener = new System.Net.Sockets.TcpListener(System.Net.IPAddress.Loopback, 0);
            _listener.Start();
            Port = ((System.Net.IPEndPoint)_listener.LocalEndpoint).Port;
            _listenTask = Task.Run(ListenLoop);
        }

        public async Task<bool> WaitForMessageAsync(TimeSpan timeout)
        {
            using var timeoutCts = new CancellationTokenSource(timeout);
            var completedTask = await Task.WhenAny(_messageReceivedTcs.Task, Task.Delay(timeout, timeoutCts.Token));
            if (completedTask == _messageReceivedTcs.Task)
            {
                return await _messageReceivedTcs.Task;
            }
            return false;
        }

        private async Task ListenLoop()
        {
            try
            {
                using var client = await _listener.AcceptTcpClientAsync(_cts.Token);
                using var stream = client.GetStream();
                using var reader = new StreamReader(stream, System.Text.Encoding.ASCII);
                using var writer = new StreamWriter(stream, System.Text.Encoding.ASCII) { AutoFlush = true, NewLine = "\r\n" };

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
            catch (Exception ex) when (!_cts.IsCancellationRequested)
            {
                _messageReceivedTcs.TrySetException(ex);
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
