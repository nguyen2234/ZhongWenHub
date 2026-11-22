using System;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Common.Extensions;

namespace ZhongWenHub.Business;

public static class BusinessCompatibilityExtensions
{
    public static IServiceCollection AddBusiness(this IServiceCollection services, IConfiguration configuration)
    {
        var jwtSettings = new JwtSettings();
        configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
        if (string.IsNullOrWhiteSpace(jwtSettings.Secret) || jwtSettings.Secret.Length < 32)
        {
            throw new InvalidOperationException(
                "Cấu hình 'JwtSettings:Secret' là bắt buộc và phải có độ dài tối thiểu 32 ký tự (256-bit). " +
                "Vui lòng cấu hình qua .NET User Secrets (Development) hoặc biến môi trường JwtSettings__Secret (Production/Testing). " +
                "Không được đặt secret thật trong appsettings.json.");
        }

        services.Configure<JwtSettings>(options =>
        {
            options.Secret = jwtSettings.Secret;
            options.Issuer = jwtSettings.Issuer;
            options.Audience = jwtSettings.Audience;
            options.AccessTokenExpirationMinutes = jwtSettings.AccessTokenExpirationMinutes;
            options.RefreshTokenExpirationDays = jwtSettings.RefreshTokenExpirationDays;
            options.RefreshTokenExpirationDaysRememberMe = jwtSettings.RefreshTokenExpirationDaysRememberMe;
        });

        services.AddAppAuthentication(configuration);
        return services;
    }
}
