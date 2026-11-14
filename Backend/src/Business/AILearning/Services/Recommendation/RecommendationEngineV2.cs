using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning.Services.Recommendation;

public sealed class RecommendationEngineV2 : IRecommendationEngineV2
{
    private readonly ApplicationDbContext _dbContext;
    private readonly ICompetencyProfileService _competencyService;
    private readonly IAIProvider _aiProvider;
    private readonly IAIUsageLogger _usageLogger;
    private readonly ILogger<RecommendationEngineV2> _logger;

    public RecommendationEngineV2(
        ApplicationDbContext dbContext,
        ICompetencyProfileService competencyService,
        IAIProvider aiProvider,
        IAIUsageLogger usageLogger,
        ILogger<RecommendationEngineV2> logger)
    {
        _dbContext = dbContext;
        _competencyService = competencyService;
        _aiProvider = aiProvider;
        _usageLogger = usageLogger;
        _logger = logger;
    }

    public async Task<PersonalizedLearningPlanV2Dto> GetPlanV2Async(
        Guid userId,
        int? availableMinutes = null,
        bool explainWithAi = false,
        CancellationToken cancellationToken = default)
    {
        var now = DateTime.UtcNow;

        // 1. Fetch user learning profile & settings
        var profile = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var currentHsk = profile?.SelectedHskLevel is >= 1 and <= 6 ? profile.SelectedHskLevel : 1;
        var plannedMinutes = availableMinutes.HasValue && availableMinutes.Value > 0
            ? Math.Clamp(availableMinutes.Value, 5, 180)
            : (profile?.TargetDailyMinutes ?? 20);
        var streak = profile?.StreakDays ?? 0;

        // 2. Fetch competency profile (Deterministic, BKT)
        var competency = await _competencyService.GetCompetencyProfileAsync(userId, cancellationToken);

        // 3. Query real SRS due status
        var vocabStats = await _dbContext.StudentVocabularyProgresses
            .AsNoTracking()
            .Where(v => v.UserId == userId)
            .Select(v => new { v.Status, v.NextReviewAt })
            .ToListAsync(cancellationToken);

        var dueSrsCount = vocabStats.Count(v => v.NextReviewAt <= now);
        var masteredCount = vocabStats.Count(v => v.Status == "mastered");

        // 4. Query lesson progresses
        var lessonProgresses = await _dbContext.StudentLessonProgresses
            .AsNoTracking()
            .Where(l => l.UserId == userId)
            .Select(l => new { l.LessonId, l.Status, l.CurrentStepIndex, l.UpdatedAt })
            .ToListAsync(cancellationToken);

        var inProgressLesson = lessonProgresses
            .OrderByDescending(l => l.UpdatedAt)
            .FirstOrDefault(l => l.Status == "IN_PROGRESS");

        var completedLessonIds = lessonProgresses
            .Where(l => l.Status == "COMPLETED")
            .Select(l => l.LessonId)
            .ToHashSet();

        // 5. Query candidate lesson from current HSK level
        var nextLesson = await _dbContext.Lessons
            .AsNoTracking()
            .Include(l => l.Unit)
                .ThenInclude(u => u!.Course)
            .Where(l => l.Unit != null && l.Unit.Course != null && l.Unit.Course.HskLevel == currentHsk && !completedLessonIds.Contains(l.Id.ToString()))
            .OrderBy(l => l.OrderIndex)
            .Select(l => new { l.Id, Title = string.IsNullOrWhiteSpace(l.TitleVi) ? l.TitleZh : l.TitleVi, l.OrderIndex })
            .FirstOrDefaultAsync(cancellationToken);

        // 6. Generate Candidates with Multi-factor Utility Scoring
        var candidates = BuildScoredCandidates(
            currentHsk,
            plannedMinutes,
            competency,
            dueSrsCount,
            masteredCount,
            inProgressLesson?.LessonId,
            nextLesson?.Id.ToString(),
            nextLesson?.Title);

        // 7. Sort by Utility Score descending and assign priority ranks
        var orderedRecommendations = candidates
            .OrderByDescending(c => c.UtilityScore)
            .Select((item, index) =>
            {
                item.Priority = index + 1;
                return item;
            })
            .ToList();

        // 8. Optional LLM pedagogical coaching explanation
        string? aiExplanation = null;
        string? aiFocusTip = null;
        var usedLlm = false;

        if (explainWithAi && orderedRecommendations.Count > 0)
        {
            (aiExplanation, aiFocusTip, usedLlm) = await TryGenerateAiExplanationAsync(
                userId,
                currentHsk,
                plannedMinutes,
                dueSrsCount,
                competency,
                orderedRecommendations,
                cancellationToken);
        }

        return new PersonalizedLearningPlanV2Dto
        {
            UserId = userId,
            AssessmentStatus = competency.AssessmentStatus,
            CurrentHskLevel = competency.SelectedHskLevel,
            EstimatedHskLevel = competency.EstimatedHskLevel,
            AvailableMinutes = plannedMinutes,
            ConfidenceScore = competency.ConfidenceScore,
            OverallMasteryPercent = competency.OverallMasteryPercent,
            DueSrsCount = dueSrsCount,
            MasteredWordsCount = masteredCount,
            InProgressLessonId = inProgressLesson?.LessonId,
            StreakDays = streak,
            Recommendations = orderedRecommendations,
            AiCoachingExplanationVi = aiExplanation,
            AiFocusTipVi = aiFocusTip,
            UsedLlmExplanation = usedLlm,
            GeneratedAt = now
        };
    }

