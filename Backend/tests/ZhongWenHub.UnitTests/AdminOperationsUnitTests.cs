using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.Admin;
using ZhongWenHub.Business.Admin.DTOs;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class AdminOperationsUnitTests
{
    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    private static UserManager<ApplicationUser> CreateTestUserManager(ApplicationDbContext db)
    {
        var store = new UserStore<ApplicationUser, ApplicationRole, ApplicationDbContext, Guid>(db);
        return new UserManager<ApplicationUser>(
            store, null!, new PasswordHasher<ApplicationUser>(),
            null!, null!, null!, null!, null!, null!);
    }

    [Fact]
    public async Task GetAIOperationsStatsAsync_WithLogs_ReturnsCorrectAggregation()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        // Seed real AI usage logs and one mock log (which must be excluded)
        db.AiUsageLogs.AddRange(
            new AiUsageLog
            {
                Id = Guid.NewGuid(),
                Feature = "AI_TUTOR",
                Provider = "Gemini",
                LatencyMs = 200,
                TotalTokens = 150,
                Success = true,
                IsMock = false,
                CreatedAt = DateTime.UtcNow
            },
            new AiUsageLog
            {
                Id = Guid.NewGuid(),
                Feature = "AI_SPEAKING",
                Provider = "Whisper",
                LatencyMs = 300,
                TotalTokens = 250,
                Success = true,
                IsMock = false,
                CreatedAt = DateTime.UtcNow
            },
            new AiUsageLog
            {
                Id = Guid.NewGuid(),
                Feature = "AI_MOCK_FEATURE",
                Provider = "Mock",
                LatencyMs = 50,
                TotalTokens = 10,
                Success = false,
                IsMock = true,
                CreatedAt = DateTime.UtcNow
            }
        );
        await db.SaveChangesAsync();

        var stats = await service.GetAIOperationsStatsAsync();

        Assert.NotNull(stats);
        Assert.Equal(2, stats.TotalRequests);
        Assert.Equal(250, stats.AverageLatencyMs);
        Assert.Equal(100.0, stats.SuccessRate);
        Assert.Equal(400, stats.TotalTokens);
        Assert.Equal(4, stats.Services.Count);

        // Verify that live services with recent real logs resolve to ONLINE
        var tutorService = stats.Services.First(s => s.Id == "ai-tutor");
        Assert.Equal("ONLINE", tutorService.Status);
        Assert.Equal(100.0, tutorService.SuccessRate);
        Assert.Null(tutorService.Uptime); // Not conflated with success rate
    }

    [Fact]
    public async Task GetAnalyticsReportAsync_CalculatesHskAndSkillMetrics()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        // Seed student role
        var studentRole = new ApplicationRole
        {
            Id = Guid.NewGuid(),
            Name = RoleConstants.Student,
            NormalizedName = RoleConstants.Student.ToUpperInvariant()
        };
        db.Roles.Add(studentRole);

        // Seed users
        var user1 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "learner1@test.com",
            Email = "learner1@test.com",
            Status = UserStatus.ACTIVE,
            CurrentHskLevel = "HSK 2",
            LastLoginAt = DateTime.UtcNow
        };
        var user2 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "learner2@test.com",
            Email = "learner2@test.com",
            Status = UserStatus.ACTIVE,
            CurrentHskLevel = "HSK 3",
            LastLoginAt = DateTime.UtcNow
        };
        await userManager.CreateAsync(user1);
        await userManager.CreateAsync(user2);

        db.UserRoles.Add(new IdentityUserRole<Guid> { RoleId = studentRole.Id, UserId = user1.Id });
        db.UserRoles.Add(new IdentityUserRole<Guid> { RoleId = studentRole.Id, UserId = user2.Id });

        // Seed practice attempts in period (replaces cumulative stats)
        db.StudentPracticeAttempts.Add(new StudentPracticeAttempt
        {
            Id = Guid.NewGuid(),
            UserId = user1.Id,
            Category = "vocabulary",
            IsCorrect = true,
            AttemptedAt = DateTime.UtcNow
        });

        // Seed daily activity minutes
        db.StudentDailyActivities.Add(new StudentDailyActivity
        {
            Id = Guid.NewGuid(),
            UserId = user1.Id,
            ActivityDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Minutes = 120
        });

        await db.SaveChangesAsync();

        var report = await service.GetAnalyticsReportAsync("30d");

        Assert.NotNull(report);
        Assert.Equal(2, report.ActiveStudents);
        Assert.Equal(2, report.LearningHours); // 120 minutes = 2 hours
        Assert.Equal(6, report.HskDistribution.Count);
        Assert.Contains(report.HskDistribution, h => h.Level == "HSK 2" && h.Count == 1 && h.Percentage == 50.0);
        Assert.Contains(report.HskDistribution, h => h.Level == "HSK 3" && h.Count == 1 && h.Percentage == 50.0);
        Assert.Equal(5, report.SkillMetrics.Count);
    }

    [Fact]
    public async Task GetAndUpdateSystemSettingsAsync_PersistsSuccessfully()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        var initial = await service.GetSystemSettingsAsync();
        Assert.NotNull(initial);
        Assert.False(string.IsNullOrEmpty(initial.PlatformName));

        var updateDto = new AdminSystemSettingsDto
        {
            PlatformName = "ZhongWenHub Production Test",
            ContactEmail = "contact@zhongwenhub.edu.vn",
            MaxLoginAttempts = 5,
            SessionTimeoutMinutes = 60,
            Require2FA = false,
            IsMaintenanceMode = false
        };

        var updated = await service.UpdateSystemSettingsAsync(updateDto);
        Assert.Equal("ZhongWenHub Production Test", updated.PlatformName);
        Assert.Equal("contact@zhongwenhub.edu.vn", updated.ContactEmail);
        Assert.Equal(5, updated.MaxLoginAttempts);
        Assert.False(updated.Require2FA);

        // Read again to verify persistence
        var fetched = await service.GetSystemSettingsAsync();
        Assert.Equal("ZhongWenHub Production Test", fetched.PlatformName);
        Assert.Equal(5, fetched.MaxLoginAttempts);
        Assert.False(fetched.Require2FA);
    }

    [Fact]
    public async Task UpdateSystemSettingsAsync_UnsupportedPolicies_ThrowsInvalidOperationException()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        // 2FA unsupported
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateSystemSettingsAsync(new AdminSystemSettingsDto { Require2FA = true }));

        // Maintenance Mode unsupported from web
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateSystemSettingsAsync(new AdminSystemSettingsDto { IsMaintenanceMode = true }));

        // Non-standard MaxLoginAttempts
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateSystemSettingsAsync(new AdminSystemSettingsDto { MaxLoginAttempts = 3 }));

        // Non-standard SessionTimeoutMinutes
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.UpdateSystemSettingsAsync(new AdminSystemSettingsDto { SessionTimeoutMinutes = 30 }));
    }

    [Fact]
    public async Task GetAnalyticsReportAsync_ExcludesTeachersAndAdminsFromMetrics()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        var studentRole = new ApplicationRole { Id = Guid.NewGuid(), Name = RoleConstants.Student, NormalizedName = RoleConstants.Student };
        var teacherRole = new ApplicationRole { Id = Guid.NewGuid(), Name = RoleConstants.Teacher, NormalizedName = RoleConstants.Teacher };
        var adminRole = new ApplicationRole { Id = Guid.NewGuid(), Name = RoleConstants.Admin, NormalizedName = RoleConstants.Admin };
        db.Roles.AddRange(studentRole, teacherRole, adminRole);

        var student = new ApplicationUser { Id = Guid.NewGuid(), UserName = "s@test.com", Email = "s@test.com", Status = UserStatus.ACTIVE, LastLoginAt = DateTime.UtcNow };
        var teacher = new ApplicationUser { Id = Guid.NewGuid(), UserName = "t@test.com", Email = "t@test.com", Status = UserStatus.ACTIVE, LastLoginAt = DateTime.UtcNow };
        var admin = new ApplicationUser { Id = Guid.NewGuid(), UserName = "a@test.com", Email = "a@test.com", Status = UserStatus.ACTIVE, LastLoginAt = DateTime.UtcNow };
        await userManager.CreateAsync(student);
        await userManager.CreateAsync(teacher);
        await userManager.CreateAsync(admin);

        db.UserRoles.AddRange(
            new IdentityUserRole<Guid> { RoleId = studentRole.Id, UserId = student.Id },
            new IdentityUserRole<Guid> { RoleId = teacherRole.Id, UserId = teacher.Id },
            new IdentityUserRole<Guid> { RoleId = adminRole.Id, UserId = admin.Id }
        );

        // Student learning time: 60 mins
        db.StudentDailyActivities.Add(new StudentDailyActivity
        {
            Id = Guid.NewGuid(),
            UserId = student.Id,
            ActivityDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Minutes = 60
        });

        // Teacher time: 180 mins (must be excluded!)
        db.StudentDailyActivities.Add(new StudentDailyActivity
        {
            Id = Guid.NewGuid(),
            UserId = teacher.Id,
            ActivityDate = DateTime.UtcNow.ToString("yyyy-MM-dd"),
            Minutes = 180
        });

        await db.SaveChangesAsync();

        var report = await service.GetAnalyticsReportAsync("30d");

        Assert.NotNull(report);
        Assert.Equal(1, report.ActiveStudents); // Only student counted
        Assert.Equal(1, report.LearningHours); // 60 mins = 1 hour, teacher's 180 mins excluded
    }

    [Fact]
    public async Task GetAnalyticsReportAsync_FiltersEventsByPeriodBoundary()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        var studentRole = new ApplicationRole { Id = Guid.NewGuid(), Name = RoleConstants.Student, NormalizedName = RoleConstants.Student };
        db.Roles.Add(studentRole);

        var student = new ApplicationUser { Id = Guid.NewGuid(), UserName = "s2@test.com", Email = "s2@test.com", Status = UserStatus.ACTIVE, LastLoginAt = DateTime.UtcNow };
        await userManager.CreateAsync(student);
        db.UserRoles.Add(new IdentityUserRole<Guid> { RoleId = studentRole.Id, UserId = student.Id });

        // Event INSIDE 30d period (5 days ago)
        var insideDate = DateTime.UtcNow.AddDays(-5);
        db.StudentDailyActivities.Add(new StudentDailyActivity
        {
            Id = Guid.NewGuid(),
            UserId = student.Id,
            ActivityDate = insideDate.ToString("yyyy-MM-dd"),
            Minutes = 60,
            CreatedAt = insideDate
        });
        db.StudentPracticeAttempts.Add(new StudentPracticeAttempt
        {
            Id = Guid.NewGuid(),
            UserId = student.Id,
            Category = "vocabulary",
            IsCorrect = true,
            AttemptedAt = insideDate
        });

        // Event OUTSIDE 30d period (45 days ago)
        var outsideDate = DateTime.UtcNow.AddDays(-45);
        db.StudentDailyActivities.Add(new StudentDailyActivity
        {
            Id = Guid.NewGuid(),
            UserId = student.Id,
            ActivityDate = outsideDate.ToString("yyyy-MM-dd"),
            Minutes = 300,
            CreatedAt = outsideDate
        });
        db.StudentPracticeAttempts.Add(new StudentPracticeAttempt
        {
            Id = Guid.NewGuid(),
            UserId = student.Id,
            Category = "vocabulary",
            IsCorrect = false,
            AttemptedAt = outsideDate
        });

        await db.SaveChangesAsync();

        var report = await service.GetAnalyticsReportAsync("30d");

        Assert.NotNull(report);
        Assert.Equal(1, report.ActiveStudents);
        Assert.Equal(1, report.LearningHours); // Only 60 mins included, 300 mins excluded

        var vocabMetric = report.SkillMetrics.First(s => s.Skill.Contains("Từ vựng"));
        Assert.Equal(100, vocabMetric.AvgScore); // 1 correct attempt inside period = 100%, incorrect outside ignored
    }

    [Fact]
    public async Task GetAnalyticsReportAsync_EmptyDatabase_ReturnsExplicitEmptyMetrics()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        var report = await service.GetAnalyticsReportAsync("30d");

        Assert.NotNull(report);
        Assert.Equal(0, report.ActiveStudents);
        Assert.Equal(0, report.LearningHours);
        Assert.Equal(0.0, report.CompletionRate);
        Assert.Equal(0.0, report.RetentionRate);
        Assert.All(report.SkillMetrics, s => Assert.Equal(0, s.Hours));
    }

    [Fact]
    public async Task GetAIOperationsStatsAsync_EmptyDatabase_ReturnsExplicitNullAndUnknownState()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        var stats = await service.GetAIOperationsStatsAsync();

        Assert.NotNull(stats);
        Assert.Equal(0, stats.TotalRequests);
        Assert.Null(stats.AverageLatencyMs);
        Assert.Null(stats.SuccessRate);
        Assert.Null(stats.TotalTokens);
        Assert.NotEmpty(stats.Services);
        Assert.All(stats.Services, s =>
        {
            Assert.Equal("UNKNOWN", s.Status);
            Assert.Null(s.LatencyMs);
            Assert.Null(s.SuccessRate);
            Assert.Null(s.Uptime);
        });
    }

    [Fact]
    public async Task GetAIOperationsStatsAsync_RealAndMockLogs_FiltersMockLogsAndComputesMeasuredRates()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        // Seed 2 real successful logs, 1 real failed log, and 5 mock logs
        db.AiUsageLogs.AddRange(
            new AiUsageLog { Id = Guid.NewGuid(), Feature = "TUTOR", Success = true, LatencyMs = 100, TotalTokens = 500, IsMock = false, CreatedAt = DateTime.UtcNow },
            new AiUsageLog { Id = Guid.NewGuid(), Feature = "TUTOR", Success = true, LatencyMs = 200, TotalTokens = 500, IsMock = false, CreatedAt = DateTime.UtcNow },
            new AiUsageLog { Id = Guid.NewGuid(), Feature = "TUTOR", Success = false, LatencyMs = 300, TotalTokens = 200, IsMock = false, CreatedAt = DateTime.UtcNow },
            new AiUsageLog { Id = Guid.NewGuid(), Feature = "TUTOR", Success = true, LatencyMs = 10, TotalTokens = 99999, IsMock = true, CreatedAt = DateTime.UtcNow },
            new AiUsageLog { Id = Guid.NewGuid(), Feature = "SPEAKING", Success = true, LatencyMs = 10, TotalTokens = 99999, IsMock = true, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var stats = await service.GetAIOperationsStatsAsync();

        Assert.NotNull(stats);
        Assert.Equal(3, stats.TotalRequests); // Exactly 3 real requests, mocks excluded
        Assert.Equal(200, stats.AverageLatencyMs); // (100 + 200 + 300) / 3 = 200
        Assert.Equal(66.7, stats.SuccessRate); // 2/3 = 66.7%
        Assert.Equal(1200, stats.TotalTokens); // 500 + 500 + 200 = 1200

        var tutorService = stats.Services.First(s => s.Id == "ai-tutor");
        Assert.Equal("ONLINE", tutorService.Status);
        Assert.Equal(200, tutorService.LatencyMs);
        Assert.Equal(66.7, tutorService.SuccessRate);
        Assert.Null(tutorService.Uptime); // Uptime must NOT be conflated with success rate
    }
}
