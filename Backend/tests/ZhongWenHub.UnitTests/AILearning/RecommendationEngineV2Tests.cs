using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AILearning.Services.Recommendation;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests.AILearning;

public class RecommendationEngineV2Tests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public void BuildScoredCandidates_WithDueSrsWords_GeneratesHighPrioritySrsRecommendation()
    {
        var competency = new CompetencyProfileDto
        {
            AssessmentStatus = "ASSESSED",
            ConfidenceScore = 0.8,
            OverallMasteryPercent = 75.0
        };

        var candidates = RecommendationEngineV2.BuildScoredCandidates(
            currentHsk: 1,
            plannedMinutes: 20,
            competency: competency,
            dueSrsCount: 12,
            masteredCount: 40,
            inProgressLessonId: null,
            nextLessonId: "les-01",
            nextLessonTitle: "Bài 1");

        var srsItem = candidates.FirstOrDefault(c => c.Category == "srs-due");
        Assert.NotNull(srsItem);
        Assert.Equal("rec-srs-due", srsItem.Id);
        Assert.True(srsItem.UtilityScore >= 0.80);
        Assert.Equal("/srs-review", srsItem.DestinationRoute);
        Assert.NotEmpty(srsItem.Reason);
        Assert.NotEmpty(srsItem.PedagogicalGoalVi);
        Assert.Equal(12, Convert.ToInt32(srsItem.EvidenceData["dueCount"]));
    }

    [Fact]
    public void BuildScoredCandidates_WithWeakConcept_GeneratesRemediationCandidate()
    {
        var competency = new CompetencyProfileDto
        {
            AssessmentStatus = "ASSESSED",
            ConfidenceScore = 0.7,
            TopWeakConcepts = new List<WeakConceptDto>
            {
                new()
                {
                    ConceptCode = "WK-1-GRAMMAR",
                    TitleVi = "Trợ từ 的",
                    HskLevel = 1,
                    MasteryScore = 0.35,
                    MasteryTier = "NOVICE",
                    IncorrectAttempts = 3,
                    RecommendedActionRoute = "/ai-exercises?hsk=1&source=WEAKNESS"
                }
            }
        };

        var candidates = RecommendationEngineV2.BuildScoredCandidates(
            currentHsk: 1,
            plannedMinutes: 20,
            competency: competency,
            dueSrsCount: 0,
            masteredCount: 10,
            inProgressLessonId: null,
            nextLessonId: "les-02",
            nextLessonTitle: "Bài 2");

        var weakItem = candidates.FirstOrDefault(c => c.Category == "weak-skill");
        Assert.NotNull(weakItem);
        Assert.Contains("Trợ từ 的", weakItem.Title);
        Assert.Equal("/ai-exercises?hsk=1&source=WEAKNESS", weakItem.DestinationRoute);
        Assert.Equal(3, Convert.ToInt32(weakItem.EvidenceData["incorrectAttempts"]));
    }

    [Fact]
    public void BuildScoredCandidates_WhenNotAssessed_IncludesOptionalDiagnosticAssessmentRoute()
    {
        var competency = new CompetencyProfileDto
        {
            AssessmentStatus = "NOT_ASSESSED",
            ConfidenceScore = 0.0,
            TotalEvaluations = 0
        };

        var candidates = RecommendationEngineV2.BuildScoredCandidates(
            currentHsk: 1,
            plannedMinutes: 15,
            competency: competency,
            dueSrsCount: 0,
            masteredCount: 0,
            inProgressLessonId: null,
            nextLessonId: "lesson-01",
            nextLessonTitle: "Bài 1: Chào hỏi");

        // Phase 2: Emits an optional adaptive diagnostic assessment pointing to /diagnostic-assessment
        var diag = candidates.FirstOrDefault(c => c.Category == "diagnostic-test");
        Assert.NotNull(diag);
        Assert.Equal("/diagnostic-assessment", diag.DestinationRoute);
        Assert.Equal("Làm khảo sát ngay", diag.ActionLabel);

        var nextLesson = candidates.FirstOrDefault(c => c.Category == "next-lesson");
        Assert.NotNull(nextLesson);
        Assert.Equal("/lesson/lesson-01", nextLesson.DestinationRoute);
    }

    [Fact]
    public async Task GetPlanV2Async_IntegratesRealDatabaseAndOrdersByUtility()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        // Seed Course, Unit, Lesson
        var course = new CourseEntity { Id = Guid.NewGuid(), Title = "HSK 1", HskLevel = 1 };
        var unit = new UnitEntity { Id = Guid.NewGuid(), CourseId = course.Id, TitleVi = "Unit 1", OrderIndex = 1 };
        var lesson = new LessonEntity { Id = Guid.NewGuid(), UnitId = unit.Id, CourseId = course.Id, TitleVi = "Xin chào", TitleZh = "你好", OrderIndex = 1 };
        context.Courses.Add(course);
        context.Units.Add(unit);
        context.Lessons.Add(lesson);

        // Seed 3 due vocabulary items for this user
        var now = DateTime.UtcNow;
        context.StudentVocabularyProgresses.AddRange(
            new StudentVocabularyProgress { UserId = userId, VocabularyId = Guid.NewGuid().ToString(), Status = "learning", NextReviewAt = now.AddHours(-2) },
            new StudentVocabularyProgress { UserId = userId, VocabularyId = Guid.NewGuid().ToString(), Status = "learning", NextReviewAt = now.AddHours(-1) },
            new StudentVocabularyProgress { UserId = userId, VocabularyId = Guid.NewGuid().ToString(), Status = "learning", NextReviewAt = now.AddHours(-5) }
        );

        // Seed profile
        context.StudentLearningProfiles.Add(new StudentLearningProfile
        {
            UserId = userId,
            SelectedHskLevel = 1,
            TargetDailyMinutes = 25,
            StreakDays = 5
        });

        await context.SaveChangesAsync();

        var competencyService = new CompetencyProfileService(context);
        var mockProvider = new MockAIProvider();
        var usageLogger = new EfAIUsageLogger(context, Microsoft.Extensions.Options.Options.Create(new GeminiOptions()));
        var engine = new RecommendationEngineV2(context, competencyService, mockProvider, usageLogger, NullLogger<RecommendationEngineV2>.Instance);

        var plan = await engine.GetPlanV2Async(userId, availableMinutes: 25, explainWithAi: false);

        Assert.NotNull(plan);
        Assert.Equal(userId, plan.UserId);
        Assert.Equal(1, plan.CurrentHskLevel);
        Assert.Null(plan.EstimatedHskLevel); // Insufficient multi-skill evaluations
        Assert.Equal(25, plan.AvailableMinutes);
        Assert.Equal(3, plan.DueSrsCount);
        Assert.Equal(5, plan.StreakDays);
        Assert.NotEmpty(plan.Recommendations);

        // First recommendation must be SRS due with priority 1
        var top = plan.Recommendations.First();
        Assert.Equal(1, top.Priority);
        Assert.Equal("srs-due", top.Category);
        Assert.Equal("/srs-review", top.DestinationRoute);
        Assert.True(top.UtilityScore >= plan.Recommendations.Last().UtilityScore);
    }
}
