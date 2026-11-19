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

        // Seed some AI usage logs
        db.AiUsageLogs.AddRange(
            new AiUsageLog
            {
                Id = Guid.NewGuid(),
                Feature = "AI_TUTOR",
                Provider = "Gemini",
                LatencyMs = 200,
                TotalTokens = 150,
                Success = true
            },
            new AiUsageLog
            {
                Id = Guid.NewGuid(),
                Feature = "AI_SPEAKING",
                Provider = "Whisper",
                LatencyMs = 300,
                TotalTokens = 250,
                Success = true
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
    }

    [Fact]
    public async Task GetAnalyticsReportAsync_CalculatesHskAndSkillMetrics()
    {
        using var db = CreateInMemoryDbContext();
        var userManager = CreateTestUserManager(db);
        var service = new AdminOperationsService(db, userManager, NullLogger<AdminOperationsService>.Instance);

        // Seed users
        var user1 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "learner1@test.com",
            Email = "learner1@test.com",
            Status = UserStatus.ACTIVE,
            CurrentHskLevel = "HSK 2"
        };
        var user2 = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "learner2@test.com",
            Email = "learner2@test.com",
            Status = UserStatus.ACTIVE,
            CurrentHskLevel = "HSK 3"
        };
        await userManager.CreateAsync(user1);
        await userManager.CreateAsync(user2);

        // Seed skill stats
        db.LearningSkillStatistics.Add(new LearningSkillStatistic
        {
            Id = Guid.NewGuid(),
            UserId = user1.Id,
            SkillCategory = "vocabulary",
            TotalAttempts = 40,
            AccuracyPercent = 90.0
        });
        await db.SaveChangesAsync();

        var report = await service.GetAnalyticsReportAsync("30d");

        Assert.NotNull(report);
        Assert.Equal(2, report.ActiveStudents);
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
            MaxLoginAttempts = 3,
            Require2FA = true,
            IsMaintenanceMode = false
        };

        var updated = await service.UpdateSystemSettingsAsync(updateDto);
        Assert.Equal("ZhongWenHub Production Test", updated.PlatformName);
        Assert.Equal("contact@zhongwenhub.edu.vn", updated.ContactEmail);
        Assert.Equal(3, updated.MaxLoginAttempts);
        Assert.True(updated.Require2FA);

        // Read again to verify persistence
        var fetched = await service.GetSystemSettingsAsync();
        Assert.Equal("ZhongWenHub Production Test", fetched.PlatformName);
        Assert.Equal(3, fetched.MaxLoginAttempts);
        Assert.True(fetched.Require2FA);
    }
}
