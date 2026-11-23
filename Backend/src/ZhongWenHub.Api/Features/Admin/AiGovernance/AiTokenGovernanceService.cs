using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Features.admin.AiGovernance.DTO;

namespace ZhongWenHub.Features.admin.AiGovernance;

public class AiTokenGovernanceService : IAiTokenGovernanceService
{
    private static readonly (string Feature, string Name, string Desc, long DailyTokens, long MonthlyTokens, int UserDailyLimit, int MaxTokens)[] DefaultRules = new[]
    {
        ("AI_LETTER_WRITING", "Viết thư bằng AI", "Trợ lý biên soạn thư tín & sửa lỗi tiếng Trung", 300_000L, 9_000_000L, 20, 2048),
        ("AI_TUTOR", "Trợ giảng AI", "Gia sư giải đáp thắc mắc từ vựng & ngữ pháp đa ngữ cảnh", 1_000_000L, 30_000_000L, 50, 2048),
        ("AI_CONVERSATION", "Hội thoại AI", "Luyện phản xạ giao tiếp tình huống và kiểm tra lỗi ngữ pháp", 800_000L, 24_000_000L, 40, 1024)
    };

    private readonly ApplicationDbContext _context;
    private readonly ILogger<AiTokenGovernanceService> _logger;

    public AiTokenGovernanceService(
        ApplicationDbContext context,
        ILogger<AiTokenGovernanceService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task EnsureQuotaAvailableAsync(
        Guid userId,
        string feature,
        int estimatedTokens = 1000,
        CancellationToken ct = default)
    {
        var gov = await GetOrSeedGovernanceAsync(feature, ct);

        if (!gov.IsEnabled)
        {
            throw new AITutorException(
                503,
                "Chức năng AI tạm dừng",
                $"Chức năng \"{gov.DisplayNameVi}\" đang được quản trị viên tạm dừng để bảo trì định kỳ. Vui lòng thử lại sau.");
        }

        var todayUtc = DateTime.UtcNow.Date;

        // Check global daily token quota for this specific feature group
        var tokensToday = await _context.AiUsageLogs
            .AsNoTracking()
            .Where(l => l.Feature == feature && l.CreatedAt >= todayUtc)
            .SumAsync(l => (long)l.TotalTokens, ct);

        if (tokensToday + estimatedTokens > gov.DailyTokenQuota)
        {
            _logger.LogWarning("AI Feature {Feature} hit daily token budget ceiling: {Used} / {Quota}",
                feature, tokensToday, gov.DailyTokenQuota);
            throw AITutorException.QuotaExceeded();
        }

        // Check user daily request limit for this feature group
        var userRequestsToday = await _context.AiUsageLogs
            .AsNoTracking()
            .Where(l => l.UserId == userId && l.Feature == feature && l.CreatedAt >= todayUtc)
            .CountAsync(ct);

        if (userRequestsToday >= gov.UserDailyRequestLimit)
        {
            _logger.LogInformation("User {UserId} reached daily limit for feature {Feature}: {Count}/{Limit}",
                userId, feature, userRequestsToday, gov.UserDailyRequestLimit);
            throw new AITutorException(
                429,
                "Giới hạn lượt dùng trong ngày",
                $"Bạn đã sử dụng hết {gov.UserDailyRequestLimit} lượt cho chức năng {gov.DisplayNameVi} trong ngày hôm nay. Hạn mức sẽ được làm mới vào ngày mai.");
        }
    }

    public async Task<List<AiFeatureGovernanceDto>> GetGovernanceOverviewAsync(CancellationToken ct = default)
    {
        await EnsureAllDefaultSeededAsync(ct);

        var entities = await _context.AiFeatureGovernances
            .AsNoTracking()
            .OrderBy(e => e.FeatureGroup)
            .ToListAsync(ct);

        var todayUtc = DateTime.UtcNow.Date;
        var monthStartUtc = new DateTime(todayUtc.Year, todayUtc.Month, 1, 0, 0, 0, DateTimeKind.Utc);

        var todayStats = await _context.AiUsageLogs
            .AsNoTracking()
            .Where(l => l.CreatedAt >= todayUtc)
            .GroupBy(l => l.Feature)
            .Select(g => new
            {
                Feature = g.Key,
                TotalTokens = g.Sum(x => (long)x.TotalTokens),
                Requests = g.Count()
            })
            .ToListAsync(ct);

        var monthStats = await _context.AiUsageLogs
            .AsNoTracking()
            .Where(l => l.CreatedAt >= monthStartUtc)
            .GroupBy(l => l.Feature)
            .Select(g => new
            {
                Feature = g.Key,
                TotalTokens = g.Sum(x => (long)x.TotalTokens)
            })
            .ToListAsync(ct);

        var todayMap = todayStats.ToDictionary(s => s.Feature, s => (s.TotalTokens, s.Requests));
        var monthMap = monthStats.ToDictionary(s => s.Feature, s => s.TotalTokens);

        return entities.Select(e =>
        {
            todayMap.TryGetValue(e.FeatureGroup, out var tStat);
            monthMap.TryGetValue(e.FeatureGroup, out var mTokens);

            return new AiFeatureGovernanceDto
            {
                Id = e.Id,
                FeatureGroup = e.FeatureGroup,
                DisplayNameVi = e.DisplayNameVi,
                DescriptionVi = e.DescriptionVi,
                IsEnabled = e.IsEnabled,
                DailyTokenQuota = e.DailyTokenQuota,
                MonthlyTokenQuota = e.MonthlyTokenQuota,
                UserDailyRequestLimit = e.UserDailyRequestLimit,
                MaxTokensPerRequest = e.MaxTokensPerRequest,
                TokensUsedToday = tStat.TotalTokens,
                RequestsToday = tStat.Requests,
                TokensUsedThisMonth = mTokens,
                UpdatedAt = e.UpdatedAt
            };
        }).ToList();
    }

    public async Task<AiFeatureGovernanceDto> UpdateGovernanceAsync(
        string featureGroup,
        UpdateAiFeatureGovernanceDto dto,
        CancellationToken ct = default)
    {
        var entity = await _context.AiFeatureGovernances
            .FirstOrDefaultAsync(e => e.FeatureGroup == featureGroup, ct);

        if (entity == null)
        {
            entity = await GetOrSeedGovernanceAsync(featureGroup, ct);
        }

        entity.IsEnabled = dto.IsEnabled;
        entity.DailyTokenQuota = Math.Max(10_000, dto.DailyTokenQuota);
        entity.MonthlyTokenQuota = Math.Max(100_000, dto.MonthlyTokenQuota);
        entity.UserDailyRequestLimit = Math.Clamp(dto.UserDailyRequestLimit, 1, 1000);
        entity.MaxTokensPerRequest = Math.Clamp(dto.MaxTokensPerRequest, 256, 8192);
        entity.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(ct);

        _logger.LogInformation("Admin updated governance for feature {Feature}: Enabled={Enabled}, DailyQuota={DailyQuota}, UserLimit={Limit}",
            featureGroup, entity.IsEnabled, entity.DailyTokenQuota, entity.UserDailyRequestLimit);

        return new AiFeatureGovernanceDto
        {
            Id = entity.Id,
            FeatureGroup = entity.FeatureGroup,
            DisplayNameVi = entity.DisplayNameVi,
            DescriptionVi = entity.DescriptionVi,
            IsEnabled = entity.IsEnabled,
            DailyTokenQuota = entity.DailyTokenQuota,
            MonthlyTokenQuota = entity.MonthlyTokenQuota,
            UserDailyRequestLimit = entity.UserDailyRequestLimit,
            MaxTokensPerRequest = entity.MaxTokensPerRequest,
            UpdatedAt = entity.UpdatedAt
        };
    }

    private async Task<AiFeatureGovernance> GetOrSeedGovernanceAsync(string feature, CancellationToken ct)
    {
        var entity = await _context.AiFeatureGovernances
            .FirstOrDefaultAsync(e => e.FeatureGroup == feature, ct);

        if (entity != null) return entity;

        var rule = DefaultRules.FirstOrDefault(r => r.Feature == feature);
        if (rule == default)
        {
            rule = (feature, feature, "Chức năng AI", 500_000L, 15_000_000L, 25, 2048);
        }

        entity = new AiFeatureGovernance
        {
            Id = Guid.NewGuid(),
            FeatureGroup = rule.Feature,
            DisplayNameVi = rule.Name,
            DescriptionVi = rule.Desc,
            IsEnabled = true,
            DailyTokenQuota = rule.DailyTokens,
            MonthlyTokenQuota = rule.MonthlyTokens,
            UserDailyRequestLimit = rule.UserDailyLimit,
            MaxTokensPerRequest = rule.MaxTokens,
            CreatedAt = DateTime.UtcNow
        };

        _context.AiFeatureGovernances.Add(entity);
        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch
        {
            // Concurrent seed protection
            var existing = await _context.AiFeatureGovernances.FirstOrDefaultAsync(e => e.FeatureGroup == feature, ct);
            if (existing != null) return existing;
        }

        return entity;
    }

    private async Task EnsureAllDefaultSeededAsync(CancellationToken ct)
    {
        var existing = await _context.AiFeatureGovernances.Select(e => e.FeatureGroup).ToListAsync(ct);
        var missing = DefaultRules.Where(r => !existing.Contains(r.Feature)).ToList();

        if (missing.Count == 0) return;

        foreach (var rule in missing)
        {
            _context.AiFeatureGovernances.Add(new AiFeatureGovernance
            {
                Id = Guid.NewGuid(),
                FeatureGroup = rule.Feature,
                DisplayNameVi = rule.Name,
                DescriptionVi = rule.Desc,
                IsEnabled = true,
                DailyTokenQuota = rule.DailyTokens,
                MonthlyTokenQuota = rule.MonthlyTokens,
                UserDailyRequestLimit = rule.UserDailyLimit,
                MaxTokensPerRequest = rule.MaxTokens,
                CreatedAt = DateTime.UtcNow
            });
        }

        try
        {
            await _context.SaveChangesAsync(ct);
        }
        catch
        {
            // Ignore concurrent duplicate inserts
        }
    }
}
