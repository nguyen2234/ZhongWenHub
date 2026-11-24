using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Features.AI.DTOs;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Features.AI.Services.Competency;

public sealed class CompetencyProfileService : ICompetencyProfileService
{
    private const int MaxAttemptsWindow = 200;

    private static readonly (string Key, string Label)[] MacroSkills =
    {
        ("vocabulary", "Từ vựng (Vocabulary)"),
        ("grammar", "Ngữ pháp (Grammar)"),
        ("hanzi", "Nhận diện & Viết chữ Hán (Hanzi)"),
        ("pinyin", "Phiên âm & Thanh điệu (Pinyin)")
    };

    private readonly ApplicationDbContext _dbContext;

    public CompetencyProfileService(ApplicationDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CompetencyProfileDto> GetCompetencyProfileAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var profile = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var selectedHsk = profile?.SelectedHskLevel is >= 1 and <= 6 ? profile.SelectedHskLevel : 1;

        // Fetch recent practice attempts with window cap to prevent unbounded query load
        // Exclude legacy or direct-text speaking attempts from StudentPracticeAttempts; speaking is strictly loaded from valid audio speaking attempts
        var practiceAttempts = await _dbContext.StudentPracticeAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId && !a.ExerciseId.StartsWith("ai_") && a.Category != "speaking")
            .OrderByDescending(a => a.AttemptedAt)
            .Take(MaxAttemptsWindow)
            .Select(a => new AttemptRecord(
                NormalizeSkill(a.Category),
                string.IsNullOrWhiteSpace(a.TopicTitle) ? (a.KnowledgePointId ?? "Kiến thức tổng hợp") : a.TopicTitle,
                a.HskLevel,
                a.IsCorrect,
                a.AttemptedAt))
            .ToListAsync(cancellationToken);

