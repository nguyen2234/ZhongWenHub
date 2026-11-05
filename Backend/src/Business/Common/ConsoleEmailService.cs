using Microsoft.Extensions.Logging;

namespace ZhongWenHub.Business.Common;

public class ConsoleEmailService : IEmailService
{
    private readonly ILogger<ConsoleEmailService> _logger;

    public ConsoleEmailService(ILogger<ConsoleEmailService> logger)
    {
        _logger = logger;
    }

    public Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[EMAIL SERVICE] Password reset email sent to {Email}. Reset link: {ResetLink}", toEmail, resetLink);
        return Task.CompletedTask;
    }

    public Task SendEmailConfirmationAsync(string toEmail, string confirmLink, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[EMAIL SERVICE] Email confirmation sent to {Email}. Confirmation link: {ConfirmLink}", toEmail, confirmLink);
        return Task.CompletedTask;
    }

    public Task SendAccountInvitationEmailAsync(string toEmail, string setupLink, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("[EMAIL SERVICE] Account invitation sent to {Email}. Setup link: {SetupLink}", toEmail, setupLink);
        return Task.CompletedTask;
    }
}
