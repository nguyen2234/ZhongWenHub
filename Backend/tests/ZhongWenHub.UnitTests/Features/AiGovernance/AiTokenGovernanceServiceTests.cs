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

    [Fact]
    public async Task ReserveQuotaAsync_And_SettleQuotaAsync_Success_UpdatesStatusToCompleted()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);
        var userId = Guid.NewGuid();

        var reservation = await service.ReserveQuotaAsync(userId, "AI_TUTOR", 1200);

        Assert.NotEqual(Guid.Empty, reservation.ReservationId);
        Assert.Equal("AI_TUTOR", reservation.FeatureGroup);
        Assert.Equal(1200, reservation.EstimatedTokens);

        var log = await db.AiUsageLogs.FirstOrDefaultAsync(l => l.Id == reservation.ReservationId);
        Assert.NotNull(log);
        Assert.Equal("RESERVED", log.ErrorCode);
        Assert.True(log.Success);
        Assert.Equal(1200, log.TotalTokens);

        var providerResponse = new AIProviderResponse
        {
            Provider = "OpenAI",
            Model = "gpt-4o-mini",
            PromptTokens = 400,
            CompletionTokens = 350,
            TotalTokens = 750,
            LatencyMs = 850
        };

        await service.SettleQuotaAsync(reservation.ReservationId, providerResponse, true, "COMPLETED");

        var settledLog = await db.AiUsageLogs.FirstOrDefaultAsync(l => l.Id == reservation.ReservationId);
        Assert.NotNull(settledLog);
        Assert.Equal("COMPLETED", settledLog.ErrorCode);
        Assert.True(settledLog.Success);
        Assert.Equal(750, settledLog.TotalTokens);
        Assert.Equal(400, settledLog.PromptTokens);
        Assert.Equal(350, settledLog.CompletionTokens);
        Assert.Equal("OpenAI", settledLog.Provider);
        Assert.Equal("gpt-4o-mini", settledLog.Model);
    }

    [Fact]
    public async Task ReserveQuotaAsync_And_SettleQuotaAsync_Failure_ReleasesTokensToZero()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);
        var userId = Guid.NewGuid();

        var reservation = await service.ReserveQuotaAsync(userId, "AI_LETTER_WRITING", 1500);

        await service.SettleQuotaAsync(reservation.ReservationId, null, false, "RELEASED");

        var settledLog = await db.AiUsageLogs.FirstOrDefaultAsync(l => l.Id == reservation.ReservationId);
        Assert.NotNull(settledLog);
        Assert.Equal("RELEASED", settledLog.ErrorCode);
        Assert.False(settledLog.Success);
        Assert.Equal(0, settledLog.TotalTokens);

        // Released tokens should not block next requests
        var nextReservation = await service.ReserveQuotaAsync(userId, "AI_LETTER_WRITING", 1500);
        Assert.NotEqual(Guid.Empty, nextReservation.ReservationId);
    }

    [Fact]
    public async Task ReserveQuotaAsync_MonthlyTokenCeilingExceeded_Throws429()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);

        await service.UpdateGovernanceAsync("AI_CONVERSATION", new UpdateAiFeatureGovernanceDto
        {
            IsEnabled = true,
            DailyTokenQuota = 500_000,
            MonthlyTokenQuota = 100_000,
            UserDailyRequestLimit = 500
        });

        // Seed 99,500 tokens used this month
        db.AiUsageLogs.Add(new AiUsageLog
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Feature = "AI_CONVERSATION",
            TotalTokens = 99_500,
            Success = true,
            ErrorCode = "COMPLETED",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        var ex = await Assert.ThrowsAsync<AITutorException>(() =>
            service.ReserveQuotaAsync(Guid.NewGuid(), "AI_CONVERSATION", 1000));

        Assert.Equal(429, ex.StatusCode);
        Assert.Contains("ngân sách token trong tháng", ex.Message);
    }

    [Fact]
    public async Task ReserveQuotaAsync_ExpiredReservations_AreCleanedUpAutomatically()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);

        await service.UpdateGovernanceAsync("AI_TUTOR", new UpdateAiFeatureGovernanceDto
        {
            IsEnabled = true,
            DailyTokenQuota = 10_000,
            UserDailyRequestLimit = 100
        });

        var staleId = Guid.NewGuid();
        db.AiUsageLogs.Add(new AiUsageLog
        {
            Id = staleId,
            UserId = Guid.NewGuid(),
            Feature = "AI_TUTOR",
            TotalTokens = 9500,
            Success = true,
            ErrorCode = "RESERVED",
            CreatedAt = DateTime.UtcNow.AddMinutes(-10) // 10 minutes ago
        });
        await db.SaveChangesAsync();

        // Stale reservation of 9500 would normally block this, but cleanup releases it
        var reservation = await service.ReserveQuotaAsync(Guid.NewGuid(), "AI_TUTOR", 2000);
        Assert.NotEqual(Guid.Empty, reservation.ReservationId);

        var staleLog = await db.AiUsageLogs.FirstOrDefaultAsync(l => l.Id == staleId);
        Assert.NotNull(staleLog);
        Assert.Equal("EXPIRED_RELEASED", staleLog.ErrorCode);
        Assert.Equal(0, staleLog.TotalTokens);
        Assert.False(staleLog.Success);
    }

    [Fact]
    public async Task ReserveQuotaAsync_ConcurrentRequests_EnforcesQuotaFailClosed()
    {
        using var db = CreateInMemoryDbContext();
        var service = new AiTokenGovernanceService(db, NullLogger<AiTokenGovernanceService>.Instance);

        // Daily quota = 10,000. Seed 7,500 used tokens. Remaining room = 2,500 tokens.
        await service.UpdateGovernanceAsync("AI_LETTER_WRITING", new UpdateAiFeatureGovernanceDto
        {
            IsEnabled = true,
            DailyTokenQuota = 10_000,
            UserDailyRequestLimit = 100,
            MaxTokensPerRequest = 2048
        });

        db.AiUsageLogs.Add(new AiUsageLog
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            Feature = "AI_LETTER_WRITING",
            TotalTokens = 7500,
            Success = true,
            ErrorCode = "COMPLETED",
            CreatedAt = DateTime.UtcNow
        });
        await db.SaveChangesAsync();

        // 10 concurrent requests each asking for 1,000 tokens
        // Room = 2,500 tokens -> exactly 2 can succeed (2 x 1000 = 2000), 3rd would be 7500 + 3000 = 10500 > 10000.
        var tasks = Enumerable.Range(0, 10).Select(async _ =>
        {
            try
            {
                await service.ReserveQuotaAsync(Guid.NewGuid(), "AI_LETTER_WRITING", 1000);
                return true;
            }
            catch (AITutorException ex) when (ex.StatusCode == 429)
            {
                return false;
            }
        });

        var results = await Task.WhenAll(tasks);
        var successCount = results.Count(r => r);
        var failCount = results.Count(r => !r);

        Assert.Equal(2, successCount);
        Assert.Equal(8, failCount);
    }
}
