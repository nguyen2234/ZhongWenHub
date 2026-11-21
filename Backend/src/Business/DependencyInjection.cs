using ZhongWenHub.Business.Content.Services.Storage;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AILearning.Services.Diagnostic;
using ZhongWenHub.Business.AILearning.Services.Recommendation;
using ZhongWenHub.Business.AILearning.Services.Speech;
using ZhongWenHub.Business.Admin;
using ZhongWenHub.Business.Admin.Services;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common;
using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Content.Services;
using ZhongWenHub.Business.Exams;
using ZhongWenHub.Business.QuestionBank;
using ZhongWenHub.Business.Learning;
using ZhongWenHub.Business.Support.Services;
using ZhongWenHub.Business.Teacher.Services;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

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
            options.Events = new JwtBearerEvents
            {
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

                    // Dynamically synchronize current active roles and permissions from database
                    var roleData = await (from ur in dbContext.UserRoles.AsNoTracking()
                                          join r in dbContext.Roles.AsNoTracking() on ur.RoleId equals r.Id
                                          where ur.UserId == userId
                                          select new { r.Id, r.Name }).ToListAsync();

                    var currentRoles = roleData.Select(rd => rd.Name).Where(n => n != null).ToList();
                    var roleIds = roleData.Select(rd => rd.Id).ToList();

                    var permissions = await dbContext.RoleClaims.AsNoTracking()
                        .Where(rc => roleIds.Contains(rc.RoleId) && (rc.ClaimType == "permission" || rc.ClaimType == "Permission"))
                        .Select(rc => rc.ClaimValue!)
                        .Where(cv => !string.IsNullOrEmpty(cv))
                        .Distinct()
                        .ToListAsync();

                    // If user is Admin and no explicit RoleClaims exist in DB yet, assign all baseline permissions
                    if (currentRoles.Any(r => string.Equals(r, RoleConstants.Admin, StringComparison.OrdinalIgnoreCase)) && !permissions.Any())
                    {
                        permissions = new List<string> { "ADMIN_ACCESS", "USER_VIEW", "USER_CREATE", "USER_UPDATE", "USER_ROLE_ASSIGN", "SYSTEM_SETTINGS_UPDATE", "CONTENT_VIEW", "REPORT_VIEW" };
                    }

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
                                identity.AddClaim(new Claim(ClaimTypes.Role, r));
                                identity.AddClaim(new Claim("role", r));
                                identity.AddClaim(new Claim("roles", r));
                            }
                        }

                        var existingPermissionClaims = identity.FindAll("permission")
                            .Concat(identity.FindAll("Permission"))
                            .ToList();

                        foreach (var pc in existingPermissionClaims)
                        {
                            identity.RemoveClaim(pc);
                        }

                        foreach (var p in permissions)
                        {
                            if (p != null)
                            {
                                identity.AddClaim(new Claim("permission", p));
                                identity.AddClaim(new Claim("Permission", p));
                            }
                        }
                    }
                }
            };
        });

        // Configure Policy-Based Authorization
        services.AddAuthorization(options =>
        {
            options.AddPolicy(PolicyConstants.AdminAccess, policy =>
                policy.RequireRole(RoleConstants.Admin));

            options.AddPolicy(PolicyConstants.ContentManagementAccess, policy =>
                policy.RequireAssertion(ctx =>
                    ctx.User.IsInRole(RoleConstants.Admin) ||
                    ctx.User.IsInRole(RoleConstants.ContentManager) ||
                    ctx.User.HasClaim(c => (c.Type == "permission" || c.Type == "Permission") && c.Value == "CONTENT_VIEW")));

            options.AddPolicy(PolicyConstants.TeacherAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.Teacher));

            options.AddPolicy(PolicyConstants.SupportAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.Support));

            options.AddPolicy(PolicyConstants.StudentAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.ContentManager, RoleConstants.Teacher, RoleConstants.Support, RoleConstants.Student));

            options.AddPolicy(PolicyConstants.SystemSettingsManage, policy =>
                policy.RequireAssertion(ctx =>
                    ctx.User.IsInRole(RoleConstants.Admin) &&
                    ctx.User.HasClaim(c => (c.Type == "permission" || c.Type == "Permission") && c.Value == "SYSTEM_SETTINGS_UPDATE")));

            options.AddPolicy(PolicyConstants.UserManagementAccess, policy =>
                policy.RequireAssertion(ctx =>
                    ctx.User.IsInRole(RoleConstants.Admin) &&
                    ctx.User.HasClaim(c => (c.Type == "permission" || c.Type == "Permission") && c.Value == "USER_VIEW")));

            options.AddPolicy(PolicyConstants.QuestionBankReadAccess, policy =>
                policy.RequireRole(RoleConstants.Admin, RoleConstants.ContentManager, RoleConstants.Teacher));
        });

        // Business Services
        services.AddHttpContextAccessor();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordResetEmailSender, PasswordResetEmailSender>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminOperationsService, AdminOperationsService>();
        services.AddScoped<IAiProviderConfigService, AiProviderConfigService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ILearningService, LearningService>();
        services.AddScoped<IContentService, ContentService>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<IQuestionBankService, QuestionBankService>();
        services.AddScoped<ITeacherClassService, TeacherClassService>();
        services.AddScoped<ITeacherAttendanceService, TeacherAttendanceService>();
        services.AddScoped<ITeacherAssignmentService, TeacherAssignmentService>();
        services.AddScoped<IStudentHomeworkService, StudentHomeworkService>();
        services.AddScoped<ISupportTicketService, SupportTicketService>();
        services.AddScoped<IContentIssueService, ContentIssueService>();
        services.Configure<VideoStorageOptions>(configuration.GetSection(VideoStorageOptions.SectionName));
        services.AddHttpClient<VideoStorageService>();
        services.AddScoped<IVideoStorageService, VideoStorageService>();
        services.AddScoped<IUploadAssetService, UploadAssetService>();
        services.AddScoped<IStorageCleanupService, StorageCleanupService>();
        services.AddScoped<ILearningVideoService, LearningVideoService>();
        services.AddHostedService<VideoStorageCleanupWorker>();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        // AI Tutor, Provider Layer & AI Learning Engine V1
        services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));
        services.AddHttpClient<GeminiProvider>();
        services.AddSingleton<MockAIProvider>();
        services.AddScoped<IAIProvider, ConfigurableAIProvider>();
        services.AddScoped<IAIUsageLogger, EfAIUsageLogger>();
        services.AddScoped<IAITutorContextVerifier, EfAITutorContextVerifier>();
        services.AddScoped<IAITutorService, AITutorService>();
        services.AddScoped<IAIConversationService, AIConversationService>();
        services.AddScoped<IAIExerciseService, AIExerciseService>();
        services.AddScoped<IAIErrorAnalysisService, AIErrorAnalysisService>();
        services.AddScoped<IPersonalizedLearningService, PersonalizedLearningService>();
        services.AddScoped<ICompetencyProfileService, CompetencyProfileService>();
        services.AddScoped<IRecommendationEngineV2, RecommendationEngineV2>();
        services.AddScoped<IDiagnosticAssessmentService, DiagnosticAssessmentService>();
        services.AddScoped<ZhongWenHub.Business.AILearning.Services.LearningPath.ILearningPathService, ZhongWenHub.Business.AILearning.Services.LearningPath.LearningPathService>();
        services.AddScoped<ISpeechRecognitionService, GeminiSpeechRecognitionService>();
        services.AddScoped<IAIPronunciationService, AIPronunciationService>();
        services.AddScoped<IAISpeakingService, AISpeakingService>();

        return services;
    }
}
