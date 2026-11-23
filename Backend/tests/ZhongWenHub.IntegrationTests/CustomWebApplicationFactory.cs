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
using ZhongWenHub;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;
using Xunit;

[assembly: CollectionBehavior(DisableTestParallelization = true)]

namespace ZhongWenHub.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private static readonly object SeedLock = new();
    private static bool _isSeeded = false;

    public const string TestConnectionString =
        "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    public static string ResolveConnectionString() =>
        Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION_STRING") ?? TestConnectionString;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseEnvironment("Testing");

        var testConn = ResolveConnectionString();
        var builderCs = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(testConn);
        var dbName = builderCs.InitialCatalog;
        if (!string.Equals(dbName, "ZhongWenHub_Test", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(dbName, "ZhongWenHub_FreshTest", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException($"Safety Guard: Integration tests must connect to an approved test database (ZhongWenHub_Test or ZhongWenHub_FreshTest). Attempted: {dbName}");
        }

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
            // Remove existing ApplicationDbContext descriptors
            var descriptors = services.Where(d =>
                d.ServiceType == typeof(DbContextOptions<ApplicationDbContext>) ||
                d.ServiceType == typeof(ApplicationDbContext)).ToList();

            foreach (var d in descriptors)
            {
                services.Remove(d);
            }

            // Register SQL Server with test database
            services.AddDbContext<ApplicationDbContext>(options =>
            {
                options.UseSqlServer(testConn);
            });
        });
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        var host = base.CreateHost(builder);
        EnsureDatabaseSeeded(host);
        return host;
    }

    private void EnsureDatabaseSeeded(IHost host)
    {
        if (_isSeeded) return;

        lock (SeedLock)
        {
            if (_isSeeded) return;

            using var scope = host.Services.CreateScope();
            var sp = scope.ServiceProvider;
            var context = sp.GetRequiredService<ApplicationDbContext>();
            var userManager = sp.GetRequiredService<UserManager<ApplicationUser>>();
            var roleManager = sp.GetRequiredService<RoleManager<ApplicationRole>>();
            var logger = sp.GetRequiredService<ILogger<CustomWebApplicationFactory>>();

            if (context.Database.IsRelational())
            {
                context.Database.Migrate();
            }

            // Seed base roles and demo content
            DbInitializer.SeedAsync(context, userManager, roleManager, logger).GetAwaiter().GetResult();

            // Seed required test accounts
            var testUsers = new (string Email, string Password, string DisplayName, string Role)[]
            {
                ("admin@gmail.com", "admin", "Quản Trị Viên (Dev Admin)", RoleConstants.Admin),
                ("admin@zhongwenhub.edu.vn", "AdminPassword123!", "Quản Trị Viên Vận Hành", RoleConstants.Admin),
                ("superadmin@zhongwenhub.edu.vn", "SuperAdminPassword123!", "Hệ Thống Super Admin", RoleConstants.Admin),
                ("contentmanager@zhongwenhub.edu.vn", "ContentManager123!", "Nguyễn Văn Minh (Content Manager)", RoleConstants.ContentManager),
                ("demo@zhongwenhub.edu.vn", "DemoPassword123!", "Học Viên Trải Nghiệm", RoleConstants.Student),
                ("hocvien@gmail.com", "hocvien", "Học Viên", RoleConstants.Student),
                ("student@example.com", "ExamplePassword123!", "Học Viên Mẫu (Student Example)", RoleConstants.Student),
                ("student@zhongwenhub.edu.vn", "StudentPassword123!", "Nguyễn Học Viên Mới", RoleConstants.Student),
                ("support@zhongwenhub.edu.vn", "SupportPassword123!", "Trần Thuỳ Trang (Support)", RoleConstants.Support),
                ("teacher@zhongwenhub.edu.vn", "TeacherPassword123!", "Lý Mỹ Linh (Teacher)", RoleConstants.Teacher)
            };

            foreach (var testUser in testUsers)
            {
                var existing = userManager.FindByEmailAsync(testUser.Email).GetAwaiter().GetResult();
                if (existing == null)
                {
                    var user = new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
                        UserName = testUser.Email,
                        Email = testUser.Email,
                        EmailConfirmed = true,
                        DisplayName = testUser.DisplayName,
                        Status = UserStatus.ACTIVE,
                        CreatedAt = DateTime.UtcNow
                    };
                    user.PasswordHash = userManager.PasswordHasher.HashPassword(user, testUser.Password);
                    var createResult = userManager.CreateAsync(user).GetAwaiter().GetResult();
                    if (createResult.Succeeded)
                    {
                        userManager.AddToRoleAsync(user, testUser.Role).GetAwaiter().GetResult();

                        if (testUser.Role == RoleConstants.Student || testUser.Role == RoleConstants.Teacher)
                        {
                            var wallet = new UserWallet
                            {
                                Id = Guid.NewGuid(),
                                UserId = user.Id,
                                Balance = 500000m,
                                Currency = "VND",
                                CreatedAt = DateTime.UtcNow
                            };
                            context.UserWallets.Add(wallet);

                            context.UserSubscriptions.Add(new UserSubscription
                            {
                                Id = Guid.NewGuid(),
                                UserId = user.Id,
                                Plan = "Premium",
                                Status = "ACTIVE",
                                StartDate = DateTime.UtcNow,
                                EndDate = DateTime.UtcNow.AddMonths(12),
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
                else
                {
                    // Ensure password and role are consistent
                    existing.PasswordHash = userManager.PasswordHasher.HashPassword(existing, testUser.Password);
                    existing.EmailConfirmed = true;
                    existing.Status = UserStatus.ACTIVE;
                    userManager.UpdateAsync(existing).GetAwaiter().GetResult();

                    if (!userManager.IsInRoleAsync(existing, testUser.Role).GetAwaiter().GetResult())
                    {
                        userManager.AddToRoleAsync(existing, testUser.Role).GetAwaiter().GetResult();
                    }

                    if (testUser.Role == RoleConstants.Student || testUser.Role == RoleConstants.Teacher)
                    {
                        var wallet = context.UserWallets.FirstOrDefault(w => w.UserId == existing.Id);
                        if (wallet == null)
                        {
                            context.UserWallets.Add(new UserWallet
                            {
                                Id = Guid.NewGuid(),
                                UserId = existing.Id,
                                Balance = 500000m,
                                Currency = "VND",
                                CreatedAt = DateTime.UtcNow
                            });
                        }

                        var sub = context.UserSubscriptions.FirstOrDefault(s => s.UserId == existing.Id);
                        if (sub == null)
                        {
                            context.UserSubscriptions.Add(new UserSubscription
                            {
                                Id = Guid.NewGuid(),
                                UserId = existing.Id,
                                Plan = "Premium",
                                Status = "ACTIVE",
                                StartDate = DateTime.UtcNow,
                                EndDate = DateTime.UtcNow.AddMonths(12),
                                CreatedAt = DateTime.UtcNow
                            });
                        }
                    }
                }
            }

            context.SaveChanges();
            _isSeeded = true;
        }
    }

    public HttpClient CreateNoCookieClient()
    {
        return CreateClient(new WebApplicationFactoryClientOptions
        {
            HandleCookies = false
        });
    }
}
