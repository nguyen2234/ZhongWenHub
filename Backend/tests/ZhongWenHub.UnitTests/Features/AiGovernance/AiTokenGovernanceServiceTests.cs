using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;
using ZhongWenHub.Features.admin.AiGovernance;
using ZhongWenHub.Features.admin.AiGovernance.DTO;

namespace ZhongWenHub.UnitTests.Features.AiGovernance;

public class AiTokenGovernanceServiceTests
{
    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task EnsureQuotaAvailableAsync_WithinLimits_Succeeds()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);
        var userId = Guid.NewGuid();

        // Should not throw
        await service.EnsureQuotaAvailableAsync(userId, "AI_LETTER_WRITING", 1000);
    }

    [Fact]
    public async Task EnsureQuotaAvailableAsync_WhenFeatureDisabled_Throws503ServiceUnavailable()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);

        await service.UpdateGovernanceAsync("AI_TUTOR", new UpdateAiFeatureGovernanceDto
        {
            IsEnabled = false
        });

        var ex = await Assert.ThrowsAsync<AITutorException>(() =>
            service.EnsureQuotaAvailableAsync(Guid.NewGuid(), "AI_TUTOR", 500));

        Assert.Equal(503, ex.StatusCode);
        Assert.Contains("tạm dừng", ex.Message);
    }

    [Fact]
    public async Task EnsureQuotaAvailableAsync_WhenDailyTokenCeilingExceeded_Throws429TooManyRequests()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);

        // Set daily quota to 10,000
        await service.UpdateGovernanceAsync("AI_CONVERSATION", new UpdateAiFeatureGovernanceDto
        {
            IsEnabled = true,
            DailyTokenQuota = 10_000,
            UserDailyRequestLimit = 100
        });

        // Add usage log simulating 9,500 tokens used today
        db.AiUsageLogs.Add(new AiUsageLog
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Feature = "AI_CONVERSATION",
            TotalTokens = 9500,
            Success = true,
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        // Requesting 1000 tokens will exceed 10,000 ceiling -> 429
        var ex = await Assert.ThrowsAsync<AITutorException>(() =>
            service.EnsureQuotaAvailableAsync(Guid.NewGuid(), "AI_CONVERSATION", 1000));

        Assert.Equal(429, ex.StatusCode);
    }

    [Fact]
    public async Task EnsureQuotaAvailableAsync_WhenUserDailyRequestLimitReached_Throws429()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);
        var userId = Guid.NewGuid();

        // Set user daily limit to 2 requests
        await service.UpdateGovernanceAsync("AI_LETTER_WRITING", new UpdateAiFeatureGovernanceDto
        {
            IsEnabled = true,
            DailyTokenQuota = 500_000,
            UserDailyRequestLimit = 2
        });

        // Simulate 2 previous requests today for this user
        db.AiUsageLogs.AddRange(
            new AiUsageLog { Id = Guid.NewGuid(), UserId = userId, Feature = "AI_LETTER_WRITING", TotalTokens = 200, Success = true, CreatedAt = DateTime.UtcNow },
            new AiUsageLog { Id = Guid.NewGuid(), UserId = userId, Feature = "AI_LETTER_WRITING", TotalTokens = 200, Success = true, CreatedAt = DateTime.UtcNow }
        );
        await db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<AITutorException>(() =>
            service.EnsureQuotaAvailableAsync(userId, "AI_LETTER_WRITING", 500));

        Assert.Equal(429, ex.StatusCode);
        Assert.Contains("hết 2 lượt", ex.Message);
    }

    [Fact]
    public async Task GetGovernanceOverviewAsync_ReturnsAllThreeFeatureGroups()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);

        var overview = await service.GetGovernanceOverviewAsync();

        Assert.Equal(3, overview.Count);
        Assert.Contains(overview, g => g.FeatureGroup == "AI_LETTER_WRITING");
        Assert.Contains(overview, g => g.FeatureGroup == "AI_TUTOR");
        Assert.Contains(overview, g => g.FeatureGroup == "AI_CONVERSATION");
    }

    [Fact]
    public async Task UpdateGovernanceAsync_UpdatesParametersCorrectly()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);

        var updated = await service.UpdateGovernanceAsync("AI_TUTOR", new UpdateAiFeatureGovernanceDto
        {
            IsEnabled = true,
            DailyTokenQuota = 2_000_000,
            MonthlyTokenQuota = 60_000_000,
            UserDailyRequestLimit = 100,
            MaxTokensPerRequest = 4096
        });

        Assert.Equal(2_000_000, updated.DailyTokenQuota);
        Assert.Equal(60_000_000, updated.MonthlyTokenQuota);
        Assert.Equal(100, updated.UserDailyRequestLimit);
        Assert.Equal(4096, updated.MaxTokensPerRequest);
    }
}
