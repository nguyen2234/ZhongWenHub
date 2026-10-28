using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ZhongWenHub.Application.Abstractions;
using ZhongWenHub.Application.Services;
using ZhongWenHub.Domain.Constants;
using ZhongWenHub.Infrastructure.Authentication;
using ZhongWenHub.Infrastructure.Identity;
using ZhongWenHub.Infrastructure.Persistence;
using ZhongWenHub.Infrastructure.Services;

namespace ZhongWenHub.Infrastructure.DependencyInjection;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        // Configure Database (PostgreSQL)
        var connectionString = configuration.GetConnectionString("DefaultConnection")
            ?? "Host=localhost;Port=5432;Database=zhongwenhub_dev;Username=postgres;Password=postgres";

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseNpgsql(connectionString, npgsqlOptions =>
            {
                npgsqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                npgsqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorCodesToAdd: null);
            });
        });

        services.AddScoped<IApplicationDbContext>(sp => sp.GetRequiredService<ApplicationDbContext>());

        // Configure ASP.NET Core Identity
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            // Password settings
            options.Password.RequireDigit = true;
            options.Password.RequireLowercase = true;
            options.Password.RequireUppercase = true;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 8;
            options.Password.RequiredUniqueChars = 1;

            // Lockout settings
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;

            // User settings
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = false;
        })
        .AddEntityFrameworkStores<ApplicationDbContext>()
        .AddDefaultTokenProviders();

        // Configure JWT Settings
        var jwtSettings = new JwtSettings();
        configuration.GetSection(JwtSettings.SectionName).Bind(jwtSettings);
        if (string.IsNullOrWhiteSpace(jwtSettings.Secret))
        {
            // Fallback for development if not provided in configuration
            jwtSettings.Secret = "ZhongWenHub_Development_Super_Secret_Key_At_Least_32_Bytes_Long_2026!";
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
            options.RequireHttpsMetadata = false; // set false for dev flexibility
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
                policy.RequireRole(RoleConstants.SuperAdmin, RoleConstants.Admin));

            options.AddPolicy(PolicyConstants.ContentManagementAccess, policy =>
                policy.RequireRole(RoleConstants.SuperAdmin, RoleConstants.Admin, RoleConstants.ContentManager));

            options.AddPolicy(PolicyConstants.TeacherAccess, policy =>
                policy.RequireRole(RoleConstants.SuperAdmin, RoleConstants.Admin, RoleConstants.Teacher));

            options.AddPolicy(PolicyConstants.SupportAccess, policy =>
                policy.RequireRole(RoleConstants.SuperAdmin, RoleConstants.Admin, RoleConstants.Support));

            options.AddPolicy(PolicyConstants.StudentAccess, policy =>
                policy.RequireRole(RoleConstants.SuperAdmin, RoleConstants.Admin, RoleConstants.ContentManager, RoleConstants.Teacher, RoleConstants.Support, RoleConstants.Student));

            options.AddPolicy(PolicyConstants.SystemSettingsManage, policy =>
                policy.RequireRole(RoleConstants.SuperAdmin));

            options.AddPolicy(PolicyConstants.UserManagementAccess, policy =>
                policy.RequireRole(RoleConstants.SuperAdmin, RoleConstants.Admin));
        });

        // Services
        services.AddHttpContextAccessor();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        return services;
    }
}
