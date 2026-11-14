using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using Xunit;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AILearning.Services.Recommendation;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests.AILearning;

public class SqlServerPhase1IntegrationTests
{
    private const string SqlServerConnectionString =
        "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private static ApplicationDbContext CreateSqlServerContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(SqlServerConnectionString)
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task SqlServer_EndToEnd_CompetencyAndRecommendations_WithUserDataIsolation()
    {
        using var context = CreateSqlServerContext();

        // 1. Verify connection to dedicated test SQL Server database
        Assert.True(await context.Database.CanConnectAsync(), "Must connect to SQL Server ZhongWenHub_Test database");

        // 2. Use 2 real existing student accounts in ZhongWenHub_Test for isolation verification
        var student1Id = Guid.Parse("46e15f31-a780-490c-bfca-fc07113786d6"); // hocvien@gmail.com
        var student2Id = Guid.Parse("360f3a1b-edc0-47ec-80b9-ea2eea39de02"); // student.binh.demo@zhongwenhub.edu.vn

        try
        {
            // Clean any previous test data for these IDs
            context.StudentPracticeAttempts.RemoveRange(context.StudentPracticeAttempts.Where(a => a.UserId == student1Id || a.UserId == student2Id));
            context.StudentVocabularyProgresses.RemoveRange(context.StudentVocabularyProgresses.Where(v => v.UserId == student1Id || v.UserId == student2Id));
            context.StudentLessonProgresses.RemoveRange(context.StudentLessonProgresses.Where(l => l.UserId == student1Id || l.UserId == student2Id));
            context.StudentLearningProfiles.RemoveRange(context.StudentLearningProfiles.Where(p => p.UserId == student1Id || p.UserId == student2Id));
            await context.SaveChangesAsync();

            // Seed student profiles
            context.StudentLearningProfiles.AddRange(
                new StudentLearningProfile { UserId = student1Id, SelectedHskLevel = 1, TargetDailyMinutes = 25, StreakDays = 3 },
                new StudentLearningProfile { UserId = student2Id, SelectedHskLevel = 2, TargetDailyMinutes = 15, StreakDays = 0 }
            );

            // Student 1: 3 grammar attempts (2 correct, 1 error on "Trợ từ 的") + 2 vocabulary SRS items
            var now = DateTime.UtcNow;
            context.StudentPracticeAttempts.AddRange(
                new StudentPracticeAttempt { UserId = student1Id, Category = "grammar", TopicTitle = "Trợ từ 的", HskLevel = 1, IsCorrect = false, AttemptedAt = now.AddMinutes(-30) },
                new StudentPracticeAttempt { UserId = student1Id, Category = "grammar", TopicTitle = "Trợ từ 的", HskLevel = 1, IsCorrect = true, AttemptedAt = now.AddMinutes(-20) },
                new StudentPracticeAttempt { UserId = student1Id, Category = "grammar", TopicTitle = "Câu chữ 是", HskLevel = 1, IsCorrect = true, AttemptedAt = now.AddMinutes(-10) }
            );

            context.StudentVocabularyProgresses.AddRange(
                new StudentVocabularyProgress { UserId = student1Id, VocabularyId = Guid.NewGuid().ToString(), Status = "learning", NextReviewAt = now.AddHours(-1) },
                new StudentVocabularyProgress { UserId = student1Id, VocabularyId = Guid.NewGuid().ToString(), Status = "mastered", NextReviewAt = now.AddDays(7) }
            );

            // Student 2: completely unassessed (zero attempts)
            await context.SaveChangesAsync();

            // 3. Test Competency Profile Service directly against SQL Server
            var competencyService = new CompetencyProfileService(context);

            var profile1 = await competencyService.GetCompetencyProfileAsync(student1Id);
            var profile2 = await competencyService.GetCompetencyProfileAsync(student2Id);

            // Student 1 Assertions
            Assert.NotNull(profile1);
            Assert.Equal(student1Id, profile1.UserId);
            Assert.Equal(3, profile1.TotalEvaluations);
            Assert.Equal(1, profile1.SelectedHskLevel);
            Assert.Null(profile1.EstimatedHskLevel); // Insufficient data to officially certify HSK level
            Assert.Equal("IN_PROGRESS", profile1.AssessmentStatus);

            // Student 2 Assertions (Data Isolation check)
            Assert.NotNull(profile2);
            Assert.Equal(student2Id, profile2.UserId);
            Assert.Equal(0, profile2.TotalEvaluations);
            Assert.Equal(2, profile2.SelectedHskLevel);
            Assert.Null(profile2.EstimatedHskLevel);
            Assert.Equal("NOT_ASSESSED", profile2.AssessmentStatus);
            Assert.Empty(profile2.TopWeakConcepts);

            // 4. Test Recommendation Engine V2 directly against SQL Server
            var mockProvider = new MockAIProvider();
            var usageLogger = new EfAIUsageLogger(context, Options.Create(new GeminiOptions()));
            var engine = new RecommendationEngineV2(context, competencyService, mockProvider, usageLogger, NullLogger<RecommendationEngineV2>.Instance);

            var plan1 = await engine.GetPlanV2Async(student1Id, availableMinutes: 25, explainWithAi: false);
            var plan2 = await engine.GetPlanV2Async(student2Id, availableMinutes: 15, explainWithAi: false);

            // Student 1: SRS due item must be prioritized
            Assert.NotNull(plan1);
            Assert.Equal(student1Id, plan1.UserId);
            Assert.Equal(1, plan1.DueSrsCount);
            Assert.Equal(1, plan1.MasteredWordsCount);
            Assert.NotEmpty(plan1.Recommendations);

            var topRec1 = plan1.Recommendations.First();
            Assert.Equal("srs-due", topRec1.Category);
            Assert.Equal("/srs-review", topRec1.DestinationRoute);

            // Student 2: Must NOT have Student 1's SRS items
            Assert.NotNull(plan2);
            Assert.Equal(student2Id, plan2.UserId);
            Assert.Equal(0, plan2.DueSrsCount);
            Assert.Equal(0, plan2.MasteredWordsCount);
            Assert.DoesNotContain(plan2.Recommendations, r => r.Category == "srs-due");
            Assert.DoesNotContain(plan2.Recommendations, r => r.Category == "diagnostic-test");
        }
        finally
        {
            // Clean up test data in SQL Server
            context.StudentPracticeAttempts.RemoveRange(context.StudentPracticeAttempts.Where(a => a.UserId == student1Id || a.UserId == student2Id));
            context.StudentVocabularyProgresses.RemoveRange(context.StudentVocabularyProgresses.Where(v => v.UserId == student1Id || v.UserId == student2Id));
            context.StudentLessonProgresses.RemoveRange(context.StudentLessonProgresses.Where(l => l.UserId == student1Id || l.UserId == student2Id));
            context.StudentLearningProfiles.RemoveRange(context.StudentLearningProfiles.Where(p => p.UserId == student1Id || p.UserId == student2Id));
            await context.SaveChangesAsync();
        }
    }
}
