using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.AILearning;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.AI;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class AIPhase3PersonalizationUnitTests
{
    [Theory]
    [InlineData("grammar", "Ngữ pháp (Grammar)")]
    [InlineData("vocabulary", "Từ vựng (Vocabulary)")]
    [InlineData("pinyin", "Pinyin & Thanh điệu")]
    [InlineData("hanzi", "Nhận diện chữ Hán (Hanzi)")]
    [InlineData("reading", "Đọc hiểu (Reading)")]
    [InlineData("listening", "Nghe hiểu (Listening)")]
    public void PedagogicalOfflineFallback_GeneratesComprehensiveExplanation_ForAllCategories(string category, string expectedLabel)
    {
        var result = AIErrorAnalysisService.BuildPedagogicalOfflineFallback(
            category,
            "这是一道测试题目",
            "错误选项",
            "正确答案",
            2);

        Assert.NotNull(result);
        Assert.Equal(category, result.ErrorType);
        Assert.Equal(expectedLabel, result.ErrorTypeLabelVi);
        Assert.False(string.IsNullOrWhiteSpace(result.WhyIncorrectVi));
        Assert.False(string.IsNullOrWhiteSpace(result.WhyCorrectVi));
        Assert.False(string.IsNullOrWhiteSpace(result.KnowledgePointVi));
        Assert.NotEmpty(result.Examples);
        Assert.True(result.IsFallback);
        Assert.False(result.IsAiGenerated);
        Assert.Contains("ai-exercises", result.RecommendedRoute);
    }

    [Fact]
    public void ParseAndValidateErrorAnalysis_ValidatesStrictSchema()
    {
        const string validJson = """
        {
          "errorType": "grammar",
          "errorTypeLabelVi": "Ngữ pháp - Trật tự từ",
          "whyIncorrectVi": "Bạn đã đảo ngữ danh từ và định ngữ.",
          "whyCorrectVi": "Trong tiếng Trung định ngữ phải đứng trước trung tâm ngữ.",
          "knowledgePointVi": "Cấu trúc: Định ngữ + 的 + Trung tâm ngữ.",
          "examples": [
            {
              "hanzi": "我买的苹果",
              "pinyin": "wǒ mǎi de píngguǒ",
              "vietnamese": "Táo tôi mua"
            }
          ],
          "recommendedPracticeAction": "Luyện tập thêm 3 câu về định ngữ.",
          "recommendedRoute": "/ai-exercises?hsk=2&source=GRAMMAR"
        }
        """;

        var result = AIErrorAnalysisService.ParseAndValidateErrorAnalysis(validJson, "grammar", 2);

        Assert.NotNull(result);
        Assert.Equal("grammar", result!.ErrorType);
        Assert.Equal("Ngữ pháp - Trật tự từ", result.ErrorTypeLabelVi);
        Assert.Single(result.Examples);
        Assert.Equal("我买的苹果", result.Examples[0].Hanzi);
        Assert.True(result.IsAiGenerated);
        Assert.False(result.IsFallback);
    }

    [Fact]
    public void ParseAndValidateErrorAnalysis_RejectsMalformedOrMissingFields()
    {
        const string missingWhyIncorrect = """
        {
          "errorType": "grammar",
          "whyCorrectVi": "Đáp án đúng"
        }
        """;

        var res1 = AIErrorAnalysisService.ParseAndValidateErrorAnalysis(missingWhyIncorrect, "grammar", 1);
        Assert.Null(res1);

        const string invalidJson = "Not valid JSON at all";
        var res2 = AIErrorAnalysisService.ParseAndValidateErrorAnalysis(invalidJson, "grammar", 1);
        Assert.Null(res2);
    }

    [Fact]
    public void ExerciseDto_EnforcesZeroAnswerLeakage_BeforeSubmission()
    {
        var ex = new AiGeneratedExercise
        {
            Id = Guid.NewGuid(),
            UserId = Guid.NewGuid(),
            HskLevel = 2,
            SourceType = "VOCABULARY",
            ExerciseType = "multiple-choice",
            PromptZh = "请选择“苹果”的意思：",
            PromptPinyin = "Qǐng xuǎnzé \"píngguǒ\" de yìsi:",
            PromptVi = "Chọn nghĩa của từ 苹果",
            OptionsJson = JsonSerializer.Serialize(new[] { "Quả táo", "Quả cam", "Quả chuối", "Quả lê" }),
            CorrectIndex = 0,
            CorrectAnswer = "Quả táo",
            ExplanationVi = "苹果 nghĩa là Quả táo."
        };

        // 1. When unsubmitted: answers and explanation MUST be hidden
        var unsubmittedDto = AIExerciseService.MapDto(ex, isAttempted: false);
        Assert.Null(unsubmittedDto.CorrectIndex);
        Assert.Null(unsubmittedDto.CorrectAnswer);
        Assert.Equal(string.Empty, unsubmittedDto.ExplanationVi);

        // 2. When submitted: answers are revealed
        var submittedDto = AIExerciseService.MapDto(ex, isAttempted: true);
        Assert.Equal(0, submittedDto.CorrectIndex);
        Assert.Equal("Quả táo", submittedDto.CorrectAnswer);
        Assert.Equal("苹果 nghĩa là Quả táo.", submittedDto.ExplanationVi);

        // 3. Adaptive Exercise DTO for test taking has no answer fields at all
        var adaptiveDto = AIExerciseService.MapAdaptiveDto(ex, targetHsk: 2);
        Assert.Equal(ex.Id, adaptiveDto.Id);
        Assert.Equal(4, adaptiveDto.Options.Count);
        Assert.Equal("Tiêu chuẩn", adaptiveDto.DifficultyTag);
    }

    [Fact]
    public async Task MockAIProvider_ReturnsValidErrorAnalysisJson()
    {
        var provider = new MockAIProvider();
        var resp = await provider.GenerateContentAsync(new AIProviderRequest
        {
            Feature = "AI_ERROR_ANALYSIS",
            SystemInstruction = "sys",
            UserPrompt = "analyze"
        });

        Assert.True(resp.IsMock);
        Assert.False(string.IsNullOrWhiteSpace(resp.RawText));

        var parsed = AIErrorAnalysisService.ParseAndValidateErrorAnalysis(resp.RawText, "grammar", 1);
        Assert.NotNull(parsed);
        Assert.Equal("grammar", parsed!.ErrorType);
        Assert.NotEmpty(parsed.WhyIncorrectVi);
        Assert.NotEmpty(parsed.WhyCorrectVi);
        Assert.NotEmpty(parsed.Examples);
    }

    [Fact]
    public void EvaluateAttempt_AccuratelyEvaluatesChoiceAndText()
    {
        var choiceEx = new AiGeneratedExercise
        {
            CorrectIndex = 2,
            CorrectAnswer = "C"
        };

        Assert.True(AIExerciseService.EvaluateAttempt(choiceEx, new SubmitAiExerciseAttemptDto { SelectedIndex = 2 }));
        Assert.False(AIExerciseService.EvaluateAttempt(choiceEx, new SubmitAiExerciseAttemptDto { SelectedIndex = 1 }));

        var textEx = new AiGeneratedExercise
        {
            CorrectAnswer = "北京"
        };

        Assert.True(AIExerciseService.EvaluateAttempt(textEx, new SubmitAiExerciseAttemptDto { UserAnswer = " 北京 " }));
        Assert.True(AIExerciseService.EvaluateAttempt(textEx, new SubmitAiExerciseAttemptDto { UserAnswer = "北京。" }));
        Assert.False(AIExerciseService.EvaluateAttempt(textEx, new SubmitAiExerciseAttemptDto { UserAnswer = "上海" }));
    }
}

