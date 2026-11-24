using System;
using System.IO;
using System.Net;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Xunit;
using ZhongWenHub;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.IntegrationTests;

[Trait("Category", "BaselineGenerator")]
public class OpenApiBaselineGenerator
{
    private static readonly string TestConnectionString =
        Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION_STRING")
        ?? "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private sealed class GeneratorSwaggerAppFactory : WebApplicationFactory<Program>
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
                var descriptors = services.Where(d =>
                    d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                    d.ServiceType == typeof(ApplicationDbContext)).ToList();
                foreach (var descriptor in descriptors)
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
    [Trait("Category", "BaselineGenerator")]
    public async Task GenerateOpenApiBaseline()
    {
        using var factory = new GeneratorSwaggerAppFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/swagger/v1/swagger.json");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        var paths = root.GetProperty("paths");

        var routeList = new List<string>();
        var totalOperations = 0;

        foreach (var pathProp in paths.EnumerateObject())
        {
            var pathKey = pathProp.Name;
            foreach (var methodProp in pathProp.Value.EnumerateObject())
            {
                var httpMethod = methodProp.Name.ToUpperInvariant();
                totalOperations++;
                var op = methodProp.Value;
                var opId = op.TryGetProperty("operationId", out var idProp) ? idProp.GetString() : "";
                var tag = "Default";
                if (op.TryGetProperty("tags", out var tags) && tags.ValueKind == JsonValueKind.Array && tags.GetArrayLength() > 0)
                {
                    tag = tags[0].GetString() ?? "Unknown";
                }
                var summary = op.TryGetProperty("summary", out var sm) ? sm.GetString() : "";
                routeList.Add($"{httpMethod,-7} {pathKey,-60} [{tag}] ({opId}) {summary}".Trim());
            }
        }
        routeList.Sort();

        var docsDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "docs"));
        if (!Directory.Exists(docsDir))
        {
            docsDir = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "docs"));
        }
        var txtPath = Path.Combine(docsDir, "RUNTIME_OPENAPI_ROUTES_BASELINE.txt");
        var jsonPath = Path.Combine(docsDir, "RUNTIME_OPENAPI_ROUTES_BASELINE.json");

        Assert.True(Directory.Exists(docsDir), $"Docs directory not found at {docsDir}");

        await File.WriteAllTextAsync(jsonPath, json);

        using (var writer = new StreamWriter(txtPath, false, System.Text.Encoding.UTF8))
        {
            writer.WriteLine("ZhongWenHub Runtime OpenAPI Route Baseline (P0)");
            writer.WriteLine($"Total Operations: {totalOperations}");
            writer.WriteLine($"Captured At: {DateTime.UtcNow:O}");
            writer.WriteLine();
            foreach (var line in routeList)
            {
                writer.WriteLine(line);
            }
        }

        Assert.True(File.Exists(txtPath));
        Assert.True(File.Exists(jsonPath));
    }
}
