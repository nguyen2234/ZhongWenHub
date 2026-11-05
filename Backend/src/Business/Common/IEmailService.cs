namespace ZhongWenHub.Business.Common;

public interface IEmailService
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetLink, CancellationToken cancellationToken = default);
    Task SendEmailConfirmationAsync(string toEmail, string confirmLink, CancellationToken cancellationToken = default);
    Task SendAccountInvitationEmailAsync(string toEmail, string setupLink, CancellationToken cancellationToken = default);
}
