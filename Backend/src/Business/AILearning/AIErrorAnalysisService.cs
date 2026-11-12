using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning;

public interface IAIErrorAnalysisService
{
    Task<ErrorAnalysisReportDto> GetErrorAnalysisAsync(Guid userId, CancellationToken cancellationToken = default);
    Task RecomputeAndPersistSkillStatsAsync(Guid userId, CancellationToken cancellationToken = default);
}

public sealed class AIErrorAnalysisService : IAIErrorAnalysisService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private static readonly (string Key, string Label)[] SkillDefinitions =
    {
        ("vocabulary", "Từ vựng (Vocabulary)"),
        ("grammar", "Ngữ pháp (Grammar)"),
        ("hanzi", "Nhận diện Hanzi"),
        ("pinyin", "Pinyin & Thanh điệu văn bản"),
        ("reading", "Đọc hiểu (Reading)"),
        ("listening", "Nghe hiểu (Listening)")
    };

    private readonly ApplicationDbContext _dbContext;

    public AIErrorAnalysisService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<ErrorAnalysisReportDto> GetErrorAnalysisAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var practiceAttempts = await _dbContext.StudentPracticeAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => new AttemptPoint(
                NormalizeSkill(a.Category),
                string.IsNullOrWhiteSpace(a.TopicTitle) ? a.KnowledgePointId : a.TopicTitle,
                a.HskLevel,
                a.IsCorrect))
            .ToListAsync(cancellationToken);

        var aiAttempts = await _dbContext.AiExerciseAttempts
            .AsNoTracking()
            .Include(a => a.AiExercise)
            .Where(a => a.UserId == userId)
            .Select(a => new AttemptPoint(
                NormalizeSkill(a.SkillCategory),
                a.AiExercise != null ? $"{a.AiExercise.SourceType} HSK {a.AiExercise.HskLevel}" : "Bài tập AI",
                a.AiExercise != null ? a.AiExercise.HskLevel : 1,
                a.IsCorrect))
            .ToListAsync(cancellationToken);

        var allAttempts = practiceAttempts.Concat(aiAttempts).ToList();
        var skills = BuildSkillStats(allAttempts);
        var weakPoints = BuildWeakPoints(allAttempts);

        await UpsertSkillStatsAsync(userId, skills, cancellationToken);

        var total = allAttempts.Count;
        var correct = allAttempts.Count(a => a.IsCorrect);
        var overallAccuracy = total > 0 ? Math.Round(correct * 100.0 / total, 1) : 0;

        return new ErrorAnalysisReportDto
        {
            TotalAttemptsAnalyzed = total,
            OverallAccuracyPercent = overallAccuracy,
            HasAudioEvaluation = false,
            AudioEvaluationNote = "Chưa có dữ liệu âm thanh được chấm điểm; hệ thống không suy đoán lỗi phát âm.",
            Skills = skills,
            WeakPoints = weakPoints,
            GeneratedAt = DateTime.UtcNow
        };
    }

    public async Task RecomputeAndPersistSkillStatsAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        _ = await GetErrorAnalysisAsync(userId, cancellationToken);
    }

    private async Task UpsertSkillStatsAsync(
        Guid userId,
        List<SkillStatisticDto> skills,
        CancellationToken cancellationToken)
    {
        var existing = await _dbContext.LearningSkillStatistics
            .Where(s => s.UserId == userId)
            .ToListAsync(cancellationToken);

        var now = DateTime.UtcNow;
        foreach (var skill in skills)
        {
            var entity = existing.FirstOrDefault(e => e.SkillCategory == skill.SkillCategory);
            if (entity is null)
            {
                entity = new LearningSkillStatistic
                {
                    UserId = userId,
                    SkillCategory = skill.SkillCategory
                };
                _dbContext.LearningSkillStatistics.Add(entity);
            }

            entity.TotalAttempts = skill.TotalAttempts;
            entity.CorrectAttempts = skill.CorrectAttempts;
            entity.IncorrectAttempts = skill.IncorrectAttempts;
            entity.AccuracyPercent = skill.AccuracyPercent;
            entity.WeakTopicsJson = JsonSerializer.Serialize(skill.WeakTopics, JsonOptions);
            entity.LastAssessedAt = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
    }

    public static List<SkillStatisticDto> BuildSkillStats(IReadOnlyList<AttemptPoint> attempts)
    {
        var results = new List<SkillStatisticDto>();
        foreach (var (key, label) in SkillDefinitions)
        {
            var matched = attempts.Where(a => a.SkillCategory == key).ToList();
            var total = matched.Count;
            var correct = matched.Count(m => m.IsCorrect);
            var incorrect = total - correct;
            var accuracy = total > 0 ? Math.Round(correct * 100.0 / total, 1) : 0;

            var weakTopics = matched
                .Where(m => !m.IsCorrect && !string.IsNullOrWhiteSpace(m.TopicTitle))
                .GroupBy(m => m.TopicTitle)
                .OrderByDescending(g => g.Count())
                .Take(3)
                .Select(g => g.Key)
                .ToList();

            results.Add(new SkillStatisticDto
            {
                SkillCategory = key,
                LabelVi = label,
                TotalAttempts = total,
                CorrectAttempts = correct,
                IncorrectAttempts = incorrect,
                AccuracyPercent = accuracy,
                HasData = total > 0,
                WeakTopics = weakTopics
            });
        }

        return results;
    }

    public static List<ErrorAnalysisWeakPointDto> BuildWeakPoints(IReadOnlyList<AttemptPoint> attempts)
    {
        return attempts
            .GroupBy(a => new { a.TopicTitle, a.SkillCategory, a.HskLevel })
            .Select(g =>
            {
                var total = g.Count();
                var correct = g.Count(x => x.IsCorrect);
                var incorrect = total - correct;
                var accuracy = Math.Round(correct * 100.0 / total, 1);
                return new
                {
                    g.Key.TopicTitle,
                    g.Key.SkillCategory,
                    g.Key.HskLevel,
                    Total = total,
                    Incorrect = incorrect,
                    Accuracy = accuracy
                };
            })
            .Where(x => x.Incorrect > 0 && (x.Accuracy < 75 || x.Incorrect >= 2))
            .OrderByDescending(x => x.Incorrect)
            .ThenBy(x => x.Accuracy)
            .Take(6)
            .Select(x => new ErrorAnalysisWeakPointDto
            {
                TopicTitle = string.IsNullOrWhiteSpace(x.TopicTitle) ? "Kiến thức tổng hợp" : x.TopicTitle,
                SkillCategory = x.SkillCategory,
                HskLevel = x.HskLevel,
                TotalAttempts = x.Total,
                IncorrectAttempts = x.Incorrect,
                AccuracyPercent = x.Accuracy,
                EvidenceVi = $"Sai {x.Incorrect}/{x.Total} lần làm (độ chính xác {x.Accuracy}%).",
                SuggestedActionRoute = "/ai-exercises"
            })
            .ToList();
    }

    public static string NormalizeSkill(string? category)
    {
        var c = (category ?? string.Empty).Trim().ToLowerInvariant();
        return c switch
        {
            "vocabulary" or "vocab" => "vocabulary",
            "grammar" or "sentence" => "grammar",
            "hanzi" or "character" or "writing" => "hanzi",
            "pinyin" or "tone" => "pinyin",
            "reading" => "reading",
            "listening" => "listening",
            _ => "grammar"
        };
    }

    public sealed record AttemptPoint(string SkillCategory, string TopicTitle, int HskLevel, bool IsCorrect);
}
