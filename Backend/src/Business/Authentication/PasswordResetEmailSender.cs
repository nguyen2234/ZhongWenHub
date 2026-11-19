using System;
using System.Net;
using System.Net.Mail;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace ZhongWenHub.Business.Authentication;

public class PasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<PasswordResetEmailSender> _logger;

    public PasswordResetEmailSender(IConfiguration configuration, ILogger<PasswordResetEmailSender> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendPasswordResetEmailAsync(string toEmail, string resetToken, CancellationToken cancellationToken = default)
    {
        var mailHost = _configuration["PasswordReset:MailHost"] ?? _configuration["PasswordReset__MailHost"];
        var portStr = _configuration["PasswordReset:MailPort"] ?? _configuration["PasswordReset__MailPort"];
        var mailPort = int.TryParse(portStr, out var p) ? p : 587;
        var from = _configuration["PasswordReset:From"] ?? _configuration["PasswordReset__From"] ?? "no-reply@zhongwenhub.edu.vn";
        var username = _configuration["PasswordReset:MailUsername"] ?? _configuration["PasswordReset__MailUsername"];
        var password = _configuration["PasswordReset:MailPassword"] ?? _configuration["PasswordReset__MailPassword"];
        var frontendUrl = _configuration["PasswordReset:FrontendUrl"] ?? _configuration["PasswordReset__FrontendUrl"] ?? "https://zhongwenhub.edu.vn/reset-password";

        if (string.IsNullOrWhiteSpace(mailHost))
        {
            _logger.LogWarning("PasswordReset:MailHost is not configured. Reset email was skipped for recipient {Email}.", toEmail);
            return;
        }

        var encodedToken = Uri.EscapeDataString(resetToken);
        var encodedEmail = Uri.EscapeDataString(toEmail);
        var resetLink = $"{frontendUrl.TrimEnd('/')}?token={encodedToken}&email={encodedEmail}";

        var mailMessage = new MailMessage
        {
            From = new MailAddress(from, "ZhongWenHub (中文社)"),
            Subject = "[ZhongWenHub] Hướng dẫn đặt lại mật khẩu tài khoản",
            IsBodyHtml = true,
            Body = $@"<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8'>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1e293b; background-color: #f8fafc; margin: 0; padding: 20px; }}
        .card {{ max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }}
        .header {{ font-size: 22px; font-weight: 700; color: #e60012; margin-bottom: 20px; }}
        .btn {{ display: inline-block; background-color: #e60012; color: #ffffff !important; padding: 12px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; margin: 24px 0; }}
        .link-box {{ background-color: #f1f5f9; border: 1px dashed #cbd5e1; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; color: #475569; }}
        .footer {{ font-size: 12px; color: #94a3b8; margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 16px; }}
    </style>
</head>
<body>
    <div class='card'>
        <div class='header'>ZhongWenHub (中文社)</div>
        <p>Xin chào,</p>
        <p>Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản <strong>{toEmail}</strong>.</p>
        <p>Vui lòng nhấn vào nút bên dưới để tiến hành đặt lại mật khẩu mới:</p>
        <p><a href='{resetLink}' class='btn'>Đặt lại mật khẩu</a></p>
        <p>Hoặc truy cập trực tiếp bằng đường dẫn sau:</p>
        <p class='link-box'>{resetLink}</p>
        <p><strong>Lưu ý:</strong> Liên kết có hiệu lực trong 24 giờ. Vì lý do bảo mật, tuyệt đối không chia sẻ liên kết này cho bất kỳ ai.</p>
        <div class='footer'>
            &copy; 2026 ZhongWenHub. Email này được tạo tự động, vui lòng không trả lời thư này.
        </div>
    </div>
</body>
</html>"
        };

        mailMessage.To.Add(new MailAddress(toEmail));

        using var client = new SmtpClient(mailHost, mailPort)
        {
            EnableSsl = true // Enables TLS / STARTTLS on port 587
        };

        if (!string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password))
        {
            client.UseDefaultCredentials = false;
            client.Credentials = new NetworkCredential(username, password);
        }

        try
        {
            await client.SendMailAsync(mailMessage, cancellationToken);
            _logger.LogInformation("Password reset email sent successfully via STARTTLS to {Email}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send password reset email via SMTP to {Email}", toEmail);
            // Fail closed gracefully without leaking SMTP secrets or internal credentials
        }
    }
}
