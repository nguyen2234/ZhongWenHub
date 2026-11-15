using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.IntegrationTests;

public class SwaggerIntegrationTests
{
    private const string TestConnectionString =
        "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private sealed class DevelopmentSwaggerAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            builder.UseSetting("JwtSettings:Secret", "ZhongWenHub_IntegrationTest_Super_Secret_Key_32_Bytes_Long_2026!");
            builder.UseSetting("ConnectionStrings:DefaultConnection", TestConnectionString);
            builder.UseSetting("Database:AutoMigrate", "false");
            builder.UseSetting("Database:EnableSeed", "false");

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseSqlServer(TestConnectionString);
                });
            });
        }
    }

    private sealed class ProductionSwaggerAppFactory : WebApplicationFactory<Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Production");
            builder.UseSetting("JwtSettings:Secret", "ZhongWenHub_IntegrationTest_Super_Secret_Key_32_Bytes_Long_2026!");
            builder.UseSetting("ConnectionStrings:DefaultConnection", TestConnectionString);
            builder.UseSetting("Database:AutoMigrate", "false");
            builder.UseSetting("Database:EnableSeed", "false");

            builder.ConfigureServices(services =>
            {
                var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
                if (descriptor != null)
                {
                    services.Remove(descriptor);
                }

                services.AddDbContext<ApplicationDbContext>(options =>
                {
                    options.UseSqlServer(TestConnectionString);
                });
            });
        }
    }

    [Fact]
    public async Task SwaggerJson_IsAccessibleInDevelopment_AndContainsExpectedEndpointsAndJwtScheme()
    {
        using var factory = new DevelopmentSwaggerAppFactory();
        var client = factory.CreateClient();

        // 1. Fetch /swagger/v1/swagger.json
        var response = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var jsonString = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(jsonString);
        var root = doc.RootElement;

        // Verify OpenAPI version and Info
        Assert.True(root.TryGetProperty("openapi", out var openapiVer));
        Assert.StartsWith("3.", openapiVer.GetString());

        var info = root.GetProperty("info");
        Assert.Equal("ZhongWenHub API", info.GetProperty("title").GetString());
        Assert.Equal("v1", info.GetProperty("version").GetString());
        Assert.Contains("JWT Authorize", info.GetProperty("description").GetString());

        // Verify Security Scheme (HTTP Bearer JWT)
        var components = root.GetProperty("components");
        Assert.True(components.TryGetProperty("securitySchemes", out var securitySchemes));
        Assert.True(securitySchemes.TryGetProperty("Bearer", out var bearerScheme));
        Assert.Equal("http", bearerScheme.GetProperty("type").GetString());
        Assert.Equal("bearer", bearerScheme.GetProperty("scheme").GetString());
        Assert.Equal("JWT", bearerScheme.GetProperty("bearerFormat").GetString());

        // Verify Core Controllers/Endpoints are documented
        var paths = root.GetProperty("paths");

        // Auth endpoints
        Assert.True(paths.TryGetProperty("/api/v1/auth/login", out _));
        Assert.True(paths.TryGetProperty("/api/v1/auth/register", out _));
        Assert.True(paths.TryGetProperty("/api/v1/auth/me", out _));

        // Content (Courses, Units, Lessons, Vocabularies)
        Assert.True(paths.TryGetProperty("/api/v1/content/courses", out _));
        Assert.True(paths.TryGetProperty("/api/v1/content/lessons", out _));
        Assert.True(paths.TryGetProperty("/api/v1/content/vocabularies", out _));

        // Admin Users
        Assert.True(paths.TryGetProperty("/api/v1/admin/users", out _));

        // Learning & Progress
        Assert.True(paths.TryGetProperty("/api/v1/learning/me/hsk-progress", out _));
        Assert.True(paths.TryGetProperty("/api/v1/learning/me/lessons", out _));

        // AI Learning & AI Tutor
        Assert.True(paths.TryGetProperty("/api/v1/ai/exercises/adaptive/session", out _));
        Assert.True(paths.TryGetProperty("/api/v1/ai/error-analysis/explain", out _));
        Assert.True(paths.TryGetProperty("/api/v1/ai-tutor/chat", out _));
    }

    [Fact]
    public async Task SwaggerUI_IsAccessibleInDevelopment_AndLoadsHtml()
    {
        using var factory = new DevelopmentSwaggerAppFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/swagger/index.html");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var html = await response.Content.ReadAsStringAsync();
        Assert.Contains("swagger-ui", html);
        Assert.Contains("ZhongWenHub API - Swagger UI", html);
    }

    [Fact]
    public async Task Swagger_IsNotExposedInProduction_ReturnsNotFound()
    {
        using var factory = new ProductionSwaggerAppFactory();
        var client = factory.CreateClient();

        var jsonResponse = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.NotFound, jsonResponse.StatusCode);

        var uiResponse = await client.GetAsync("/swagger/index.html");
        Assert.Equal(HttpStatusCode.NotFound, uiResponse.StatusCode);
    }
}

