using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.Admin.DTOs;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.Admin;

public class AdminOperationsService : IAdminOperationsService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AdminOperationsService> _logger;
    private static readonly SemaphoreSlim _settingsLock = new(1, 1);
    private static readonly string SettingsFilePath = Path.Combine(AppContext.BaseDirectory, "system-settings.json");

    public AdminOperationsService(
        ApplicationDbContext dbContext,
        UserManager<ApplicationUser> userManager,
        ILogger<AdminOperationsService> logger)
    {
        _dbContext = dbContext;
        _userManager = userManager;
        _logger = logger;
    }

    public async Task<AdminAIOperationsStatsDto> GetAIOperationsStatsAsync(CancellationToken cancellationToken = default)
    {
        var totalRequests = await _dbContext.AiUsageLogs.CountAsync(cancellationToken);
        var avgLatency = totalRequests > 0
            ? (int)Math.Round(await _dbContext.AiUsageLogs.AverageAsync(x => x.LatencyMs, cancellationToken))
            : 0;

        var successCount = await _dbContext.AiUsageLogs.CountAsync(x => x.Success, cancellationToken);
        var successRate = totalRequests > 0
            ? Math.Round((double)successCount / totalRequests * 100, 1)
            : 100.0;

        var totalTokens = totalRequests > 0
            ? (await _dbContext.AiUsageLogs.SumAsync(x => (int?)x.TotalTokens, cancellationToken) ?? 0)
            : 0;

        var tutorCount = await _dbContext.AiConversationSessions.CountAsync(cancellationToken);
        var speakingCount = await _dbContext.AiSpeakingAttempts.CountAsync(cancellationToken);
        var gradingCount = await _dbContext.AiExerciseAttempts.CountAsync(cancellationToken);
        var skillStatCount = await _dbContext.LearningSkillStatistics.CountAsync(cancellationToken);
        var totalEventsSum = tutorCount + speakingCount + gradingCount + skillStatCount;

        // Query real aggregated feature logs from database
        var featureStats = await _dbContext.AiUsageLogs.AsNoTracking()
            .GroupBy(x => x.Feature)
            .Select(g => new
            {
                Feature = g.Key,
                Count = g.Count(),
                AvgLatency = (int)Math.Round(g.Average(x => x.LatencyMs)),
                SuccessRate = Math.Round((double)g.Count(x => x.Success) / g.Count() * 100, 1)
            })
            .ToListAsync(cancellationToken);

        int? GetFeatureLatency(string keyword)
        {
            var match = featureStats.FirstOrDefault(f => f.Feature.Contains(keyword, StringComparison.OrdinalIgnoreCase));
            return match?.AvgLatency;
        }

        string? GetFeatureUptime(string keyword)
        {
            var match = featureStats.FirstOrDefault(f => f.Feature.Contains(keyword, StringComparison.OrdinalIgnoreCase));
            return match != null ? $"{match.SuccessRate}%" : null;
        }

        double? GetUsagePercent(int count)
        {
            return totalEventsSum > 0 ? Math.Round((double)count / totalEventsSum * 100, 1) : 0;
        }

        var services = new List<AdminAIServiceStatusDto>
        {
            new()
            {
                Id = "ai-tutor",
                Name = "AI Tutor (Trợ lý đối thoại)",
                Role = "Hội thoại tiếng Trung, giải đáp ngữ pháp và sửa lỗi ngữ cảnh",
                Provider = "Google Gemini 2.5 Flash",
                LatencyMs = GetFeatureLatency("TUTOR") ?? GetFeatureLatency("CONVERSATION") ?? (totalRequests > 0 ? avgLatency : null),
                Uptime = GetFeatureUptime("TUTOR") ?? GetFeatureUptime("CONVERSATION") ?? (totalRequests > 0 ? $"{successRate}%" : null),
                UsagePercent = GetUsagePercent(tutorCount),
                Status = tutorCount > 0 || totalRequests > 0 ? "ONLINE" : "IDLE",
                Description = $"Xử lý đối thoại và ngữ pháp HSK. Tổng số phiên tích lũy: {tutorCount}.",
                TotalEvents = tutorCount
            },
            new()
            {
                Id = "ai-live",
                Name = "AI Live (Luyện phát âm & Phản xạ)",
                Role = "Nhận diện giọng nói (ASR) và đánh giá ngữ điệu Pinyin",
                Provider = "Whisper-Large-v3 & FunASR Speech",
                LatencyMs = GetFeatureLatency("SPEAKING"),
                Uptime = GetFeatureUptime("SPEAKING"),
                UsagePercent = GetUsagePercent(speakingCount),
                Status = speakingCount > 0 ? "ONLINE" : "IDLE",
                Description = $"Chấm điểm 4 thanh điệu tiếng Trung, phát hiện lỗi phát âm. Lượt ghi nhận: {speakingCount}.",
                TotalEvents = speakingCount
            },
            new()
            {
                Id = "ai-grading",
                Name = "AI Grading (Chấm bài tập & Đoạn văn)",
                Role = "Chấm điểm tự động bài tập viết chữ Hán và dịch câu",
                Provider = "Gemini 2.5 Pro Pedagogical",
                LatencyMs = GetFeatureLatency("EXERCISE") ?? GetFeatureLatency("GRADING"),
                Uptime = GetFeatureUptime("EXERCISE") ?? GetFeatureUptime("GRADING"),
                UsagePercent = GetUsagePercent(gradingCount),
                Status = gradingCount > 0 ? "ONLINE" : "IDLE",
                Description = $"Hỗ trợ giáo viên chấm bài tập về nhà và gợi ý nhận xét. Bài tập đã chấm: {gradingCount}.",
                TotalEvents = gradingCount
            },
            new()
            {
                Id = "ai-analytics",
                Name = "AI Analytics (Gợi ý lộ trình thích ứng)",
                Role = "Phân tích điểm yếu kiến thức và lập lịch ôn tập ngắt quãng (SRS)",
                Provider = "ZhongWenHub Adaptive Pedagogical Engine",
                LatencyMs = GetFeatureLatency("ANALYTICS") ?? GetFeatureLatency("LEARNING"),
                Uptime = GetFeatureUptime("ANALYTICS") ?? GetFeatureUptime("LEARNING"),
                UsagePercent = GetUsagePercent(skillStatCount),
                Status = skillStatCount > 0 ? "ONLINE" : "IDLE",
                Description = $"Cá nhân hóa danh sách từ vựng cần ôn luyện hôm nay dựa trên SRS. Kỹ năng theo dõi: {skillStatCount}.",
                TotalEvents = skillStatCount
            }
        };

        return new AdminAIOperationsStatsDto
        {
            TotalRequests = totalRequests,
            AverageLatencyMs = avgLatency,
            SuccessRate = successRate,
            TotalTokens = totalTokens,
            Services = services
        };
    }

    public async Task<AdminAnalyticsReportDto> GetAnalyticsReportAsync(string range = "30d", CancellationToken cancellationToken = default)
    {
        var cutoffDate = (range?.ToLowerInvariant()) switch
        {
            "7d" => DateTime.UtcNow.AddDays(-7),
            "90d" => DateTime.UtcNow.AddDays(-90),
            "1y" or "365d" => DateTime.UtcNow.AddDays(-365),
            _ => DateTime.UtcNow.AddDays(-30)
        };

        var activeStudents = await _userManager.Users.AsNoTracking()
            .CountAsync(u => !u.IsDeleted && u.Status == UserStatus.ACTIVE && (u.LastLoginAt >= cutoffDate || u.CreatedAt >= cutoffDate), cancellationToken);

        var totalUsers = await _userManager.Users.AsNoTracking()
            .CountAsync(u => !u.IsDeleted, cancellationToken);

        // HSK Level Distribution from real active users in period
        var hskRaw = await _userManager.Users.AsNoTracking()
            .Where(u => !u.IsDeleted && (u.LastLoginAt >= cutoffDate || u.CreatedAt >= cutoffDate))
            .GroupBy(u => u.CurrentHskLevel ?? "HSK 1")
            .Select(g => new { Level = g.Key, Count = g.Count() })
            .ToListAsync(cancellationToken);

        var levelColors = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "HSK 1", "#e60012" },
            { "HSK 2", "#f97316" },
            { "HSK 3", "#eab308" },
            { "HSK 4", "#22c55e" },
            { "HSK 5", "#06b6d4" },
            { "HSK 6", "#8b5cf6" }
        };

        var distribution = new List<AdminHskLevelDistributionDto>();
        for (int lvl = 1; lvl <= 6; lvl++)
        {
            var levelName = $"HSK {lvl}";
            var match = hskRaw.FirstOrDefault(x => string.Equals(x.Level, levelName, StringComparison.OrdinalIgnoreCase));
            var count = match?.Count ?? 0;
            var pct = activeStudents > 0 ? Math.Round((double)count / activeStudents * 100, 1) : 0.0;
            distribution.Add(new AdminHskLevelDistributionDto
            {
                Level = levelName,
                Count = count,
                Percentage = pct,
                Color = levelColors.GetValueOrDefault(levelName, "#64748b")
            });
        }

        // Skill Metrics filtered by cutoff date
        var skillStats = await _dbContext.LearningSkillStatistics.AsNoTracking()
            .Where(s => s.LastAssessedAt >= cutoffDate || s.UpdatedAt >= cutoffDate)
            .GroupBy(s => s.SkillCategory)
            .Select(g => new
            {
                Skill = g.Key,
                TotalAttempts = g.Sum(x => x.TotalAttempts),
                AvgAccuracy = g.Average(x => (double?)x.AccuracyPercent) ?? 0.0
            })
            .ToListAsync(cancellationToken);

        var skillLabels = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            { "vocabulary", "Từ vựng (Flashcard & Spaced Repetition)" },
            { "listening", "Luyện nghe & Nhận diện âm đọc" },
            { "speaking", "Luyện phát âm & Phản xạ câu" },
            { "grammar", "Ngữ pháp & Cấu trúc câu" },
            { "hanzi", "Tập viết & Thứ tự nét Hán tự" }
        };

        var skillMetrics = new List<AdminSkillMetricDto>();
        foreach (var kvp in skillLabels)
        {
            var matched = skillStats.FirstOrDefault(s => string.Equals(s.Skill, kvp.Key, StringComparison.OrdinalIgnoreCase));
            var attempts = matched?.TotalAttempts ?? 0;
            var avgScore = attempts > 0 ? (int)Math.Round(matched?.AvgAccuracy ?? 0.0) : 0;
            var hours = (int)Math.Round(attempts * 0.25);

            skillMetrics.Add(new AdminSkillMetricDto
            {
                Skill = kvp.Value,
                Hours = hours,
                AvgScore = avgScore
            });
        }

        var completedLessonsCount = await _dbContext.StudentLessonProgresses
            .CountAsync(p => p.Status == "COMPLETED" && (p.CompletedAt >= cutoffDate || p.UpdatedAt >= cutoffDate || p.CreatedAt >= cutoffDate), cancellationToken);
        var totalLessonProgressCount = await _dbContext.StudentLessonProgresses
            .CountAsync(p => p.CompletedAt >= cutoffDate || p.UpdatedAt >= cutoffDate || p.CreatedAt >= cutoffDate, cancellationToken);

        var completionRate = totalLessonProgressCount > 0
            ? Math.Round((double)completedLessonsCount / totalLessonProgressCount * 100, 1)
            : 0.0;

        var totalHours = skillMetrics.Sum(s => s.Hours);
        var retentionRate = (totalUsers > 0 && activeStudents > 0)
            ? Math.Round((double)activeStudents / totalUsers * 100, 1)
            : 0.0;

        return new AdminAnalyticsReportDto
        {
            ActiveStudents = activeStudents,
            CompletionRate = completionRate,
            LearningHours = totalHours,
            RetentionRate = retentionRate,
            HskDistribution = distribution,
            SkillMetrics = skillMetrics
        };
    }

    public async Task<AdminSystemSettingsDto> GetSystemSettingsAsync(CancellationToken cancellationToken = default)
    {
        await _settingsLock.WaitAsync(cancellationToken);
        try
        {
            if (File.Exists(SettingsFilePath))
            {
                var json = await File.ReadAllTextAsync(SettingsFilePath, cancellationToken);
                var settings = JsonSerializer.Deserialize<AdminSystemSettingsDto>(json, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
                if (settings != null) return settings;
            }

            var defaultSettings = new AdminSystemSettingsDto();
            var jsonText = JsonSerializer.Serialize(defaultSettings, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(SettingsFilePath, jsonText, cancellationToken);
            return defaultSettings;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error reading system settings from {Path}", SettingsFilePath);
            return new AdminSystemSettingsDto();
        }
        finally
        {
            _settingsLock.Release();
        }
    }

    public async Task<AdminSystemSettingsDto> UpdateSystemSettingsAsync(AdminSystemSettingsDto dto, CancellationToken cancellationToken = default)
    {
        if (dto.Require2FA)
        {
            throw new InvalidOperationException("Chính sách xác thực 2 yếu tố (Require2FA) chưa được hỗ trợ trên hệ thống hiện tại.");
        }

        if (dto.SessionTimeoutMinutes < 5 || dto.SessionTimeoutMinutes > 1440)
        {
            throw new ArgumentOutOfRangeException(nameof(dto.SessionTimeoutMinutes), "Thời gian phiên làm việc phải từ 5 đến 1440 phút.");
        }

        if (dto.MaxLoginAttempts < 1 || dto.MaxLoginAttempts > 20)
        {
            throw new ArgumentOutOfRangeException(nameof(dto.MaxLoginAttempts), "Số lần đăng nhập tối đa phải từ 1 đến 20 lần.");
        }

        var allowedLangs = new[] { "vi-VN", "zh-CN", "en-US" };
        if (!allowedLangs.Contains(dto.DefaultLanguage))
        {
            throw new ArgumentException($"Ngôn ngữ mặc định '{dto.DefaultLanguage}' chưa được hỗ trợ.");
        }

        await _settingsLock.WaitAsync(cancellationToken);
        try
        {
            dto.LastUpdatedAt = DateTime.UtcNow;
            var json = JsonSerializer.Serialize(dto, new JsonSerializerOptions { WriteIndented = true });
            await File.WriteAllTextAsync(SettingsFilePath, json, cancellationToken);
            _logger.LogInformation("System settings successfully updated by Administrator.");
            return dto;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error writing system settings to {Path}", SettingsFilePath);
            throw;
        }
        finally
        {
            _settingsLock.Release();
        }
    }
}
