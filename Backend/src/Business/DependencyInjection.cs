using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common;
using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Exams;
using ZhongWenHub.Business.QuestionBank;
using ZhongWenHub.Business.Learning;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;

namespace ZhongWenHub.Business;

public static class DependencyInjection
{
    public static IServiceCollection AddBusiness(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure JWT Settings
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

        // Configure Authentication
        var key = Encoding.UTF8.GetBytes(jwtSettings.Secret);
        services.AddAuthentication(options =>
        {
            options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
            options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
        })
        .AddJwtBearer(options =>
        {
            options.RequireHttpsMetadata = false;
            options.SaveToken = true;
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(key),
                ValidateIssuer = true,
                ValidIssuer = jwtSettings.Issuer,
                ValidateAudience = true,
                ValidAudience = jwtSettings.Audience,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.Zero
            };
        });

        // Configure Policy-Based Authorization
        services.AddAuthorization(options =>
        {
            options.AddPolicy(PolicyConstants.AdminAccess, policy =>
                policy.RequireRole(RoleConstants.Admin));

            options.AddPolicy(PolicyConstants.ContentManagementAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.ContentManager));

            options.AddPolicy(PolicyConstants.TeacherAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.Teacher));

            options.AddPolicy(PolicyConstants.SupportAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.Support));

            options.AddPolicy(PolicyConstants.StudentAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.ContentManager, RoleConstants.Teacher, RoleConstants.Support, RoleConstants.Student));

            options.AddPolicy(PolicyConstants.SystemSettingsManage, policy =>
                policy.RequireRole(RoleConstants.Admin));

            options.AddPolicy(PolicyConstants.UserManagementAccess, policy =>
                policy.RequireRole(RoleConstants.Admin));
        });

        // Business Services
        services.AddHttpContextAccessor();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ILearningService, LearningService>();
        services.AddScoped<IContentService, ContentService>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IQuestionBankService, QuestionBankService>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        return services;
    }
}
