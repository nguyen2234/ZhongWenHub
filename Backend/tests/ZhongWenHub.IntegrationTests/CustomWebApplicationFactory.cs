using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace ZhongWenHub.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public static string GetTestConnectionString()
    {
        var envConn = Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
            ?? Environment.GetEnvironmentVariable("TEST_CONNECTION_STRING")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__TestConnection");

        var conn = !string.IsNullOrWhiteSpace(envConn)
            ? envConn
            : "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

        // ZERO-WRITE SAFETY GUARD: Never allow tests to point to ZhongWenHub_Dev
        if (conn.IndexOf("ZhongWenHub_Dev", StringComparison.OrdinalIgnoreCase) >= 0)
        {
            throw new InvalidOperationException("FATAL PREFLIGHT ERROR: Test connection string must NEVER target ZhongWenHub_Dev! Only ZhongWenHub_Test is permitted.");
        }

        if (conn.IndexOf("ZhongWenHub_Test", StringComparison.OrdinalIgnoreCase) < 0)
        {
            throw new InvalidOperationException($"FATAL PREFLIGHT ERROR: Target database must be 'ZhongWenHub_Test'. Received: {conn}");
        }

        return conn;
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        var conn = GetTestConnectionString();

        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = conn,
                ["JwtSettings:Secret"] = "ZhongWenHub_IntegrationTest_Super_Secret_Key_32_Bytes_Long_2026!",
                ["RateLimiting:LoginPermitLimit"] = "1000",
                ["AiSecurity:EncryptionKey"] = "ZhongWenHub_IntegrationTest_Ai_Key_32_Bytes_Long_2026!"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing ApplicationDbContext descriptor
            var dbContextDescriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>));
            if (dbContextDescriptor != null)
            {
                services.Remove(dbContextDescriptor);
            }

            // Register SQL Server with verified test database
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseSqlServer(conn);
                options.ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.RelationalEventId.PendingModelChangesWarning));
            });

            // Ensure database is migrated and baseline seed data exists (crucial for CI container runners)
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
            if (db.Database.IsRelational())
            {
                db.Database.Migrate();

                if (!db.Users.Any())
                {
                    var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                    var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
                    var logger = scope.ServiceProvider.GetRequiredService<ILogger<CustomWebApplicationFactory>>();
                    var hostEnv = scope.ServiceProvider.GetRequiredService<Microsoft.AspNetCore.Hosting.IWebHostEnvironment>();
                    var configuration = scope.ServiceProvider.GetRequiredService<IConfiguration>();

                    DbInitializer.SeedAsync(db, userManager, roleManager, logger).GetAwaiter().GetResult();
                    DbInitializer.SeedDevelopmentAdminAsync(db, userManager, roleManager, configuration, hostEnv, logger).GetAwaiter().GetResult();
                }
            }
        });
    }

    public HttpClient CreateNoCookieClient()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });
    }
}
