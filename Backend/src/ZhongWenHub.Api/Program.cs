using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Identity;
using Microsoft.OpenApi.Models;
using ZhongWenHub.Api.Middleware;
using ZhongWenHub.Application.DTOs.Common;
using ZhongWenHub.Infrastructure.DependencyInjection;
using ZhongWenHub.Infrastructure.Identity;
using ZhongWenHub.Infrastructure.Persistence;

var builder = WebApplication.CreateBuilder(args);

// Add Infrastructure Services (PostgreSQL DbContext, Identity, JWT, Policies, Services)
builder.Services.AddInfrastructure(builder.Configuration);

// Add Controllers & JSON Serialization Configuration
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
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

// Configure Health Checks
builder.Services.AddHealthChecks()
    .AddDbContextCheck<ApplicationDbContext>("Database");

// Configure Swagger / OpenAPI with JWT Support
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ZhongWenHub API",
        Version = "v1",
        Description = "ASP.NET Core Web API cho Nền tảng Học tiếng Trung ZhongWenHub (BE-1 Foundation)",
        Contact = new OpenApiContact
        {
            Name = "ZhongWenHub Architecture Team",
            Email = "support@zhongwenhub.edu.vn"
        }
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "Nhập JWT Bearer token theo định dạng: Bearer {token}",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
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
});

var app = builder.Build();

// Seed Database and apply pending migrations on startup
if (!app.Environment.IsEnvironment("Testing"))
{
    using var scope = app.Services.CreateScope();
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var dbContext = services.GetRequiredService<ApplicationDbContext>();
        var userManager = services.GetRequiredService<UserManager<ApplicationUser>>();
        var roleManager = services.GetRequiredService<RoleManager<ApplicationRole>>();

        await DbInitializer.SeedAsync(dbContext, userManager, roleManager, logger);
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
    });
}

app.UseRouting();
app.UseCors("DefaultCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

// Root & System Health Check endpoints
app.MapHealthChecks("/health");
app.MapHealthChecks("/api/v1/system/health");

app.MapControllers();

app.Run();

// For Integration Test WebApplicationFactory fixture
public partial class Program { }
