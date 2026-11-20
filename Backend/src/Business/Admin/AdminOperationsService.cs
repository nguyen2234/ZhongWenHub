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
        // 1. Filter out mock logs to provide genuine AI telemetry
        var realLogsQuery = _dbContext.AiUsageLogs.AsNoTracking().Where(x => !x.IsMock);

        var totalRequests = await realLogsQuery.CountAsync(cancellationToken);
        int? avgLatency = totalRequests > 0
            ? (int)Math.Round(await realLogsQuery.AverageAsync(x => x.LatencyMs, cancellationToken))
            : null;

        var successCount = await realLogsQuery.CountAsync(x => x.Success, cancellationToken);
        double? successRate = totalRequests > 0
            ? Math.Round((double)successCount / totalRequests * 100, 1)
            : null;

        var totalTokens = totalRequests > 0
            ? await realLogsQuery.SumAsync(x => (int?)x.TotalTokens, cancellationToken)
            : null;

        var tutorCount = await _dbContext.AiConversationSessions.CountAsync(cancellationToken);
        var speakingCount = await _dbContext.AiSpeakingAttempts.CountAsync(cancellationToken);
        var gradingCount = await _dbContext.AiExerciseAttempts.CountAsync(cancellationToken);
        var skillStatCount = await _dbContext.LearningSkillStatistics.CountAsync(cancellationToken);
        var totalEventsSum = tutorCount + speakingCount + gradingCount + skillStatCount;

        // Query real aggregated feature logs from database (excluding mocks)
        var featureStats = await realLogsQuery
            .GroupBy(x => x.Feature)
            .Select(g => new
            {
                Feature = g.Key,
                Count = g.Count(),
                AvgLatency = (int)Math.Round(g.Average(x => x.LatencyMs)),
                SuccessRate = Math.Round((double)g.Count(x => x.Success) / g.Count() * 100, 1)
            })
            .ToListAsync(cancellationToken);

        // Check recent logs (within last 15 minutes) to determine actual live status,
        // without deducing ONLINE purely from historical data.
        var recentCutoff = DateTime.UtcNow.AddMinutes(-15);
        var recentActiveFeatures = await realLogsQuery
            .Where(x => x.CreatedAt >= recentCutoff)
            .Select(x => x.Feature)
            .Distinct()
            .ToListAsync(cancellationToken);

        int? GetFeatureLatency(string keyword)
        {
            var match = featureStats.FirstOrDefault(f => f.Feature.Contains(keyword, StringComparison.OrdinalIgnoreCase));
            return match?.AvgLatency;
        }

        double? GetFeatureSuccessRate(string keyword)
        {
            var match = featureStats.FirstOrDefault(f => f.Feature.Contains(keyword, StringComparison.OrdinalIgnoreCase));
            return match?.SuccessRate;
        }

        double? GetUsagePercent(int count)
        {
            return (totalEventsSum > 0 && count > 0) ? Math.Round((double)count / totalEventsSum * 100, 1) : null;
        }

        string ResolveServiceStatus(string keyword, int eventCount)
        {
            var hasRecentLiveActivity = recentActiveFeatures.Any(f => f.Contains(keyword, StringComparison.OrdinalIgnoreCase));
            if (hasRecentLiveActivity)
            {
                return "ONLINE";
            }

            var hasAnyHistoricalData = featureStats.Any(f => f.Feature.Contains(keyword, StringComparison.OrdinalIgnoreCase)) || eventCount > 0;
            return hasAnyHistoricalData ? "IDLE" : "UNKNOWN";
        }

        var services = new List<AdminAIServiceStatusDto>
        {
            new()
            {
                Id = "ai-tutor",
                Name = "AI Tutor (Trợ lý đối thoại)",
                Role = "Hội thoại tiếng Trung, giải đáp ngữ pháp và sửa lỗi ngữ cảnh",
                Provider = "Google Gemini 2.5 Flash",
                LatencyMs = GetFeatureLatency("TUTOR") ?? GetFeatureLatency("CONVERSATION"),
                SuccessRate = GetFeatureSuccessRate("TUTOR") ?? GetFeatureSuccessRate("CONVERSATION"),
                Uptime = null, // Do not conflate request success rate with system uptime
                UsagePercent = GetUsagePercent(tutorCount),
                Status = ResolveServiceStatus("TUTOR", tutorCount),
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
                SuccessRate = GetFeatureSuccessRate("SPEAKING"),
                Uptime = null,
                UsagePercent = GetUsagePercent(speakingCount),
                Status = ResolveServiceStatus("SPEAKING", speakingCount),
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
                SuccessRate = GetFeatureSuccessRate("EXERCISE") ?? GetFeatureSuccessRate("GRADING"),
                Uptime = null,
                UsagePercent = GetUsagePercent(gradingCount),
                Status = ResolveServiceStatus("GRADING", gradingCount),
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
                SuccessRate = GetFeatureSuccessRate("ANALYTICS") ?? GetFeatureSuccessRate("LEARNING"),
                Uptime = null,
                UsagePercent = GetUsagePercent(skillStatCount),
                Status = ResolveServiceStatus("ANALYTICS", skillStatCount),
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
        var periodDays = (range?.ToLowerInvariant()) switch
        {
            "7d" => 7,
            "90d" => 90,
            "1y" or "365d" => 365,
            _ => 30
        };

        var cutoffDate = DateTime.UtcNow.AddDays(-periodDays);
        var cutoffDateStr = cutoffDate.ToString("yyyy-MM-dd");

        // 1. Role Filtering: Only include genuine students with the STUDENT role
        var studentRole = await _dbContext.Roles.AsNoTracking()
            .FirstOrDefaultAsync(r => r.Name == RoleConstants.Student, cancellationToken);
        var studentRoleId = studentRole?.Id ?? Guid.Empty;

        var studentUsersQuery = from u in _dbContext.Users.AsNoTracking()
                                join ur in _dbContext.UserRoles.AsNoTracking() on u.Id equals ur.UserId
                                where ur.RoleId == studentRoleId && !u.IsDeleted
                                select u;

        var activeStudents = await studentUsersQuery
            .CountAsync(u => u.Status == UserStatus.ACTIVE && (u.LastLoginAt >= cutoffDate || u.CreatedAt >= cutoffDate), cancellationToken);

        // 2. HSK Level Distribution from real active students in the selected period
        var hskRaw = await studentUsersQuery
            .Where(u => u.LastLoginAt >= cutoffDate || u.CreatedAt >= cutoffDate)
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

        // 3. Learning Hours: Calculate directly from StudentDailyActivities.Minutes
        var totalMinutes = await (
            from a in _dbContext.StudentDailyActivities.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on a.UserId equals ur.UserId
            where ur.RoleId == studentRoleId &&
                  ((!string.IsNullOrEmpty(a.ActivityDate) && string.Compare(a.ActivityDate, cutoffDateStr) >= 0) ||
                   (string.IsNullOrEmpty(a.ActivityDate) && a.CreatedAt >= cutoffDate))
            select (int?)a.Minutes
        ).SumAsync(cancellationToken) ?? 0;

        var totalHours = (int)Math.Round((double)totalMinutes / 60.0);

        // 4. Skill Metrics: Based strictly on practice attempts generated within the period
        // (Do NOT use cumulative statistics UpdatedAt)
        var practiceAttempts = await (
            from pa in _dbContext.StudentPracticeAttempts.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on pa.UserId equals ur.UserId
            where ur.RoleId == studentRoleId && pa.AttemptedAt >= cutoffDate
            group pa by pa.Category.ToLower() into g
            select new
            {
                Category = g.Key,
                TotalAttempts = g.Count(),
                CorrectCount = g.Count(x => x.IsCorrect)
            }
        ).ToListAsync(cancellationToken);

        var totalAttemptsAll = practiceAttempts.Sum(p => p.TotalAttempts);

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
            var matched = practiceAttempts.FirstOrDefault(s => string.Equals(s.Category, kvp.Key, StringComparison.OrdinalIgnoreCase));
            var attempts = matched?.TotalAttempts ?? 0;
            var avgScore = attempts > 0 ? (int)Math.Round((double)(matched!.CorrectCount) / attempts * 100) : 0;
            var hours = (totalAttemptsAll > 0 && totalHours > 0)
                ? (int)Math.Round((double)attempts / totalAttemptsAll * totalHours)
                : 0;

            skillMetrics.Add(new AdminSkillMetricDto
            {
                Skill = kvp.Value,
                Hours = hours,
                AvgScore = avgScore
            });
        }

        // 5. Completion Rate: Lesson progress completed in the period
        var completedLessonsCount = await (
            from p in _dbContext.StudentLessonProgresses.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on p.UserId equals ur.UserId
            where ur.RoleId == studentRoleId && p.Status == "COMPLETED" && p.CompletedAt >= cutoffDate
            select p.Id
        ).CountAsync(cancellationToken);

        var activeLessonProgressCount = await (
            from p in _dbContext.StudentLessonProgresses.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on p.UserId equals ur.UserId
            where ur.RoleId == studentRoleId && (p.CompletedAt >= cutoffDate || p.CreatedAt >= cutoffDate)
            select p.Id
        ).CountAsync(cancellationToken);

        var completionRate = activeLessonProgressCount > 0
            ? Math.Round((double)completedLessonsCount / activeLessonProgressCount * 100, 1)
            : 0.0;

        // 6. Cohort Retention: Proportion of active students from the previous period who returned in the current period
        var previousStart = DateTime.UtcNow.AddDays(-periodDays * 2);
        var prevStartStr = previousStart.ToString("yyyy-MM-dd");

        var prevActiveLogins = await studentUsersQuery
            .Where(u => u.LastLoginAt >= previousStart && u.LastLoginAt < cutoffDate)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        var prevActiveDaily = await (
            from a in _dbContext.StudentDailyActivities.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on a.UserId equals ur.UserId
            where ur.RoleId == studentRoleId &&
                  ((!string.IsNullOrEmpty(a.ActivityDate) && string.Compare(a.ActivityDate, prevStartStr) >= 0 && string.Compare(a.ActivityDate, cutoffDateStr) < 0) ||
                   (string.IsNullOrEmpty(a.ActivityDate) && a.CreatedAt >= previousStart && a.CreatedAt < cutoffDate))
            select a.UserId
        ).ToListAsync(cancellationToken);

        var prevActiveAttempts = await (
            from pa in _dbContext.StudentPracticeAttempts.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on pa.UserId equals ur.UserId
            where ur.RoleId == studentRoleId && pa.AttemptedAt >= previousStart && pa.AttemptedAt < cutoffDate
            select pa.UserId
        ).ToListAsync(cancellationToken);

        var prevCohort = prevActiveLogins
            .Concat(prevActiveDaily)
            .Concat(prevActiveAttempts)
            .Distinct()
            .ToHashSet();

        var currActiveLogins = await studentUsersQuery
            .Where(u => u.LastLoginAt >= cutoffDate || u.CreatedAt >= cutoffDate)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        var currActiveDaily = await (
            from a in _dbContext.StudentDailyActivities.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on a.UserId equals ur.UserId
            where ur.RoleId == studentRoleId &&
                  ((!string.IsNullOrEmpty(a.ActivityDate) && string.Compare(a.ActivityDate, cutoffDateStr) >= 0) ||
                   (string.IsNullOrEmpty(a.ActivityDate) && a.CreatedAt >= cutoffDate))
            select a.UserId
        ).ToListAsync(cancellationToken);

        var currActiveAttempts = await (
            from pa in _dbContext.StudentPracticeAttempts.AsNoTracking()
            join ur in _dbContext.UserRoles.AsNoTracking() on pa.UserId equals ur.UserId
            where ur.RoleId == studentRoleId && pa.AttemptedAt >= cutoffDate
            select pa.UserId
        ).ToListAsync(cancellationToken);

        var currCohort = currActiveLogins
            .Concat(currActiveDaily)
            .Concat(currActiveAttempts)
            .Distinct()
            .ToHashSet();

        var retentionRate = prevCohort.Count > 0
            ? Math.Round((double)prevCohort.Count(id => currCohort.Contains(id)) / prevCohort.Count * 100, 1)
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

        if (dto.IsMaintenanceMode)
        {
            throw new InvalidOperationException("Chế độ bảo trì (IsMaintenanceMode) hiện chưa được hỗ trợ kích hoạt động từ giao diện web để đảm bảo an toàn vận hành hạ tầng.");
        }

        if (dto.MaxLoginAttempts != 5)
        {
            throw new InvalidOperationException("Số lần đăng nhập tối đa (MaxLoginAttempts) hiện đang được cố định ở mức 5 lần theo chính sách ASP.NET Core Identity và chưa hỗ trợ thay đổi động từ web.");
        }

        if (dto.SessionTimeoutMinutes != 60)
        {
            throw new InvalidOperationException("Thời gian phiên làm việc (SessionTimeoutMinutes) hiện đang được cố định ở mức 60 phút theo chính sách bảo mật JWT và chưa hỗ trợ thay đổi động từ web.");
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
