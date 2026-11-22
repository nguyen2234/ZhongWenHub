using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ZhongWenHub;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Persistence;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace ZhongWenHub.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    public const string TestConnectionString =
        "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    public static string ResolveConnectionString() =>
        Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION_STRING") ?? TestConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        var testConn = ResolveConnectionString();

        builder.ConfigureAppConfiguration((context, config) =>
        {
            config.AddInMemoryCollection(new Dictionary<string, string?>
            {
                ["ConnectionStrings:DefaultConnection"] = testConn,
                ["JwtSettings:Secret"] = "ZhongWenHub_IntegrationTest_Super_Secret_Key_32_Bytes_Long_2026!",
                ["RateLimiting:LoginPermitLimit"] = "1000",
                ["Database:AutoMigrate"] = "false",
                ["Database:EnableSeed"] = "false"
            });
        });

        builder.ConfigureServices(services =>
        {
            // Remove existing AppDbContext and ApplicationDbContext descriptors
            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<AppDbContext>) ||
                d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                d.ServiceType == typeof(AppDbContext) ||
                d.ServiceType == typeof(ApplicationDbContext)).ToList();

            foreach (var d in descriptors)
            {
                services.Remove(d);
            }

            // Register SQL Server with test database
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseSqlServer(testConn);
            });

            services.AddScoped<ApplicationDbContext>(sp =>
            {
                var options = sp.GetRequiredService<DbContextOptions<AppDbContext>>();
                return new ApplicationDbContext(options);
            });
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
