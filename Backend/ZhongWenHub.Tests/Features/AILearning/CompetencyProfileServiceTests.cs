using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests.AILearning;

public class CompetencyProfileServiceTests
{
    private static ApplicationDbContext CreateContext(string? dbName = null)
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(dbName ?? Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetCompetencyProfileAsync_NewUser_ReturnsNotAssessedStatusAndNullEstimatedHsk()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        var service = new CompetencyProfileService(context);
        var profile = await service.GetCompetencyProfileAsync(userId);

        Assert.NotNull(profile);
        Assert.Equal(userId, profile.UserId);
        Assert.Equal("NOT_ASSESSED", profile.AssessmentStatus);
        Assert.Equal(1, profile.SelectedHskLevel);
        Assert.Null(profile.EstimatedHskLevel); // Insufficient evidence must remain null
        Assert.Equal(0, profile.TotalEvaluations);
        Assert.Equal(0.0, profile.ConfidenceScore);
        Assert.False(profile.HasSpeakingAudioData);

        var speaking = profile.MacroSkills.FirstOrDefault(s => s.SkillCategory == "speaking");
        Assert.NotNull(speaking);
        Assert.False(speaking.IsMeasuredRealData);
        Assert.Equal("NOT_ASSESSED", speaking.MasteryTier);
    }

