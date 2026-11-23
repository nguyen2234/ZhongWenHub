using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Identity;
using ZhongWenHub.Api.Middleware;
using ZhongWenHub.Common.Extensions;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Business.Admin;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AILearning.Services.Diagnostic;
using ZhongWenHub.Business.AILearning.Services.Recommendation;
using ZhongWenHub.Business.AILearning.Services.Speech;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Business.Authentication;
using ZhongWenHub.Business.Authorization;
using ZhongWenHub.Business.Common;
using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Content.Services.Storage;
using ZhongWenHub.Business.Exams;
using ZhongWenHub.Business.QuestionBank;
using ZhongWenHub.Business.Learning;
using ZhongWenHub.Business.Teacher.Services;
using ZhongWenHub.Business.Users;
using ZhongWenHub.Common.AI;
using ZhongWenHub.Features.admin.AiProviders;

namespace ZhongWenHub;

public class Program
{
    public static async Task Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Core Infrastructure & Security
        builder.Services.AddAppDatabase(builder.Configuration);
        builder.Services.AddAppAuthentication(builder.Configuration);
        builder.Services.AddAppSwagger();
        builder.Services.AddHealthChecks()
            .AddDbContextCheck<ApplicationDbContext>("Database");

        // MVC Controllers & JSON Configuration
        builder.Services.AddControllers()
            .AddJsonOptions(options =>
            {
                options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
                options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
                options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
            });

        builder.Services.Configure<RouteOptions>(options =>
        {
            options.LowercaseUrls = true;
        });

        // Feature Services
        RegisterFeatureServices(builder.Services, builder.Configuration);

        var app = builder.Build();

