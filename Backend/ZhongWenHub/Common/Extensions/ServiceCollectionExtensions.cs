using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Common.Auth;

namespace ZhongWenHub.Common.Extensions;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddAppDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("DefaultConnection");
        if (string.IsNullOrWhiteSpace(connectionString))
        {
            throw new InvalidOperationException("DefaultConnection connection string is not configured.");
        }

        services.AddDbContext<AppDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(AppDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
            });
        });

        // Also register ApplicationDbContext for backward compatibility
        services.AddScoped<ZhongWenHub.Data.Persistence.ApplicationDbContext>(sp =>
        {
            var options = sp.GetRequiredService<DbContextOptions<AppDbContext>>();
            return new ZhongWenHub.Data.Persistence.ApplicationDbContext(options);
        });

        // ASP.NET Core Identity with simple local security profile
        services.AddIdentity<ApplicationUser, ApplicationRole>(options =>
        {
            options.Password.RequireDigit = false;
            options.Password.RequireLowercase = false;
            options.Password.RequireUppercase = false;
            options.Password.RequireNonAlphanumeric = false;
            options.Password.RequiredLength = 6;
            options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
            options.Lockout.MaxFailedAccessAttempts = 5;
            options.Lockout.AllowedForNewUsers = true;
            options.User.RequireUniqueEmail = true;
            options.SignIn.RequireConfirmedEmail = false;
        })
        .AddEntityFrameworkStores<AppDbContext>()
        .AddDefaultTokenProviders();

        return services;
    }

    public static IServiceCollection AddAppAuthentication(this IServiceCollection services, IConfiguration configuration)
    {
        var secret = configuration["JwtSettings:Secret"];
        if (string.IsNullOrWhiteSpace(secret) || secret.Length < 32)
        {
            secret = "ZhongWenHub_Local_Fallback_Secret_Key_32_Bytes_Long_2026!";
        }

        var issuer = configuration["JwtSettings:Issuer"] ?? "ZhongWenHub";
        var audience = configuration["JwtSettings:Audience"] ?? "ZhongWenHub-Client";

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
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,
                ValidIssuer = issuer,
                ValidAudience = audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret)),
                ClockSkew = TimeSpan.Zero
            };
        });

        services.AddAuthorization(options =>
        {
            options.AddPolicy(PolicyConstants.AdminAccess, policy => policy.RequireRole(RoleConstants.Admin));
            options.AddPolicy(PolicyConstants.ContentManagementAccess, policy => policy.RequireRole(RoleConstants.Admin, RoleConstants.ContentManager));
            options.AddPolicy(PolicyConstants.TeacherAccess, policy => policy.RequireRole(RoleConstants.Admin, RoleConstants.Teacher));
            options.AddPolicy(PolicyConstants.SupportAccess, policy => policy.RequireRole(RoleConstants.Admin, RoleConstants.Support));
            options.AddPolicy(PolicyConstants.StudentAccess, policy => policy.RequireRole(RoleConstants.Admin, RoleConstants.ContentManager, RoleConstants.Teacher, RoleConstants.Support, RoleConstants.Student));
            options.AddPolicy(PolicyConstants.SystemSettingsManage, policy => policy.RequireRole(RoleConstants.Admin));
            options.AddPolicy(PolicyConstants.UserManagementAccess, policy => policy.RequireRole(RoleConstants.Admin));
            options.AddPolicy(PolicyConstants.QuestionBankReadAccess, policy => policy.RequireRole(RoleConstants.Admin, RoleConstants.ContentManager, RoleConstants.Teacher));
        });

        return services;
    }

    public static IServiceCollection AddAppSwagger(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "ZhongWenHub API",
                Version = "v1",
                Description = "ZhongWenHub Simplified Modular Web API"
            });

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT",
                In = ParameterLocation.Header,
                Description = "Enter JWT Bearer token"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }
                    },
                    Array.Empty<string>()
                }
            });

            c.TagActionsBy(api =>
            {
                if (api.GroupName != null) return new[] { api.GroupName };
                if (api.ActionDescriptor is Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor desc)
                {
                    return new[] { desc.ControllerName };
                }
                return new[] { "General" };
            });
            c.DocInclusionPredicate((_, _) => true);
        });

        return services;
    }
}
