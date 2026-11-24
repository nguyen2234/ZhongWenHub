using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Tools.OpenApiBaselineGenerator;

public class Program
{
    private static readonly string TestConnectionString =
        Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION_STRING")
        ?? "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private sealed class GeneratorSwaggerAppFactory : WebApplicationFactory<ZhongWenHub.Program>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.UseEnvironment("Development");
            var contentRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "src", "ZhongWenHub.Api"));
            if (!Directory.Exists(contentRoot))
            {
                contentRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..", "src", "ZhongWenHub.Api"));
            }
            if (Directory.Exists(contentRoot))
            {
                builder.UseContentRoot(contentRoot);
            }
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

    public static async Task<int> Main(string[] args)
    {
        Console.WriteLine("==> Initializing Generator WebApplicationFactory in Development mode...");
        using var factory = new GeneratorSwaggerAppFactory();
        var client = factory.CreateClient();

        var response = await client.GetAsync("/swagger/v1/swagger.json");
        if (response.StatusCode != HttpStatusCode.OK)
        {
            Console.Error.WriteLine($"Failed to retrieve /swagger/v1/swagger.json, status code: {response.StatusCode}");
            return 1;
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);
        var root = doc.RootElement;
        var paths = root.GetProperty("paths");

        var routeList = new List<string>();
        var totalOperations = 0;

        foreach (var path in paths.EnumerateObject())
        {
            var pathKey = path.Name;
            foreach (var method in path.Value.EnumerateObject())
            {
                var httpMethod = method.Name.ToUpperInvariant();
                var op = method.Value;
                var opId = op.TryGetProperty("operationId", out var oid) ? oid.GetString() : "";
                var tag = "Unknown";
                if (op.TryGetProperty("tags", out var tags) && tags.ValueKind == JsonValueKind.Array && tags.GetArrayLength() > 0)
                {
                    tag = tags[0].GetString() ?? "Unknown";
                }
                var summary = op.TryGetProperty("summary", out var sm) ? sm.GetString() : "";
                routeList.Add($"{httpMethod,-7} {pathKey,-60} [{tag}] ({opId}) {summary}".Trim());
                totalOperations++;
            }
        }
        routeList.Sort();

        var currentDir = AppContext.BaseDirectory;
        var docsDir = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", "..", "docs"));
        if (!Directory.Exists(docsDir))
        {
            docsDir = Path.GetFullPath(Path.Combine(currentDir, "..", "..", "..", "..", "..", "docs"));
        }
        if (!Directory.Exists(docsDir))
        {
            Directory.CreateDirectory(docsDir);
        }

        var jsonPath = Path.Combine(docsDir, "RUNTIME_OPENAPI_ROUTES_BASELINE.json");
        var txtPath = Path.Combine(docsDir, "RUNTIME_OPENAPI_ROUTES_BASELINE.txt");

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

        Console.WriteLine($"==> Successfully generated baseline for {totalOperations} operations into {docsDir}");
        return 0;
    }
}
