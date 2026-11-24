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
using System.Security.Claims;
using Microsoft.Extensions.Options;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Common.Auth;
using ZhongWenHub.Features.Auth;

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

        services.AddDbContext<ApplicationDbContext>(options =>
        {
            options.UseSqlServer(connectionString, sqlOptions =>
            {
                sqlOptions.MigrationsAssembly(typeof(ApplicationDbContext).Assembly.FullName);
                sqlOptions.EnableRetryOnFailure(maxRetryCount: 5, maxRetryDelay: TimeSpan.FromSeconds(10), errorNumbersToAdd: null);
            });
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
        .AddEntityFrameworkStores<ApplicationDbContext>()
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

        services.Configure<JwtSettings>(options =>
        {
            configuration.GetSection(JwtSettings.SectionName).Bind(options);
            if (string.IsNullOrWhiteSpace(options.Secret) || options.Secret.Length < 32)
            {
                options.Secret = secret;
            }
            if (string.IsNullOrWhiteSpace(options.Issuer)) options.Issuer = issuer;
            if (string.IsNullOrWhiteSpace(options.Audience)) options.Audience = audience;
        });

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

            options.Events = new JwtBearerEvents
            {
                OnMessageReceived = context =>
                {
                    var jwtOptions = context.HttpContext.RequestServices.GetRequiredService<IOptions<JwtSettings>>().Value;
                    var effectiveSecret = string.IsNullOrWhiteSpace(jwtOptions.Secret) || jwtOptions.Secret.Length < 32
                        ? secret
                        : jwtOptions.Secret;
                    var effectiveIssuer = string.IsNullOrWhiteSpace(jwtOptions.Issuer) ? issuer : jwtOptions.Issuer;
                    var effectiveAudience = string.IsNullOrWhiteSpace(jwtOptions.Audience) ? audience : jwtOptions.Audience;

                    context.Options.TokenValidationParameters.IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(effectiveSecret));
                    context.Options.TokenValidationParameters.ValidIssuer = effectiveIssuer;
                    context.Options.TokenValidationParameters.ValidAudience = effectiveAudience;
                    return Task.CompletedTask;
                },
                OnTokenValidated = async context =>
                {
                    var userIdStr = context.Principal?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                        ?? context.Principal?.FindFirst("sub")?.Value;

                    if (!Guid.TryParse(userIdStr, out var userId))
                    {
                        context.Fail("Mã người dùng không hợp lệ trong token.");
                        return;
                    }

                    var dbContext = context.HttpContext.RequestServices.GetRequiredService<ApplicationDbContext>();
                    var user = await dbContext.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == userId);

                    if (user == null || user.IsDeleted || user.Status != UserStatus.ACTIVE)
                    {
                        context.Fail("Tài khoản đã bị xóa, khóa hoặc không hoạt động.");
                        return;
                    }

                    var tokenStamp = context.Principal?.FindFirst("security_stamp")?.Value;
                    if (!string.IsNullOrEmpty(user.SecurityStamp) &&
                        !string.IsNullOrEmpty(tokenStamp) &&
                        !string.Equals(tokenStamp, user.SecurityStamp, StringComparison.Ordinal))
                    {
                        context.Fail("Phiên làm việc đã bị hủy do thay đổi trạng thái hoặc quyền tài khoản.");
                        return;
                    }

                    // Dynamically synchronize current active roles from database
                    var currentRoles = await (from ur in dbContext.UserRoles.AsNoTracking()
                                              join r in dbContext.Roles.AsNoTracking() on ur.RoleId equals r.Id
                                              where ur.UserId == userId
                                              select r.Name).ToListAsync();

                    if (context.Principal?.Identity is ClaimsIdentity identity)
                    {
                        var existingRoleClaims = identity.FindAll(ClaimTypes.Role)
                            .Concat(identity.FindAll("role"))
                            .Concat(identity.FindAll("roles"))
                            .ToList();

                        foreach (var rc in existingRoleClaims)
                        {
                            identity.RemoveClaim(rc);
                        }

                        foreach (var r in currentRoles)
                        {
                            if (r != null)
                            {
                                identity.AddClaim(new System.Security.Claims.Claim(ClaimTypes.Role, r));
                                identity.AddClaim(new System.Security.Claims.Claim("role", r));
                                identity.AddClaim(new System.Security.Claims.Claim("roles", r));
                            }
                        }
                    }
                }
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
                Description = "Tài liệu API và giao diện kiểm thử trực tiếp cho Nền tảng Học tiếng Trung ZhongWenHub tích hợp AI.\n\n" +
                              "**Hướng dẫn kiểm thử với JWT Authorize:**\n" +
                              "1. Mở nhóm **Auth**, gọi endpoint `POST /api/v1/auth/login` (hoặc `POST /api/v1/auth/register` nếu chưa có tài khoản).\n" +
                              "2. Sao chép chuỗi `accessToken` từ response trả về.\n" +
                              "3. Nhấn nút **Authorize 🔓** ở góc trên bên phải màn hình Swagger UI.\n" +
                              "4. Dán token vào ô `Value` (Swagger UI sẽ tự động gắn header `Authorization: Bearer {token}`).\n" +
                              "5. Nhấn **Authorize** rồi **Close**. Lúc này bạn có thể kiểm thử toàn bộ các API yêu cầu đăng nhập và phân quyền.",
                Contact = new OpenApiContact
                {
                    Name = "ZhongWenHub Engineering Team",
                    Email = "support@zhongwenhub.edu.vn"
                }
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