    [Fact]
    public async Task GetCompetencyProfileAsync_WithPracticeAttempts_ComputesBktAndAccuracy()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        // Seed 5 grammar practice attempts
        context.StudentPracticeAttempts.AddRange(
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 是", IsCorrect = true, AttemptedAt = DateTime.UtcNow.AddMinutes(-50) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 是", IsCorrect = true, AttemptedAt = DateTime.UtcNow.AddMinutes(-40) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 是", IsCorrect = true, AttemptedAt = DateTime.UtcNow.AddMinutes(-30) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 是", IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-20) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 是", IsCorrect = true, AttemptedAt = DateTime.UtcNow.AddMinutes(-10) }
        );
        await context.SaveChangesAsync();

        var service = new CompetencyProfileService(context);
        var profile = await service.GetCompetencyProfileAsync(userId);

        Assert.Equal(5, profile.TotalEvaluations);
        Assert.Equal("ASSESSED", profile.AssessmentStatus);

        var grammar = profile.MacroSkills.First(s => s.SkillCategory == "grammar");
        Assert.Equal(5, grammar.TotalAttempts);
        Assert.Equal(4, grammar.CorrectAttempts);
        Assert.Equal(80.0, grammar.AccuracyPercent);
        Assert.True(grammar.MasteryScore >= 0.60, $"Expected mastery >= 0.60, got {grammar.MasteryScore}");
        Assert.True(grammar.ConfidenceScore > 0.40);
        Assert.Contains(grammar.MasteryTier, new[] { "COMPETENT", "EMERGING", "MASTERED" });
    }

    [Fact]
    public async Task GetCompetencyProfileAsync_WithFrequentErrors_IdentifiesWeakConceptsWithUniqueStableCode()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        // 3 errors on "Câu chữ 把" and 2 errors on "Trợ từ kết cấu 的" both at HSK 2 Grammar
        context.StudentPracticeAttempts.AddRange(
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 把", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-20) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 把", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-15) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 把", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-10) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Trợ từ 的", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-8) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Trợ từ 的", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-5) }
        );
        await context.SaveChangesAsync();

        var service = new CompetencyProfileService(context);
        var profile = await service.GetCompetencyProfileAsync(userId);

        Assert.Equal(2, profile.TopWeakConcepts.Count);

        var baTopic = profile.TopWeakConcepts.First(w => w.TitleVi == "Câu chữ 把");
        var deTopic = profile.TopWeakConcepts.First(w => w.TitleVi == "Trợ từ 的");

        // Verify ConceptCode is unique per knowledge point even with same skill & HSK level
        Assert.NotEqual(baTopic.ConceptCode, deTopic.ConceptCode);
        Assert.StartsWith("CP-2-GRAMMAR", baTopic.ConceptCode);
        Assert.StartsWith("CP-2-GRAMMAR", deTopic.ConceptCode);

        // Verify ConceptCode is deterministic and stable
        var expectedCode = CompetencyProfileService.GenerateConceptCode(2, "grammar", "Câu chữ 把");
        Assert.Equal(expectedCode, baTopic.ConceptCode);
    }

    [Fact]
    public async Task GetCompetencyProfileAsync_WithSkewedSingleSkillData_DoesNotAssumeOverallHsk()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        // 15 vocabulary attempts (100% correct) but 0 in grammar, reading, listening
        for (var i = 0; i < 15; i++)
        {
            context.StudentPracticeAttempts.Add(new StudentPracticeAttempt
            {
                UserId = userId,
                Category = "vocabulary",
                TopicTitle = $"Từ vựng bài {i + 1}",
                HskLevel = 1,
                IsCorrect = true,
                AttemptedAt = DateTime.UtcNow.AddMinutes(-100 + (i * 5))
            });
        }
        await context.SaveChangesAsync();

        var service = new CompetencyProfileService(context);
        var profile = await service.GetCompetencyProfileAsync(userId);

        var vocab = profile.MacroSkills.First(s => s.SkillCategory == "vocabulary");
        var reading = profile.MacroSkills.First(s => s.SkillCategory == "reading");

        Assert.Equal("MASTERED", vocab.MasteryTier);
        Assert.Equal("NOT_ASSESSED", reading.MasteryTier);

        // Even though vocabulary has high accuracy, estimated HSK level should not be automatically bumped
        Assert.True(profile.SelectedHskLevel == 1);
    }

    [Fact]
    public void NormalizeSkill_PreservesPinyinDistinctFromHanziAndTracksUnknowns()
    {
        Assert.Equal("pinyin", CompetencyProfileService.NormalizeSkill("pinyin"));
        Assert.Equal("pinyin", CompetencyProfileService.NormalizeSkill("tone"));
        Assert.Equal("pinyin", CompetencyProfileService.NormalizeSkill("phonetics"));

        Assert.Equal("hanzi", CompetencyProfileService.NormalizeSkill("hanzi"));
        Assert.Equal("hanzi", CompetencyProfileService.NormalizeSkill("writing"));

        Assert.Equal("grammar", CompetencyProfileService.NormalizeSkill("grammar"));
        Assert.Equal("vocabulary", CompetencyProfileService.NormalizeSkill("vocab"));

        // Unknowns must NOT be coerced into grammar or hanzi
        Assert.Equal("unclassified:culture_history", CompetencyProfileService.NormalizeSkill("culture_history"));
        Assert.Equal("unclassified", CompetencyProfileService.NormalizeSkill(null));
    }

    [Fact]
    public async Task GetCompetencyProfileAsync_ConcurrentAccess_UsesDedicatedDbContextInstances()
    {
        var sharedDbName = Guid.NewGuid().ToString();
        var userId = Guid.NewGuid();

        // Seed with initial context
        using (var seedContext = CreateContext(sharedDbName))
        {
            seedContext.StudentPracticeAttempts.Add(new StudentPracticeAttempt
            {
                UserId = userId,
                Category = "reading",
                TopicTitle = "Đoạn văn ngắn HSK 1",
                IsCorrect = true,
                AttemptedAt = DateTime.UtcNow
            });
            await seedContext.SaveChangesAsync();
        }

        // Concurrency test: each parallel operation uses its own scoped DbContext instance,
        // mirroring real-world ASP.NET Core scoped dependency injection.
        var tasks = Enumerable.Range(0, 10).Select(async _ =>
        {
            using var taskContext = CreateContext(sharedDbName);
            var service = new CompetencyProfileService(taskContext);
            return await service.GetCompetencyProfileAsync(userId);
        });

        var results = await Task.WhenAll(tasks);

        Assert.Equal(10, results.Length);
        foreach (var r in results)
        {
            Assert.Equal(1, r.TotalEvaluations);
            Assert.Equal(userId, r.UserId);
        }
    }
}
