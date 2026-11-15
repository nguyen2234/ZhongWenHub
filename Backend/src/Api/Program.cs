using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.OpenApi.Models;
using ZhongWenHub.Api.Middleware;
using ZhongWenHub.Business;
using ZhongWenHub.Business.Common.DTOs;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add Data (SQL Server DbContext, Identity) and Business Services (JWT, Policies, Services)
builder.Services.AddData(builder.Configuration);
builder.Services.AddBusiness(builder.Configuration);

// Add Controllers & JSON Serialization Configuration
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
    });

// Configure Lowercase URLs for consistent REST API routing and documentation
builder.Services.Configure<RouteOptions>(options =>
{
    options.LowercaseUrls = true;
});

// Configure CORS
var corsOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? new[] { "http://localhost:5173", "http://localhost:3000" };

builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultCorsPolicy", policy =>
    {
        policy.WithOrigins(corsOrigins)
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure Rate Limiting for Login & Sensitive Endpoints
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    var loginPermitLimit = builder.Configuration.GetValue<int?>("RateLimiting:LoginPermitLimit")
        ?? (builder.Environment.IsDevelopment() ? 60 : 20);

    var aiTutorPermitLimit = builder.Configuration.GetValue<int?>("Gemini:RateLimitPermitPerMinute")
        ?? (builder.Environment.IsDevelopment() ? 30 : 20);

    options.AddPolicy("LoginRateLimit", httpContext =>
    {
        var clientIp = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: clientIp,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = loginPermitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.AddPolicy("AITutorRateLimit", httpContext =>
    {
        var userId = httpContext.User?.FindFirst("sub")?.Value
            ?? httpContext.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var partitionKey = !string.IsNullOrWhiteSpace(userId)
            ? $"user:{userId}"
            : $"ip:{httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown"}";

        return RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: partitionKey,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = aiTutorPermitLimit,
                Window = TimeSpan.FromMinutes(1),
                QueueProcessingOrder = QueueProcessingOrder.OldestFirst,
                QueueLimit = 0
            });
    });

    options.OnRejected = async (context, token) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        context.HttpContext.Response.ContentType = "application/problem+json";
        var isAiTutor = context.HttpContext.Request.Path.StartsWithSegments("/api/v1/ai-tutor");
        var problem = new ApiProblemDetailsDto
        {
            Type = "https://httpstatuses.com/429",
            Title = "Quá nhiều yêu cầu",
            Status = StatusCodes.Status429TooManyRequests,
            Detail = isAiTutor
                ? "Bạn đang gửi quá nhiều câu hỏi tới Trợ giảng AI. Vui lòng đợi ít phút rồi thử lại."
                : "Bạn đã thực hiện quá nhiều yêu cầu đăng nhập từ địa chỉ IP này. Vui lòng thử lại sau ít phút.",
            Instance = context.HttpContext.Request.Path,
            TraceId = context.HttpContext.TraceIdentifier
        };
        await context.HttpContext.Response.WriteAsync(
            JsonSerializer.Serialize(problem, new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase }),
            token);
    };
});

// Configure Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("Database");

// Configure Swagger / OpenAPI with JWT Support & XML Documentation
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
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

    // Configure HTTP Bearer JWT Authentication in OpenAPI 3.0 standard
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Nhập JWT access token vào đây. Swagger UI sẽ tự động đính kèm header 'Authorization: Bearer {token}'."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });

    // Group endpoints by Controller name for clear structured navigation
    c.TagActionsBy(api =>
    {
        if (api.GroupName != null)
        {
            return new[] { api.GroupName };
        }

        if (api.ActionDescriptor is Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor controllerDesc)
        {
            return new[] { controllerDesc.ControllerName };
        }

        return new[] { "General" };
    });
    c.DocInclusionPredicate((_, _) => true);

    // Include XML comments from API and Business projects if available
    var apiXmlPath = Path.Combine(AppContext.BaseDirectory, $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml");
    if (File.Exists(apiXmlPath))
    {
        c.IncludeXmlComments(apiXmlPath);
    }

    var businessXmlPath = Path.Combine(AppContext.BaseDirectory, "ZhongWenHub.Business.xml");
    if (File.Exists(businessXmlPath))
    {
        c.IncludeXmlComments(businessXmlPath);
    }
});

var app = builder.Build();

var geminiOptionsSnapshot = app.Services.GetRequiredService<Microsoft.Extensions.Options.IOptions<ZhongWenHub.Business.AITutor.GeminiOptions>>().Value;
var geminiKeyConfigured = !string.IsNullOrWhiteSpace(app.Configuration["Gemini:ApiKey"])
    || !string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("GEMINI_API_KEY"));
var geminiOptionsKeyConfigured = !string.IsNullOrWhiteSpace(geminiOptionsSnapshot.ApiKey);
app.Logger.LogInformation(
    "AI Tutor Startup Diagnostic | EnvironmentName={EnvironmentName} | GeminiKeyConfigured={GeminiKeyConfigured} | GeminiOptionsKeyConfigured={GeminiOptionsKeyConfigured} | GeminiModel={GeminiModel}",
    app.Environment.EnvironmentName,
    geminiKeyConfigured,
    geminiOptionsKeyConfigured,
    geminiOptionsSnapshot.Model);

// Seed Database and apply pending migrations on startup (guarded to protect Dev database)
var autoMigrate = app.Configuration.GetValue<bool>("Database:AutoMigrate", false);
var enableSeed = app.Configuration.GetValue<bool>("Database:EnableSeed", false);

if (!app.Environment.IsEnvironment("Testing") && (autoMigrate || enableSeed))
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        if (autoMigrate && dbContext.Database.IsRelational())
        {
            await dbContext.Database.MigrateAsync();
        }

        if (enableSeed)
        {
            await DbInitializer.SeedAsync(dbContext, userManager, roleManager, logger);

            if (app.Environment.IsDevelopment())
            {
                await DbInitializer.SeedDevelopmentAdminAsync(dbContext, userManager, roleManager, app.Configuration, app.Environment, logger);
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogWarning(ex, "Không thể kết nối hoặc khởi tạo cơ sở dữ liệu khi khởi động: {Message}", ex.Message);
    }
}

// Global Exception & Security Middlewares
app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseMiddleware<ProblemDetailsMiddleware>();

// Custom handling for 401 & 403 Problem Details
app.Use(async (context, next) =>
{
    await next();

    if (context.Response.StatusCode == StatusCodes.Status401Unauthorized && !context.Response.HasStarted)
    {
        context.Response.ContentType = "application/problem+json";
        var problem = new ApiProblemDetailsDto
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
        var problem = new ApiProblemDetailsDto
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
app.UseCors("DefaultCorsPolicy");
app.UseRateLimiter();

app.UseAuthentication();
app.UseAuthorization();

// Root & System Health Check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/api/v1/system/health");

app.MapControllers();

app.Run();

// For Integration Test WebApplicationFactory fixture
public partial class Program { }