    public static List<RecommendationItemV2Dto> BuildScoredCandidates(
        int currentHsk,
        int plannedMinutes,
        CompetencyProfileDto competency,
        int dueSrsCount,
        int masteredCount,
        string? inProgressLessonId,
        string? nextLessonId,
        string? nextLessonTitle)
    {
        var items = new List<RecommendationItemV2Dto>();

        // Candidate 1: SRS Due Reviews
        if (dueSrsCount > 0)
        {
            var estimatedTime = Math.Clamp((int)Math.Ceiling(dueSrsCount * 0.5), 3, 15);
            var utility = Math.Clamp(0.75 + Math.Min(0.20, dueSrsCount * 0.02), 0.75, 0.95);
            items.Add(new RecommendationItemV2Dto
            {
                Id = "rec-srs-due",
                Category = "srs-due",
                Title = $"Ôn tập {dueSrsCount} từ vựng SRS đến hạn",
                UtilityScore = Math.Round(utility, 3),
                Reason = $"Hệ thống phát hiện {dueSrsCount} từ vựng đã chạm ngưỡng quên theo chu kỳ lặp lại ngắt quãng SuperMemo SM-2.",
                PedagogicalGoalVi = "Khôi phục trí nhớ dài hạn và độ vững chắc của vốn từ trước khi nạp thêm kiến thức mới.",
                EvidenceData = new Dictionary<string, object>
                {
                    { "dueCount", dueSrsCount },
                    { "masteredWords", masteredCount },
                    { "algorithm", "SuperMemo SM-2" }
                },
                EstimatedMinutes = estimatedTime,
                DestinationRoute = "/srs-review",
                Badge = $"{dueSrsCount} từ",
                ActionLabel = "Ôn tập SRS ngay"
            });
        }

        // Candidate 2: Top Weak Concept Remediation
        var topWeak = competency.TopWeakConcepts.FirstOrDefault();
        if (topWeak != null)
        {
            var deficit = Math.Clamp(1.0 - topWeak.MasteryScore, 0.2, 0.9);
            var utility = Math.Clamp(0.55 + (deficit * 0.33), 0.55, 0.88);
            var estimatedTime = Math.Min(12, Math.Max(5, plannedMinutes / 2));

            items.Add(new RecommendationItemV2Dto
            {
                Id = $"rec-weak-{topWeak.ConceptCode}",
                Category = "weak-skill",
                Title = $"Củng cố điểm yếu: {topWeak.TitleVi}",
                UtilityScore = Math.Round(utility, 3),
                Reason = $"Độ thành thạo ước tính hiện tại là {Math.Round(topWeak.MasteryScore * 100, 1)}% với {topWeak.IncorrectAttempts} lần làm bài chưa chính xác.",
                PedagogicalGoalVi = "Lấp lỗ hổng kiến thức ngữ pháp/từ vựng thông qua bài tập thực hành thích ứng có hỗ trợ giải thích sư phạm.",
                EvidenceData = new Dictionary<string, object>
                {
                    { "conceptCode", topWeak.ConceptCode },
                    { "masteryPercent", Math.Round(topWeak.MasteryScore * 100, 1) },
                    { "incorrectAttempts", topWeak.IncorrectAttempts },
                    { "skillCategory", topWeak.SkillCategory }
                },
                EstimatedMinutes = estimatedTime,
                DestinationRoute = topWeak.RecommendedActionRoute,
                Badge = $"{topWeak.MasteryTier}",
                ActionLabel = "Tạo bài tập AI củng cố"
            });
        }

        // Candidate 3: Resume In-Progress Lesson
        if (!string.IsNullOrWhiteSpace(inProgressLessonId))
        {
            items.Add(new RecommendationItemV2Dto
            {
                Id = $"rec-resume-{inProgressLessonId}",
                Category = "resume-lesson",
                Title = "Hoàn thành bài học đang dang dở",
                UtilityScore = 0.74,
                Reason = "Học viên đang có bài học dở dang. Tiếp tục ngay giúp duy trì mạch hiểu bài và ghi nhớ ngữ cảnh đối thoại.",
                PedagogicalGoalVi = "Hoàn tất các bước đối thoại, ngữ pháp và bài tập trắc nghiệm cuối bài để ghi nhận tiến độ HSK.",
                EvidenceData = new Dictionary<string, object>
                {
                    { "lessonId", inProgressLessonId },
                    { "status", "IN_PROGRESS" }
                },
                EstimatedMinutes = Math.Min(15, plannedMinutes),
                DestinationRoute = $"/lesson/{Uri.EscapeDataString(inProgressLessonId)}",
                Badge = $"HSK {currentHsk}",
                ActionLabel = "Học tiếp bài hiện tại"
            });
        }

        // Candidate 4: Next Lesson in Curriculum
        if (string.IsNullOrWhiteSpace(inProgressLessonId) && !string.IsNullOrWhiteSpace(nextLessonId))
        {
            var title = string.IsNullOrWhiteSpace(nextLessonTitle) ? "Bài học tiếp theo" : nextLessonTitle;
            items.Add(new RecommendationItemV2Dto
            {
                Id = $"rec-next-{nextLessonId}",
                Category = "next-lesson",
                Title = $"Học bài mới: {title}",
                UtilityScore = 0.68,
                Reason = $"Bài học kế tiếp theo khung đào tạo HSK {currentHsk} chuẩn quốc tế.",
                PedagogicalGoalVi = "Tiếp thu vốn từ mới và điểm ngữ pháp tiếp theo trong chương trình.",
                EvidenceData = new Dictionary<string, object>
                {
                    { "lessonId", nextLessonId },
                    { "hskLevel", currentHsk }
                },
                EstimatedMinutes = Math.Min(20, plannedMinutes),
                DestinationRoute = $"/lesson/{Uri.EscapeDataString(nextLessonId)}",
                Badge = $"HSK {currentHsk}",
                ActionLabel = "Bắt đầu bài mới"
            });
        }

        // Candidate 6: AI Conversation Room Practice
        items.Add(new RecommendationItemV2Dto
        {
            Id = $"rec-ai-convo-{currentHsk}",
            Category = "ai-conversation",
            Title = $"Luyện phản xạ hội thoại tình huống HSK {currentHsk}",
            UtilityScore = 0.62,
            Reason = $"Thực hành giao tiếp tiếng Trung theo các chủ đề thực tế phù hợp cấp độ HSK {currentHsk}.",
            PedagogicalGoalVi = "Vận dụng câu chữ vào đàm thoại thực tế với AI Tutor có sửa lỗi ngữ pháp và gợi ý câu tự nhiên.",
            EvidenceData = new Dictionary<string, object>
            {
                { "hskLevel", currentHsk },
                { "targetSkills", new[] { "listening", "speaking", "grammar" } }
            },
            EstimatedMinutes = Math.Min(10, plannedMinutes),
            DestinationRoute = "/conversation",
            Badge = "Hội thoại",
            ActionLabel = "Vào phòng hội thoại"
        });

        return items;
    }