        // Pipeline Middleware
        app.UseMiddleware<SecurityHeadersMiddleware>();
        app.UseMiddleware<ProblemDetailsMiddleware>();

        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "ZhongWenHub API v1");
                c.RoutePrefix = "swagger";
                c.DocumentTitle = "ZhongWenHub API - Swagger UI";
                c.DisplayRequestDuration();
                c.EnablePersistAuthorization();
                c.DocExpansion(Swashbuckle.AspNetCore.SwaggerUI.DocExpansion.List);
            });
        }

        app.UseRouting();
        app.UseCors("AllowFrontend");

        app.Use(async (context, next) =>
        {
            await next();

            if (context.Response.StatusCode == StatusCodes.Status401Unauthorized && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/problem+json";
                var problem = new ZhongWenHub.Business.Common.DTOs.ApiProblemDetailsDto
                {
                    Type = "https://httpstatuses.com/401",
                    Title = "Yêu cầu chưa được xác thực",
                    Status = StatusCodes.Status401Unauthorized,
                    Detail = "Bạn cần đăng nhập để truy cập tài nguyên này.",
                    Instance = context.Request.Path,
                    TraceId = context.TraceIdentifier
                };
                await context.Response.WriteAsync(JsonSerializer.Serialize(problem, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
            }
            else if (context.Response.StatusCode == StatusCodes.Status403Forbidden && !context.Response.HasStarted)
            {
                context.Response.ContentType = "application/problem+json";
                var problem = new ZhongWenHub.Business.Common.DTOs.ApiProblemDetailsDto
                {
                    Type = "https://httpstatuses.com/403",
                    Title = "Truy cập bị từ chối",
                    Status = StatusCodes.Status403Forbidden,
                    Detail = "Tài khoản của bạn không có quyền thực hiện thao tác này.",
                    Instance = context.Request.Path,
                    TraceId = context.TraceIdentifier
                };
                await context.Response.WriteAsync(JsonSerializer.Serialize(problem, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }));
            }
        });

        app.UseAuthentication();
        app.UseAuthorization();

        app.MapHealthChecks("/health");
        app.MapHealthChecks("/api/v1/system/health");
        app.MapControllers();

        // Auto-migration & Seeding
        using (var scope = app.Services.CreateScope())
        {
            var sp = scope.ServiceProvider;
            var logger = sp.GetRequiredService<ILogger<Program>>();
            var db = sp.GetRequiredService<ApplicationDbContext>();

            try
            {
                var autoMigrate = app.Configuration.GetValue<bool>("Database:AutoMigrate", false);
                var enableSeed = app.Configuration.GetValue<bool>("Database:EnableSeed", false);
                var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = sp.GetRequiredService<RoleManager<ApplicationRole>>();

                if (autoMigrate && db.Database.IsRelational())
                {
                    await db.Database.MigrateAsync();
                }

                if (enableSeed)
                {
                    await DbSeeder.SeedAsync(db, userManager, roleManager, logger);
                    await DbSeeder.SeedDevelopmentAdminAsync(db, userManager, roleManager, app.Configuration, app.Environment, logger);
                }
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error during startup database migration/seeding.");
            }
        }

        await app.RunAsync();
    }

    private static void RegisterFeatureServices(IServiceCollection services, IConfiguration configuration)
    {
        services.AddHttpContextAccessor();
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();

        // Auth
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IPasswordResetEmailSender, PasswordResetEmailSender>();
        services.AddScoped<IAuthService, AuthService>();

        // Admin & Users
        services.AddScoped<IAdminUserService, AdminUserService>();
        services.AddScoped<IAdminOperationsService, AdminOperationsService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // Content, QuestionBank, Exams, Learning
        services.AddScoped<IContentService, ContentService>();
        services.AddScoped<IQuestionBankService, QuestionBankService>();
        services.AddScoped<IExamService, ExamService>();
        services.AddScoped<ILearningService, LearningService>();

        // Teacher & Homework
        services.AddScoped<ITeacherClassService, TeacherClassService>();
        services.AddScoped<ITeacherAttendanceService, TeacherAttendanceService>();
        services.AddScoped<ITeacherAssignmentService, TeacherAssignmentService>();
        services.AddScoped<IStudentHomeworkService, StudentHomeworkService>();

        // Support
        services.AddScoped<ZhongWenHub.Api.Features.Support.Services.ISupportTicketService, ZhongWenHub.Api.Features.Support.Services.SupportTicketService>();

        // Video Storage
        services.Configure<VideoStorageOptions>(configuration.GetSection(VideoStorageOptions.SectionName));
        services.AddHttpClient<VideoStorageService>();
        services.AddScoped<IVideoStorageService, VideoStorageService>();
        services.AddScoped<IUploadAssetService, UploadAssetService>();
        services.AddScoped<IStorageCleanupService, StorageCleanupService>();
        services.AddScoped<ILearningVideoService, LearningVideoService>();
        services.AddHostedService<VideoStorageCleanupWorker>();

        // AI Services
        services.Configure<GeminiOptions>(configuration.GetSection(GeminiOptions.SectionName));
        services.AddHttpClient<GeminiProvider>();
        services.AddScoped<IAIProvider, ConfigurableAIProvider>();
        services.AddScoped<IAIUsageLogger, EfAIUsageLogger>();
        services.AddScoped<IAITutorContextVerifier, EfAITutorContextVerifier>();
        services.AddScoped<IAITutorService, AITutorService>();
        services.AddScoped<IAILetterWritingService, AILetterWritingService>();
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

        // Multi-Provider AI Management & Router
        services.AddSingleton<IAiProviderSecretProtector, DataProtectionAiProviderSecretProtector>();
        services.AddHttpClient<GeminiProviderAdapter>();
        services.AddHttpClient<OpenAiProviderAdapter>();
        services.AddHttpClient<OpenAiCompatibleProviderAdapter>();
        services.AddSingleton<IAiProviderAdapter, GeminiProviderAdapter>(sp => sp.GetRequiredService<GeminiProviderAdapter>());
        services.AddSingleton<IAiProviderAdapter, OpenAiProviderAdapter>(sp => sp.GetRequiredService<OpenAiProviderAdapter>());
        services.AddSingleton<IAiProviderAdapter, OpenAiCompatibleProviderAdapter>(sp => sp.GetRequiredService<OpenAiCompatibleProviderAdapter>());
        services.AddScoped<IMultiProviderAiRouter, MultiProviderAiRouter>();
        services.AddScoped<IAiProviderManagementService, AiProviderManagementService>();
    }
}
