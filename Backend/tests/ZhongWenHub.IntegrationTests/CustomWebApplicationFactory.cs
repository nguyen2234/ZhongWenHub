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
using ZhongWenHub.Data.Constants;
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

                var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
                var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
                var logger = scope.ServiceProvider.GetRequiredService<ILogger<CustomWebApplicationFactory>>();

                if (!db.Users.Any())
                {
                    DbInitializer.SeedAsync(db, userManager, roleManager, logger).GetAwaiter().GetResult();
                }

                EnsureIntegrationTestUsersSeeded(db, userManager, roleManager);
                EnsureContentIssueTablesExist(db);
            }
        });
    }

    private static void EnsureContentIssueTablesExist(ApplicationDbContext db)
    {
        try
        {
            db.Database.ExecuteSqlRaw(@"
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'content_issues')
BEGIN
    CREATE TABLE content_issues (
        Id uniqueidentifier NOT NULL PRIMARY KEY,
        IssueCode nvarchar(50) NOT NULL,
        Title nvarchar(300) NOT NULL,
        Description nvarchar(max) NOT NULL,
        IssueType nvarchar(50) NOT NULL,
        Priority nvarchar(30) NOT NULL,
        TargetContentId nvarchar(100) NOT NULL,
        TargetContentType nvarchar(50) NOT NULL,
        TargetContentTitle nvarchar(300) NOT NULL,
        TargetContentRoute nvarchar(500) NOT NULL,
        ReportedBy nvarchar(150) NOT NULL,
        SupportTicketId uniqueidentifier NULL,
        SupportStaffName nvarchar(150) NOT NULL,
        ContentManagerId uniqueidentifier NULL,
        ContentManagerName nvarchar(150) NULL,
        Status nvarchar(50) NOT NULL,
        ResolvedAt datetime2 NULL,
        ClosedAt datetime2 NULL,
        ResolutionNotes nvarchar(max) NULL,
        FeedbackToSupport nvarchar(max) NULL,
        CreatedAt datetime2 NOT NULL,
        UpdatedAt datetime2 NULL
    );
    CREATE UNIQUE INDEX IX_content_issues_IssueCode ON content_issues(IssueCode);
    CREATE INDEX IX_content_issues_Status ON content_issues(Status);
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'content_issue_activities')
BEGIN
    CREATE TABLE content_issue_activities (
        Id uniqueidentifier NOT NULL PRIMARY KEY,
        ContentIssueId uniqueidentifier NOT NULL,
        ActorName nvarchar(150) NOT NULL,
        ActorRole nvarchar(50) NOT NULL,
        Action nvarchar(500) NOT NULL,
        Message nvarchar(max) NULL,
        CreatedAt datetime2 NOT NULL,
        UpdatedAt datetime2 NULL,
        CONSTRAINT FK_content_issue_activities_content_issues FOREIGN KEY (ContentIssueId) REFERENCES content_issues(Id) ON DELETE CASCADE
    );
    CREATE INDEX IX_content_issue_activities_ContentIssueId ON content_issue_activities(ContentIssueId);
END;
");
        }
        catch { }
    }

    private static void EnsureIntegrationTestUsersSeeded(
        ApplicationDbContext db,
        UserManager<ApplicationUser> userManager,
        RoleManager<ApplicationRole> roleManager)
    {
        var testUsers = new[]
        {
            (Email: "admin@gmail.com", UserName: "admin@gmail.com", Role: RoleConstants.Admin, DisplayName: "Quản Trị Viên (Dev Admin)", Password: "admin"),
            (Email: "student@zhongwenhub.edu.vn", UserName: "student", Role: RoleConstants.Student, DisplayName: "Nguyễn Học Viên Mới", Password: "StudentPassword123!"),
            (Email: "teacher@zhongwenhub.edu.vn", UserName: "teacher", Role: RoleConstants.Teacher, DisplayName: "Lý Mỹ Linh (Teacher)", Password: "TeacherPassword123!"),
            (Email: "contentmanager@zhongwenhub.edu.vn", UserName: "contentmanager", Role: RoleConstants.ContentManager, DisplayName: "Nguyễn Văn Minh (Content Manager)", Password: "ContentManager123!"),
            (Email: "support@zhongwenhub.edu.vn", UserName: "support", Role: RoleConstants.Support, DisplayName: "Trần Thuỳ Trang (Support)", Password: "SupportPassword123!"),
            (Email: "student@example.com", UserName: "student_example", Role: RoleConstants.Student, DisplayName: "Học Viên Mẫu (Student Example)", Password: "Password123!")
        };

        foreach (var def in testUsers)
        {
            var existingUser = userManager.FindByEmailAsync(def.Email).GetAwaiter().GetResult();
            if (existingUser == null)
            {
                var user = new ApplicationUser
                {
                    Id = Guid.NewGuid(),
                    UserName = def.UserName,
                    Email = def.Email,
                    EmailConfirmed = true,
                    DisplayName = def.DisplayName,
                    Status = UserStatus.ACTIVE,
                    CreatedAt = DateTime.UtcNow
                };

                user.PasswordHash = userManager.PasswordHasher.HashPassword(user, def.Password);
                var createRes = userManager.CreateAsync(user).GetAwaiter().GetResult();
                if (createRes.Succeeded)
                {
                    if (!roleManager.RoleExistsAsync(def.Role).GetAwaiter().GetResult())
                    {
                        roleManager.CreateAsync(new ApplicationRole(def.Role, def.Role)).GetAwaiter().GetResult();
                    }
                    userManager.AddToRoleAsync(user, def.Role).GetAwaiter().GetResult();

                    if (def.Role == RoleConstants.Student)
                    {
                        db.UserWallets.Add(new UserWallet
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Balance = 150000m,
                            Currency = "VND",
                            CreatedAt = user.CreatedAt
                        });
                        db.UserSubscriptions.Add(new UserSubscription
                        {
                            Id = Guid.NewGuid(),
                            UserId = user.Id,
                            Plan = "Basic",
                            Status = "ACTIVE",
                            StartDate = user.CreatedAt,
                            EndDate = user.CreatedAt.AddMonths(3),
                            CreatedAt = user.CreatedAt
                        });
                        db.SaveChanges();
                    }
                }
            }
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
