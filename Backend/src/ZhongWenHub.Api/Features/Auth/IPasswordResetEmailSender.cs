using System.Threading;
using System.Threading.Tasks;

namespace ZhongWenHub.Features.Auth;

public interface IPasswordResetEmailSender
{
    void ValidateConfiguration();
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default);
}