    private async Task<(string? Explanation, string? Tip, bool UsedLlm)> TryGenerateAiExplanationAsync(
        Guid userId,
        int hskLevel,
        int availableMinutes,
        int dueSrsCount,
        CompetencyProfileDto competency,
        List<RecommendationItemV2Dto> recommendations,
        CancellationToken cancellationToken)
    {
        try
        {
            await _usageLogger.EnsureWithinDailyBudgetAsync(userId, cancellationToken);

            var summary = string.Join("; ", recommendations.Take(3).Select(r => $"{r.Title} ({r.Reason})"));
            var res = await _aiProvider.GenerateContentAsync(
                new AIProviderRequest
                {
                    Feature = "AI_LEARNING_EXPLAIN",
                    SystemInstruction = "Bạn là chuyên gia cố vấn học tiếng Trung tại ZhongWenHub. Trả về đúng định dạng JSON: {\"explanationVi\":\"...\",\"focusTipVi\":\"...\"}. Lời khuyên ngắn gọn, thân thiện, dựa trên số liệu thực tế được cung cấp.",
                    UserPrompt = $"Học viên HSK {hskLevel}. Thời gian rảnh hôm nay: {availableMinutes} phút. Từ vựng SRS đến hạn: {dueSrsCount}. Điểm thành thạo chung: {competency.OverallMasteryPercent}%. Trạng thái: {competency.AssessmentStatus}. Top đề xuất: {summary}",
                    ExpectJson = true,
                    Temperature = 0.3,
                    MaxOutputTokens = 450
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
            _logger.LogWarning(ex, "Failed to generate LLM explanation for recommendation V2; falling back to deterministic plan.");
            return (null, null, false);
        }
    }
}