[Collection("SqlServerIntegrationTests")]
public class AIPhase3SqlServerIntegrationTests
{
    private const string ConnectionString = "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task SubmitAttempt_IsIdempotent_AndUpdatesBothAttemptsTablesAtomically()
    {
        await using var db = CreateContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"test_ai_user_{Guid.NewGuid():N}@zhongwenhub.local",
            Email = $"test_ai_user_{Guid.NewGuid():N}@zhongwenhub.local",
            DisplayName = "Test AI Student",
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };

        var exercise = new AiGeneratedExercise
        {
            Id = Guid.NewGuid(),
            UserId = testUser.Id,
            HskLevel = 2,
            SourceType = "VOCABULARY",
            ExerciseType = "multiple-choice",
            PromptZh = "请选择“医院”的意思：",
            PromptPinyin = "yīyuàn",
            PromptVi = "Chọn nghĩa của từ 医院",
            OptionsJson = JsonSerializer.Serialize(new[] { "Bệnh viện", "Trường học", "Ngân hàng", "Công viên" }),
            CorrectIndex = 0,
            CorrectAnswer = "Bệnh viện",
            ExplanationVi = "医院 nghĩa là Bệnh viện.",
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(testUser);
        db.AiGeneratedExercises.Add(exercise);
        await db.SaveChangesAsync();

        try
        {
            var mockAi = new MockAIProvider();
            var errorService = new AIErrorAnalysisService(db, mockAi);
            var exerciseService = new AIExerciseService(db, mockAi, new NoOpUsageLogger(), errorService, NullLogger<AIExerciseService>.Instance);

            // 1. Submit incorrect attempt
            var result1 = await exerciseService.SubmitAttemptAsync(
                testUser.Id,
                exercise.Id,
                new SubmitAiExerciseAttemptDto { SelectedIndex = 1 });

            Assert.False(result1.IsCorrect);
            Assert.Equal(0, result1.CorrectIndex);
            Assert.Equal("Bệnh viện", result1.CorrectAnswer);
            Assert.NotNull(result1.ErrorAnalysis);
            Assert.NotNull(result1.NextSuggestion);

            // 2. Check persistence in BOTH tables
            var aiAttempts = await db.AiExerciseAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            Assert.Single(aiAttempts);
            Assert.False(aiAttempts[0].IsCorrect);

            var practiceAttempts = await db.StudentPracticeAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            Assert.Single(practiceAttempts);
            Assert.Equal($"ai_{exercise.Id}", practiceAttempts[0].ExerciseId);
            Assert.False(practiceAttempts[0].IsCorrect);

            // 3. Re-submit same exercise (idempotency check)
            var result2 = await exerciseService.SubmitAttemptAsync(
                testUser.Id,
                exercise.Id,
                new SubmitAiExerciseAttemptDto { SelectedIndex = 1 });

            Assert.Equal(result1.AttemptId, result2.AttemptId);
            Assert.Equal(result1.IsCorrect, result2.IsCorrect);

            // Verify no duplicate rows created
            var aiAttemptsAfter = await db.AiExerciseAttempts.Where(a => a.UserId == testUser.Id).CountAsync();
            var practiceAttemptsAfter = await db.StudentPracticeAttempts.Where(a => a.UserId == testUser.Id).CountAsync();
            Assert.Equal(1, aiAttemptsAfter);
            Assert.Equal(1, practiceAttemptsAfter);
        }
        finally
        {
            // Cleanup transient test data
            var pra = await db.StudentPracticeAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            db.StudentPracticeAttempts.RemoveRange(pra);

            var aia = await db.AiExerciseAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            db.AiExerciseAttempts.RemoveRange(aia);

            var stat = await db.LearningSkillStatistics.Where(s => s.UserId == testUser.Id).ToListAsync();
            db.LearningSkillStatistics.RemoveRange(stat);

            var exs = await db.AiGeneratedExercises.Where(e => e.UserId == testUser.Id).ToListAsync();
            db.AiGeneratedExercises.RemoveRange(exs);

            var u = await db.Users.FirstOrDefaultAsync(x => x.Id == testUser.Id);
            if (u != null) db.Users.Remove(u);

            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task GenerateAdaptiveSession_ReturnsSecureSession_WithZeroAnswerLeakage()
    {
        await using var db = CreateContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"test_adaptive_{Guid.NewGuid():N}@zhongwenhub.local",
            Email = $"test_adaptive_{Guid.NewGuid():N}@zhongwenhub.local",
            DisplayName = "Test Adaptive Student",
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(testUser);
        await db.SaveChangesAsync();

        try
        {
            var mockAi = new MockAIProvider();
            var errorService = new AIErrorAnalysisService(db, mockAi);
            var exerciseService = new AIExerciseService(db, mockAi, new NoOpUsageLogger(), errorService, NullLogger<AIExerciseService>.Instance);

            var session = await exerciseService.GenerateAdaptiveSessionAsync(
                testUser.Id,
                new GenerateAdaptiveSessionRequestDto
                {
                    TargetHskLevel = 2,
                    FocusSkill = "all",
                    QuestionCount = 3,
                    IncludeSrsDue = false
                });

            Assert.NotNull(session);
            Assert.Equal(2, session.HskLevel);
            Assert.Equal("ADAPTIVE", session.Mode);
            Assert.True(session.TotalQuestions >= 1);
            Assert.NotEmpty(session.StrategySummaryVi);

            foreach (var q in session.Questions)
            {
                Assert.NotEqual(Guid.Empty, q.Id);
                Assert.False(string.IsNullOrWhiteSpace(q.PromptZh));
                Assert.NotNull(q.Options);
                Assert.NotEmpty(q.OriginTag);
                Assert.NotEmpty(q.AcademicStatus);
            }
        }
        finally
        {
            var exs = await db.AiGeneratedExercises.Where(e => e.UserId == testUser.Id).ToListAsync();
            db.AiGeneratedExercises.RemoveRange(exs);

            var u = await db.Users.FirstOrDefaultAsync(x => x.Id == testUser.Id);
            if (u != null) db.Users.Remove(u);

            await db.SaveChangesAsync();
        }
    }

    private sealed class NoOpUsageLogger : IAIUsageLogger
    {
        public Task LogAsync(Guid userId, string feature, AIProviderResponse? response, bool isSuccess, string? errorCode, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureWithinDailyBudgetAsync(Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}

