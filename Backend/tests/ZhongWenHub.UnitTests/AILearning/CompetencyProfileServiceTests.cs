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
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task GetCompetencyProfileAsync_NewUser_ReturnsNotAssessedStatus()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        var service = new CompetencyProfileService(context);
        var profile = await service.GetCompetencyProfileAsync(userId);

        Assert.NotNull(profile);
        Assert.Equal(userId, profile.UserId);
        Assert.Equal("NOT_ASSESSED", profile.AssessmentStatus);
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
    public async Task GetCompetencyProfileAsync_WithFrequentErrors_IdentifiesWeakConcepts()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        // 3 consecutive errors on "Câu chữ 把"
        context.StudentPracticeAttempts.AddRange(
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 把", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-15) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 把", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-10) },
            new StudentPracticeAttempt { UserId = userId, Category = "grammar", TopicTitle = "Câu chữ 把", HskLevel = 2, IsCorrect = false, AttemptedAt = DateTime.UtcNow.AddMinutes(-5) }
        );
        await context.SaveChangesAsync();

        var service = new CompetencyProfileService(context);
        var profile = await service.GetCompetencyProfileAsync(userId);

        Assert.NotEmpty(profile.TopWeakConcepts);
        var topWeak = profile.TopWeakConcepts.First();
        Assert.Equal("Câu chữ 把", topWeak.TitleVi);
        Assert.Equal(3, topWeak.IncorrectAttempts);
        Assert.True(topWeak.MasteryScore < 0.30);
        Assert.Equal("NOVICE", topWeak.MasteryTier);
        Assert.Contains("WK-2-GRAMMAR", topWeak.ConceptCode);
    }

    [Fact]
    public async Task GetCompetencyProfileAsync_ConcurrentAccess_IsThreadSafe()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        context.StudentPracticeAttempts.Add(new StudentPracticeAttempt
        {
            UserId = userId,
            Category = "reading",
            TopicTitle = "Đoạn văn ngắn HSK 1",
            IsCorrect = true,
            AttemptedAt = DateTime.UtcNow
        });
        await context.SaveChangesAsync();

        var service = new CompetencyProfileService(context);

        // Run 10 parallel queries
        var tasks = Enumerable.Range(0, 10).Select(_ => service.GetCompetencyProfileAsync(userId));
        var results = await Task.WhenAll(tasks);

        Assert.Equal(10, results.Length);
        foreach (var r in results)
        {
            Assert.Equal(1, r.TotalEvaluations);
            Assert.Equal(userId, r.UserId);
        }
    }
}