        // Fetch recent AI-generated exercise attempts with window cap
        var aiAttempts = await _dbContext.AiExerciseAttempts
            .AsNoTracking()
            .Include(a => a.AiExercise)
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.AttemptedAt)
            .Take(MaxAttemptsWindow)
            .Select(a => new AttemptRecord(
                NormalizeSkill(a.SkillCategory),
                a.AiExercise != null ? $"{a.AiExercise.SourceType} HSK {a.AiExercise.HskLevel}" : "Bài tập AI",
                a.AiExercise != null ? a.AiExercise.HskLevel : selectedHsk,
                a.IsCorrect,
                a.AttemptedAt))
            .ToListAsync(cancellationToken);



        // Fetch Vocabulary SRS summary with SQL Server aggregation (no entity materialization)
        var vocabStats = await _dbContext.StudentVocabularyProgresses
            .AsNoTracking()
            .Where(v => v.UserId == userId)
            .GroupBy(v => v.UserId)
            .Select(g => new
            {
                Total = g.Count(),
                Mastered = g.Count(x => x.Status == "mastered"),
                Learning = g.Count(x => x.Status == "learning")
            })
            .FirstOrDefaultAsync(cancellationToken);

        // Reverse to ascending chronological order for BKT sequence processing
        var allAttempts = practiceAttempts
            .Concat(aiAttempts)
            .Where(a => a.SkillCategory != "legacy_retired")
            .OrderBy(a => a.AttemptedAt)
            .ToList();

        var totalEvals = allAttempts.Count;
        var unclassifiedCount = allAttempts.Count(a => a.SkillCategory.StartsWith("unclassified", StringComparison.OrdinalIgnoreCase));

        // Process Macro Skills
        var skillDtos = new List<SkillCompetencyDto>();
        var measuredMasteries = new List<double>();
        var measuredConfidences = new List<double>();

        foreach (var (key, label) in MacroSkills)
        {
            var attemptsForSkill = allAttempts.Where(a => a.SkillCategory == key).ToList();
            var count = attemptsForSkill.Count;



            if (count == 0)
            {
                // Special boost for vocabulary if SRS reviews exist without explicit practice attempts
                if (key == "vocabulary" && vocabStats != null && vocabStats.Total > 0)
                {
                    var totalVocab = vocabStats.Total;
                    var masteredCount = vocabStats.Mastered;
                    var learningCount = vocabStats.Learning;
                    var srsMastery = Math.Clamp(((masteredCount * 1.0) + (learningCount * 0.5)) / Math.Max(10, totalVocab), 0.1, 0.95);
                    var srsConf = BktAlgorithm.ComputeConfidence(totalVocab);
                    var srsTier = BktAlgorithm.ResolveMasteryTier(srsMastery, totalVocab, srsConf);

                    skillDtos.Add(new SkillCompetencyDto
                    {
                        SkillCategory = key,
                        LabelVi = label,
                        TotalAttempts = totalVocab,
                        CorrectAttempts = masteredCount,
                        AccuracyPercent = Math.Round(srsMastery * 100.0, 1),
                        MasteryScore = Math.Round(srsMastery, 3),
                        MasteryPercent = Math.Round(srsMastery * 100.0, 1),
                        ConfidenceScore = srsConf,
                        MasteryTier = srsTier,
                        IsMeasuredRealData = true,
                        WeakTopics = new List<string>()
                    });

                    measuredMasteries.Add(srsMastery);
                    measuredConfidences.Add(srsConf);
                    continue;
                }

                skillDtos.Add(new SkillCompetencyDto
                {
                    SkillCategory = key,
                    LabelVi = label,
                    TotalAttempts = 0,
                    CorrectAttempts = 0,
                    AccuracyPercent = 0.0,
                    MasteryScore = 0.0,
                    MasteryPercent = 0.0,
                    ConfidenceScore = 0.0,
                    MasteryTier = "NOT_ASSESSED",
                    IsMeasuredRealData = true,
                    WeakTopics = new List<string>()
                });
                continue;
            }

            var correct = attemptsForSkill.Count(a => a.IsCorrect);
            var accuracy = Math.Round(correct * 100.0 / count, 1);
            var observations = attemptsForSkill.Select(a => a.IsCorrect);
            var pL = BktAlgorithm.ComputeSequence(observations);
            var conf = BktAlgorithm.ComputeConfidence(count);
            var tier = BktAlgorithm.ResolveMasteryTier(pL, count, conf);

            var weakTopics = attemptsForSkill
                .Where(a => !a.IsCorrect && !string.IsNullOrWhiteSpace(a.TopicTitle))
                .GroupBy(a => a.TopicTitle)
                .OrderByDescending(g => g.Count())
                .Take(3)
                .Select(g => g.Key)
                .ToList();

            skillDtos.Add(new SkillCompetencyDto
            {
                SkillCategory = key,
                LabelVi = label,
                TotalAttempts = count,
                CorrectAttempts = correct,
                AccuracyPercent = accuracy,
                MasteryScore = Math.Round(pL, 3),
                MasteryPercent = Math.Round(pL * 100.0, 1),
                ConfidenceScore = conf,
                MasteryTier = tier,
                IsMeasuredRealData = true,
                WeakTopics = weakTopics
            });

            measuredMasteries.Add(pL);
            measuredConfidences.Add(conf);
        }

        // Aggregate Overall Stats
        var overallMastery = measuredMasteries.Count > 0
            ? Math.Round(measuredMasteries.Average() * 100.0, 1)
            : 0.0;

        var overallConfidence = measuredConfidences.Count > 0
            ? Math.Round(measuredConfidences.Average(), 3)
            : 0.0;

        var assessmentStatus = "NOT_ASSESSED";
        if (totalEvals >= 15 && overallConfidence >= 0.70)
        {
            assessmentStatus = "CALIBRATED";
        }
        else if (totalEvals >= 5)
        {
            assessmentStatus = "ASSESSED";
        }
        else if (totalEvals > 0)
        {
            assessmentStatus = "IN_PROGRESS";
        }

        // Extract Top Weak Concepts with unique and stable ConceptCode
        var weakConcepts = allAttempts
            .Where(a => !string.IsNullOrWhiteSpace(a.TopicTitle) && !a.SkillCategory.StartsWith("unclassified"))
            .GroupBy(a => new { a.TopicTitle, a.SkillCategory, a.HskLevel })
            .Select(g =>
            {
                var total = g.Count();
                var incorrect = g.Count(x => !x.IsCorrect);
                var observations = g.OrderBy(x => x.AttemptedAt).Select(x => x.IsCorrect);
                var bkt = BktAlgorithm.ComputeSequence(observations);
                var conf = BktAlgorithm.ComputeConfidence(total);
                var tier = BktAlgorithm.ResolveMasteryTier(bkt, total, conf);
                return new
                {
                    g.Key.TopicTitle,
                    g.Key.SkillCategory,
                    g.Key.HskLevel,
                    Total = total,
                    Incorrect = incorrect,
                    MasteryScore = bkt,
                    Tier = tier
                };
            })
            .Where(x => x.Incorrect > 0 && (x.MasteryScore < 0.65 || x.Incorrect >= 2))
            .OrderByDescending(x => x.Incorrect)
            .ThenBy(x => x.MasteryScore)
            .Take(5)
            .Select(x => new WeakConceptDto
            {
                ConceptCode = GenerateConceptCode(x.HskLevel, x.SkillCategory, x.TopicTitle),
                TitleVi = x.TopicTitle,
                SkillCategory = x.SkillCategory,
                HskLevel = x.HskLevel,
                MasteryScore = Math.Round(x.MasteryScore, 3),
                MasteryTier = x.Tier,
                TotalAttempts = x.Total,
                IncorrectAttempts = x.Incorrect,
                EvidenceVi = $"Sai {x.Incorrect}/{x.Total} lần làm bài (Độ thành thạo ước tính: {Math.Round(x.MasteryScore * 100, 1)}%).",
                RecommendedActionRoute = $"/ai-exercises?hsk={x.HskLevel}&source=WEAKNESS"
            })
            .ToList();

        // Extract Top Strengths
        var topStrengths = skillDtos
            .Where(s => s.IsMeasuredRealData && s.MasteryPercent >= 80.0 && s.TotalAttempts >= 3)
            .Select(s => s.LabelVi)
            .ToList();

        // Estimated HSK Level:
        // Do NOT automatically increment or decrement purely by average score and attempt count.
        // If unassessed or evidence across levels is insufficient, keep EstimatedHskLevel as null.
        int? estimatedHsk = null;
        if (assessmentStatus is "ASSESSED" or "CALIBRATED")
        {
            // Verify if student has evaluated attempts for their selected HSK level
            var attemptsAtSelectedHsk = allAttempts.Where(a => a.HskLevel == selectedHsk).ToList();
            if (attemptsAtSelectedHsk.Count >= 10)
            {
                var accuracyAtLevel = attemptsAtSelectedHsk.Count(a => a.IsCorrect) * 1.0 / attemptsAtSelectedHsk.Count;
                if (accuracyAtLevel >= 0.70 && overallConfidence >= 0.60)
                {
                    estimatedHsk = selectedHsk;
                }
            }
        }

        return new CompetencyProfileDto
        {
            UserId = userId,
            AssessmentStatus = assessmentStatus,
            SelectedHskLevel = selectedHsk,
            EstimatedHskLevel = estimatedHsk,
            ConfidenceScore = overallConfidence,
            OverallMasteryPercent = overallMastery,
            TotalEvaluations = totalEvals,
            UnclassifiedEvaluationsCount = unclassifiedCount,
            HasSpeakingAudioData = false,
            SpeakingAudioNote = "Các module năng lực độc lập (Nghe, Nói, Đọc, Viết) đã ngừng hoạt động theo phạm vi thu hồi.",
            MacroSkills = skillDtos,
            TopWeakConcepts = weakConcepts.Where(c => c.SkillCategory != "legacy_retired").ToList(),
            TopStrengths = topStrengths,
            LastAssessedAt = DateTime.UtcNow
        };
    }

    /// <summary>
    /// Normalizes raw skill category strings without conflating distinct skills or coercing unknowns.
    /// Pinyin and tone are preserved as "pinyin" (distinct from "hanzi").
    /// Unknown values remain traceable as "unclassified:{category}".
    /// </summary>
    public static string NormalizeSkill(string? category)
    {
        if (string.IsNullOrWhiteSpace(category)) return "unclassified";
        var c = category.Trim().ToLowerInvariant();
        return c switch
        {
            "vocabulary" or "vocab" => "vocabulary",
            "grammar" or "sentence" => "grammar",
            "reading" or "listening" or "speaking" or "writing" => "legacy_retired",
            "hanzi" or "character" => "hanzi",
            "pinyin" or "tone" or "phonetics" => "pinyin",
            _ => $"unclassified:{c}"
        };
    }

    /// <summary>
    /// Generates a unique, stable, deterministic ConceptCode per knowledge point.
    /// Prevents collisions among different topics sharing the same skill and HSK level.
    /// Format: CP-{hsk}-{SKILL}-{SLUG}-{SHORTHASH}
    /// </summary>
    public static string GenerateConceptCode(int hskLevel, string skillCategory, string topicTitle)
    {
        var rawTitle = (topicTitle ?? "general").Trim();
        var normalizedTitle = rawTitle.ToLowerInvariant();

        // 8-character deterministic SHA256 hex
        var hashBytes = SHA256.HashData(Encoding.UTF8.GetBytes(normalizedTitle));
        var shortHash = Convert.ToHexString(hashBytes)[..8];

        var slug = Slugify(normalizedTitle);
        if (slug.Length > 20) slug = slug[..20];

        var skill = string.IsNullOrWhiteSpace(skillCategory) ? "GEN" : skillCategory.ToUpperInvariant();

        return string.IsNullOrWhiteSpace(slug)
            ? $"CP-{hskLevel}-{skill}-{shortHash}"
            : $"CP-{hskLevel}-{skill}-{slug.ToUpperInvariant()}-{shortHash}";
    }

    private static string Slugify(string text)
    {
        var clean = Regex.Replace(text, @"[^\w\s-]", "");
        clean = Regex.Replace(clean, @"\s+", "-").Trim('-');
        return clean;
    }

    private sealed record AttemptRecord(string SkillCategory, string TopicTitle, int HskLevel, bool IsCorrect, DateTime AttemptedAt);
}
