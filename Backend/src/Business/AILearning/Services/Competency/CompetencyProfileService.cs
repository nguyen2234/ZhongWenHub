using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Business.AILearning.Services.Competency;

public sealed class CompetencyProfileService : ICompetencyProfileService
{
    private static readonly (string Key, string Label)[] MacroSkills =
    {
        ("vocabulary", "Từ vựng (Vocabulary)"),
        ("grammar", "Ngữ pháp (Grammar)"),
        ("reading", "Đọc hiểu (Reading)"),
        ("listening", "Nghe hiểu (Listening)"),
        ("hanzi", "Nhận diện & Viết chữ Hán"),
        ("speaking", "Phát âm & Thanh điệu")
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

        var currentHsk = profile?.SelectedHskLevel is >= 1 and <= 6 ? profile.SelectedHskLevel : 1;

        // Fetch standard practice attempts in chronological order
        var practiceAttempts = await _dbContext.StudentPracticeAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.AttemptedAt)
            .Select(a => new AttemptRecord(
                NormalizeSkill(a.Category),
                string.IsNullOrWhiteSpace(a.TopicTitle) ? (a.KnowledgePointId ?? "Kiến thức tổng hợp") : a.TopicTitle,
                a.HskLevel,
                a.IsCorrect,
                a.AttemptedAt))
            .ToListAsync(cancellationToken);

        // Fetch AI-generated exercise attempts in chronological order
        var aiAttempts = await _dbContext.AiExerciseAttempts
            .AsNoTracking()
            .Include(a => a.AiExercise)
            .Where(a => a.UserId == userId)
            .OrderBy(a => a.AttemptedAt)
            .Select(a => new AttemptRecord(
                NormalizeSkill(a.SkillCategory),
                a.AiExercise != null ? $"{a.AiExercise.SourceType} HSK {a.AiExercise.HskLevel}" : "Bài tập AI",
                a.AiExercise != null ? a.AiExercise.HskLevel : currentHsk,
                a.IsCorrect,
                a.AttemptedAt))
            .ToListAsync(cancellationToken);

        // Fetch Vocabulary SRS progress to augment vocabulary mastery
        var vocabProgressList = await _dbContext.StudentVocabularyProgresses
            .AsNoTracking()
            .Where(v => v.UserId == userId)
            .Select(v => new { v.Status, v.Repetitions, v.EaseFactor })
            .ToListAsync(cancellationToken);

        var allAttempts = practiceAttempts.Concat(aiAttempts).OrderBy(a => a.AttemptedAt).ToList();
        var totalEvals = allAttempts.Count;

        // Process Macro Skills
        var skillDtos = new List<SkillCompetencyDto>();
        var measuredMasteries = new List<double>();
        var measuredConfidences = new List<double>();

        foreach (var (key, label) in MacroSkills)
        {
            var attemptsForSkill = allAttempts.Where(a => a.SkillCategory == key).ToList();
            var count = attemptsForSkill.Count;

            // Transparent handling of speaking/pronunciation
            if (key == "speaking")
            {
                // Speaking currently has no automated audio tone scorer in production
                skillDtos.Add(new SkillCompetencyDto
                {
                    SkillCategory = key,
                    LabelVi = label,
                    TotalAttempts = count,
                    CorrectAttempts = attemptsForSkill.Count(a => a.IsCorrect),
                    AccuracyPercent = count > 0 ? Math.Round(attemptsForSkill.Count(a => a.IsCorrect) * 100.0 / count, 1) : 0.0,
                    MasteryScore = 0.0,
                    MasteryPercent = 0.0,
                    ConfidenceScore = 0.0,
                    MasteryTier = "NOT_ASSESSED",
                    IsMeasuredRealData = false,
                    WeakTopics = new List<string>()
                });
                continue;
            }

            if (count == 0)
            {
                // Special boost for vocabulary if SRS reviews exist without explicit practice attempts
                if (key == "vocabulary" && vocabProgressList.Count > 0)
                {
                    var masteredCount = vocabProgressList.Count(v => v.Status == "mastered");
                    var learningCount = vocabProgressList.Count(v => v.Status == "learning");
                    var srsMastery = Math.Clamp(((masteredCount * 1.0) + (learningCount * 0.5)) / Math.Max(10, vocabProgressList.Count), 0.1, 0.95);
                    var srsConf = BktAlgorithm.ComputeConfidence(vocabProgressList.Count);
                    var srsTier = BktAlgorithm.ResolveMasteryTier(srsMastery, vocabProgressList.Count, srsConf);

                    skillDtos.Add(new SkillCompetencyDto
                    {
                        SkillCategory = key,
                        LabelVi = label,
                        TotalAttempts = vocabProgressList.Count,
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

        // Extract Top Weak Concepts
        var weakConcepts = allAttempts
            .Where(a => !string.IsNullOrWhiteSpace(a.TopicTitle))
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
                ConceptCode = $"WK-{x.HskLevel}-{x.SkillCategory.ToUpperInvariant()}",
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

        // Estimated HSK Level adjustment
        var estimatedHsk = currentHsk;
        if (assessmentStatus is "ASSESSED" or "CALIBRATED")
        {
            if (overallMastery >= 85.0 && totalEvals >= 20)
            {
                estimatedHsk = Math.Min(6, currentHsk + 1);
            }
            else if (overallMastery < 40.0 && totalEvals >= 15 && currentHsk > 1)
            {
                estimatedHsk = Math.Max(1, currentHsk - 1);
            }
        }

        return new CompetencyProfileDto
        {
            UserId = userId,
            AssessmentStatus = assessmentStatus,
            EstimatedHskLevel = estimatedHsk,
            ConfidenceScore = overallConfidence,
            OverallMasteryPercent = overallMastery,
            TotalEvaluations = totalEvals,
            HasSpeakingAudioData = false,
            SpeakingAudioNote = "Chưa có dữ liệu âm thanh được chấm điểm; hệ thống không suy đoán điểm nói.",
            MacroSkills = skillDtos,
            TopWeakConcepts = weakConcepts,
            TopStrengths = topStrengths,
            LastAssessedAt = DateTime.UtcNow
        };
    }

    private static string NormalizeSkill(string? category)
    {
        var c = (category ?? string.Empty).Trim().ToLowerInvariant();
        return c switch
        {
            "vocabulary" or "vocab" => "vocabulary",
            "grammar" or "sentence" => "grammar",
            "hanzi" or "character" or "writing" => "hanzi",
            "pinyin" or "tone" => "hanzi",
            "reading" => "reading",
            "listening" => "listening",
            "speaking" => "speaking",
            _ => "grammar"
        };
    }

    private sealed record AttemptRecord(string SkillCategory, string TopicTitle, int HskLevel, bool IsCorrect, DateTime AttemptedAt);
}

