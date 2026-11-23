using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AITutor;

public interface IAIUsageLogger
{
    Task EnsureWithinDailyBudgetAsync(Guid userId, CancellationToken cancellationToken = default);

    Task LogAsync(
        Guid userId,
        string feature,
        AIProviderResponse? response,
        bool success,
        string? errorCode = null,
        CancellationToken cancellationToken = default);
}

public sealed class EfAIUsageLogger : IAIUsageLogger
{
    private readonly ApplicationDbContext _dbContext;
    private readonly GeminiOptions _options;

    public EfAIUsageLogger(ApplicationDbContext dbContext, IOptions<GeminiOptions> options)
    {
        _dbContext = dbContext;
        _options = options.Value;
    }

    public async Task EnsureWithinDailyBudgetAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var budget = Math.Clamp(_options.DailyTokenBudgetPerUser, 2000, 500000);
        var utcToday = DateTime.UtcNow.Date;

        var usedToday = await _dbContext.AiUsageLogs
            .AsNoTracking()
            .Where(x => x.UserId == userId && x.CreatedAt >= utcToday && x.Success)
            .SumAsync(x => (int?)x.TotalTokens, cancellationToken) ?? 0;

        if (usedToday >= budget)
        {
            throw AITutorException.QuotaExceeded();
        }
    }

    public async Task LogAsync(
        Guid userId,
        string feature,
        AIProviderResponse? response,
        bool success,
        string? errorCode = null,
        CancellationToken cancellationToken = default)
    {
        _dbContext.AiUsageLogs.Add(new AiUsageLog
        {
            UserId = userId,
            Feature = feature,
            Provider = response?.Provider ?? _options.Provider ?? "Gemini",
            Model = response?.Model ?? _options.Model ?? "unknown",
            IsMock = response?.IsMock ?? string.Equals(_options.Provider, "Mock", StringComparison.OrdinalIgnoreCase),
            PromptTokens = response?.PromptTokens ?? 0,
            CompletionTokens = response?.CompletionTokens ?? 0,
            TotalTokens = response?.TotalTokens ?? 0,
            LatencyMs = response?.LatencyMs ?? 0,
            Success = success,
            ErrorCode = errorCode
        });

        await _dbContext.SaveChangesAsync(cancellationToken);
    }
}
