using System.Threading;
using System.Threading.Tasks;

namespace ZhongWenHub.Business.Authentication;

public interface IPasswordResetEmailSender
{
    Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default);
}
