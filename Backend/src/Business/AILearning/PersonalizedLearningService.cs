using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning;

public interface IPersonalizedLearningService
{
    Task<PersonalizedLearningPlanDto> GetPersonalizedPlanAsync(Guid userId, bool explainWithAi = false, CancellationToken cancellationToken = default);
}

public sealed class PersonalizedLearningService : IPersonalizedLearningService
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IAIErrorAnalysisService _errorAnalysisService;
    private readonly IAIProvider _aiProvider;
    private readonly IAIUsageLogger _usageLogger;
    private readonly ILogger<PersonalizedLearningService> _logger;

    public PersonalizedLearningService(
        ApplicationDbContext dbContext,
        IAIErrorAnalysisService errorAnalysisService,
        IAIProvider aiProvider,
        IAIUsageLogger usageLogger,
        ILogger<PersonalizedLearningService> logger)
    {
        _dbContext = dbContext;
        _errorAnalysisService = errorAnalysisService;
        _aiProvider = aiProvider;
        _usageLogger = usageLogger;
        _logger = logger;
    }

    public async Task<PersonalizedLearningPlanDto> GetPersonalizedPlanAsync(
        Guid userId,
        bool explainWithAi = false,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;
        var profile = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var currentHsk = profile?.SelectedHskLevel is >= 1 and <= 4 ? profile.SelectedHskLevel : 1;
        var dailyGoal = profile?.TargetDailyMinutes ?? 15;
        var streakDays = profile?.StreakDays ?? 0;

        var vocabStates = await _dbContext.StudentVocabularyProgresses
            .AsNoTracking()
            .Where(v => v.UserId == userId)
            .Select(v => new { v.Status, v.NextReviewAt })
            .ToListAsync(cancellationToken);

        var dueSrsCount = vocabStates.Count(v => v.NextReviewAt <= now);
        var masteredWordsCount = vocabStates.Count(v => v.Status == "mastered");

        var lessonProgresses = await _dbContext.StudentLessonProgresses
            .AsNoTracking()
            .Where(l => l.UserId == userId)
            .Select(l => new { l.LessonId, l.Status, l.CurrentStepIndex })
            .ToListAsync(cancellationToken);

        var completedLessonsCount = lessonProgresses.Count(l => l.Status == "COMPLETED");
        var inProgressLesson = lessonProgresses.FirstOrDefault(l => l.Status == "IN_PROGRESS");

        var sevenDaysAgo = now.Date.AddDays(-6).ToString("yyyy-MM-dd");
        var recentActivities = await _dbContext.StudentDailyActivities
            .AsNoTracking()
            .Where(a => a.UserId == userId && string.Compare(a.ActivityDate, sevenDaysAgo) >= 0)
            .Select(a => new { a.Minutes })
            .ToListAsync(cancellationToken);

        var totalMinutes7d = recentActivities.Sum(a => a.Minutes);
        var activeDays7d = recentActivities.Count(a => a.Minutes > 0);

        var errorReport = await _errorAnalysisService.GetErrorAnalysisAsync(userId, cancellationToken);
        var recommendations = BuildRuleBasedRecommendations(
            currentHsk,
            dueSrsCount,
            inProgressLesson?.LessonId,
            errorReport);

        string? aiExplanation = null;
        string? aiFocusTip = null;
        var usedLlm = false;

        if (explainWithAi)
        {
            (aiExplanation, aiFocusTip, usedLlm) = await TryGenerateAiExplanationAsync(
                userId,
                currentHsk,
                dueSrsCount,
                errorReport.OverallAccuracyPercent,
                recommendations,
                cancellationToken);
        }

        return new PersonalizedLearningPlanDto
        {
            CurrentHskLevel = currentHsk,
            DailyGoalMinutes = dailyGoal,
            StreakDays = streakDays,
            DueSrsWordsCount = dueSrsCount,
            MasteredWordsCount = masteredWordsCount,
            CompletedLessonsCount = completedLessonsCount,
            TotalStudyMinutesLast7Days = totalMinutes7d,
            ActiveDaysLast7Days = activeDays7d,
            OverallAccuracyPercent = errorReport.OverallAccuracyPercent,
            Recommendations = recommendations,
            AiCoachingExplanationVi = aiExplanation,
            AiFocusTipVi = aiFocusTip,
            UsedLlmExplanation = usedLlm,
            GeneratedAt = now
        };
    }

    public static List<LearningRecommendationItemDto> BuildRuleBasedRecommendations(
        int currentHsk,
        int dueSrsCount,
        string? inProgressLessonId,
        ErrorAnalysisReportDto errorReport)
    {
        var items = new List<LearningRecommendationItemDto>();

        if (dueSrsCount > 0)
        {
            items.Add(new LearningRecommendationItemDto
            {
                Id = "plan-srs-due",
                Priority = 1,
                Category = "srs-due",
                Title = $"Ôn tập {dueSrsCount} từ vựng SRS đến hạn",
                Reason = "Từ vựng sắp chạm ngưỡng quên theo thuật toán lặp lại ngắt quãng (SRS).",
                ActionLabel = "Ôn tập SRS ngay",
                DestinationRoute = "/srs-review",
                Badge = $"{dueSrsCount} từ"
            });
        }

        var topWeak = errorReport.WeakPoints.FirstOrDefault();
        if (topWeak is not null)
        {
            items.Add(new LearningRecommendationItemDto
            {
                Id = "plan-weak-skill",
                Priority = 2,
                Category = "weak-skill",
                Title = $"Củng cố điểm yếu: {topWeak.TopicTitle}",
                Reason = topWeak.EvidenceVi,
                ActionLabel = "Tạo bài tập AI củng cố",
                DestinationRoute = $"/ai-exercises?hsk={topWeak.HskLevel}&source=WEAKNESS",
                Badge = $"{topWeak.AccuracyPercent}%"
            });
        }

        if (!string.IsNullOrWhiteSpace(inProgressLessonId))
        {
            items.Add(new LearningRecommendationItemDto
            {
                Id = "plan-resume-lesson",
                Priority = 3,
                Category = "resume-lesson",
                Title = "Hoàn thành bài học đang dang dở",
                Reason = "Duy trì mạch kiến thức giúp tăng khả năng ghi nhớ ngữ pháp HSK.",
                ActionLabel = "Học tiếp bài hiện tại",
                DestinationRoute = $"/lesson?id={Uri.EscapeDataString(inProgressLessonId)}",
                Badge = $"HSK {currentHsk}"
            });
        }

        items.Add(new LearningRecommendationItemDto
        {
            Id = "plan-ai-conversation",
            Priority = 4,
            Category = "ai-conversation",
            Title = $"Luyện hội thoại tình huống HSK {currentHsk}",
            Reason = "Thực hành phản xạ câu tiếng Trung theo đúng trình độ hiện tại.",
            ActionLabel = "Mở phòng hội thoại AI",
            DestinationRoute = "/conversation",
            Badge = $"HSK {currentHsk}"
        });

        return items.OrderBy(i => i.Priority).ToList();
    }

    private async Task<(string? Explanation, string? Tip, bool UsedLlm)> TryGenerateAiExplanationAsync(
        Guid userId,
        int hskLevel,
        int dueSrsCount,
        double accuracy,
        List<LearningRecommendationItemDto> recommendations,
        CancellationToken cancellationToken)
    {
        try
        {
            await _usageLogger.EnsureWithinDailyBudgetAsync(userId, cancellationToken);
            var summary = string.Join("; ", recommendations.Select(r => $"{r.Title} ({r.Reason})"));
            var res = await _aiProvider.GenerateContentAsync(
                new AIProviderRequest
                {
                    Feature = "AI_LEARNING_EXPLAIN",
                    SystemInstruction = "Bạn là cố vấn học tập tiếng Trung. Trả về JSON {\"explanationVi\":\"...\",\"focusTipVi\":\"...\"} ngắn gọn dựa trên số liệu thật.",
                    UserPrompt = $"HSK hiện tại: {hskLevel}, Từ SRS đến hạn: {dueSrsCount}, Độ chính xác tổng: {accuracy}%. Đề xuất: {summary}",
                    ExpectJson = true,
                    Temperature = 0.3,
                    MaxOutputTokens = 400
                },
                cancellationToken);

            await _usageLogger.LogAsync(userId, "AI_LEARNING_EXPLAIN", res, true, null, cancellationToken);

            using var doc = JsonDocument.Parse(res.RawText);
            var exp = doc.RootElement.TryGetProperty("explanationVi", out var e) ? e.GetString() : null;
            var tip = doc.RootElement.TryGetProperty("focusTipVi", out var t) ? t.GetString() : null;
            return (exp, tip, true);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not generate optional AI coaching explanation; returning deterministic plan.");
            return (null, null, false);
        }
    }
}
