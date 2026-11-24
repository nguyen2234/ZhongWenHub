using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Features.AI;
using ZhongWenHub.Features.AI.DTOs;
using ZhongWenHub.Models.Users;
using ZhongWenHub.Models.AI;
using ZhongWenHub.Models.Content;
using ZhongWenHub.Models.Learning;
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
[Trait("Category", "Integration")]
public class AIPhase3SqlServerIntegrationTests
{
    private static readonly string ConnectionString =
        Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION_STRING")
        ?? "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

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

    [Fact]
    public async Task CrossUserAuthorization_ThrowsUnauthorizedAccessException_WhenAccessingOtherUserExercise()
    {
        await using var db = CreateContext();

        var userA = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"user_a_{Guid.NewGuid():N}@test.local",
            Email = $"user_a_{Guid.NewGuid():N}@test.local",
            DisplayName = "User A",
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };
        var userB = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"user_b_{Guid.NewGuid():N}@test.local",
            Email = $"user_b_{Guid.NewGuid():N}@test.local",
            DisplayName = "User B",
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };

        var exerciseA = new AiGeneratedExercise
        {
            Id = Guid.NewGuid(),
            UserId = userA.Id,
            HskLevel = 2,
            SourceType = "VOCABULARY",
            ExerciseType = "multiple-choice",
            PromptZh = "请选择“北京”的意思：",
            PromptVi = "Chọn nghĩa của 北京",
            OptionsJson = JsonSerializer.Serialize(new[] { "Bắc Kinh", "Thượng Hải" }),
            CorrectIndex = 0,
            CorrectAnswer = "Bắc Kinh",
            ExplanationVi = "北京 là Bắc Kinh",
            CreatedAt = DateTime.UtcNow
        };

        db.Users.AddRange(userA, userB);
        db.AiGeneratedExercises.Add(exerciseA);
        await db.SaveChangesAsync();

        try
        {
            var mockAi = new MockAIProvider();
            var errorService = new AIErrorAnalysisService(db, mockAi);

            // User B tries to analyze exercise owned by User A -> Must throw UnauthorizedAccessException
            await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
                errorService.AnalyzeErrorDetailAsync(
                    userB.Id,
                    new RequestErrorAnalysisDto
                    {
                        ExerciseId = exerciseA.Id,
                        QuestionText = exerciseA.PromptZh,
                        UserAnswer = "Thượng Hải"
                    }));
        }
        finally
        {
            db.AiGeneratedExercises.Remove(exerciseA);
            db.Users.Remove(userA);
            db.Users.Remove(userB);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task FreeFormAnalysis_WithoutExerciseId_ReturnsAdvisoryNonAuthoritative()
    {
        await using var db = CreateContext();
        var mockAi = new MockAIProvider();
        var errorService = new AIErrorAnalysisService(db, mockAi);

        var result = await errorService.AnalyzeErrorDetailAsync(
            Guid.NewGuid(),
            new RequestErrorAnalysisDto
            {
                ExerciseId = null,
                QuestionText = "这是一个自由提问",
                UserAnswer = "我写的内容",
                CorrectAnswer = "参考答案",
                SkillCategory = "grammar",
                HskLevel = 2
            });

        Assert.NotNull(result);
        Assert.False(result.IsAuthoritativeGrading);
        Assert.Contains("Tham khảo đối chiếu", result.WhyIncorrectVi);
    }

    [Fact]
    public async Task CuratedFallback_FisherYatesShuffle_MatchesCorrectAnswerIndex()
    {
        await using var db = CreateContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"test_fallback_{Guid.NewGuid():N}@test.local",
            Email = $"test_fallback_{Guid.NewGuid():N}@test.local",
            DisplayName = "Test Fallback User",
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };
        db.Users.Add(testUser);
        await db.SaveChangesAsync();

        try
        {
            // Inject a mock that fails content generation to trigger curated fallback
            var failingAi = new FailingAIProvider();
            var errorService = new AIErrorAnalysisService(db, failingAi);
            var exerciseService = new AIExerciseService(db, failingAi, new NoOpUsageLogger(), errorService, NullLogger<AIExerciseService>.Instance);

            var session = await exerciseService.GenerateAdaptiveSessionAsync(
                testUser.Id,
                new GenerateAdaptiveSessionRequestDto
                {
                    TargetHskLevel = 1,
                    FocusSkill = "vocabulary",
                    QuestionCount = 2,
                    IncludeSrsDue = false
                });

            Assert.NotNull(session);
            Assert.NotEmpty(session.Questions);

            foreach (var q in session.Questions)
            {
                Assert.Equal("CURATED_FALLBACK", q.OriginTag);
                Assert.Equal("UNAPPROVED_EXPERIMENTAL", q.AcademicStatus);
                Assert.NotNull(q.Options);
                Assert.True(q.Options.Count >= 2);

                // Ensure no fake placeholder strings
                Assert.DoesNotContain("pinyin_opt", q.Options);
                Assert.DoesNotContain("Ý nghĩa tham chiếu", q.Options);
                Assert.DoesNotContain("Công thức cấu trúc", string.Join(" ", q.Options));

                // Verify in database that correct index matches the option value
                var dbEx = await db.AiGeneratedExercises.FirstOrDefaultAsync(e => e.Id == q.Id);
                Assert.NotNull(dbEx);
                var options = JsonSerializer.Deserialize<List<string>>(dbEx!.OptionsJson);
                Assert.NotNull(options);
                Assert.True(dbEx.CorrectIndex.HasValue && dbEx.CorrectIndex.Value >= 0 && dbEx.CorrectIndex.Value < options.Count);
                Assert.Equal(dbEx.CorrectAnswer, options[dbEx.CorrectIndex.Value]);
            }
        }
        finally
        {
            var exs = await db.AiGeneratedExercises.Where(e => e.UserId == testUser.Id).ToListAsync();
            db.AiGeneratedExercises.RemoveRange(exs);
            db.Users.Remove(testUser);
            await db.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task ConcurrentSubmissions_CreateExactlyOneAttempt_AndReturnIdempotentStoredResult()
    {
        await using var setupDb = CreateContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"concurrent_{Guid.NewGuid():N}@test.local",
            Email = $"concurrent_{Guid.NewGuid():N}@test.local",
            DisplayName = "Concurrent User",
            Status = UserStatus.ACTIVE,
            CreatedAt = DateTime.UtcNow
        };

        var exercise = new AiGeneratedExercise
        {
            Id = Guid.NewGuid(),
            UserId = testUser.Id,
            HskLevel = 1,
            SourceType = "VOCABULARY",
            ExerciseType = "multiple-choice",
            PromptZh = "请选择“苹果”的意思：",
            PromptPinyin = "píngguǒ",
            PromptVi = "Chọn nghĩa của từ 苹果",
            OptionsJson = JsonSerializer.Serialize(new[] { "Quả táo", "Quả cam", "Quả chuối", "Quả lê" }),
            CorrectIndex = 0,
            CorrectAnswer = "Quả táo",
            ExplanationVi = "苹果 nghĩa là Quả táo.",
            CreatedAt = DateTime.UtcNow
        };

        setupDb.Users.Add(testUser);
        setupDb.AiGeneratedExercises.Add(exercise);
        await setupDb.SaveChangesAsync();

        try
        {
            await using var db1 = CreateContext();
            await using var db2 = CreateContext();

            var mockAi = new MockAIProvider();
            var srv1 = new AIExerciseService(db1, mockAi, new NoOpUsageLogger(), new AIErrorAnalysisService(db1, mockAi), NullLogger<AIExerciseService>.Instance);
            var srv2 = new AIExerciseService(db2, mockAi, new NoOpUsageLogger(), new AIErrorAnalysisService(db2, mockAi), NullLogger<AIExerciseService>.Instance);

            var req = new SubmitAiExerciseAttemptDto { SelectedIndex = 1 };

            var task1 = Task.Run(() => srv1.SubmitAttemptAsync(testUser.Id, exercise.Id, req));
            var task2 = Task.Run(() => srv2.SubmitAttemptAsync(testUser.Id, exercise.Id, req));

            var results = await Task.WhenAll(task1, task2);

            Assert.NotNull(results[0]);
            Assert.NotNull(results[1]);
            Assert.Equal(results[0].AttemptId, results[1].AttemptId);
            Assert.Equal(results[0].IsCorrect, results[1].IsCorrect);

            await using var verifyDb = CreateContext();
            var aiAttempts = await verifyDb.AiExerciseAttempts.Where(a => a.UserId == testUser.Id && a.AiExerciseId == exercise.Id).ToListAsync();
            var practiceAttempts = await verifyDb.StudentPracticeAttempts.Where(p => p.UserId == testUser.Id && p.ExerciseId == $"ai_{exercise.Id}").ToListAsync();

            Assert.Single(aiAttempts);
            Assert.Single(practiceAttempts);
        }
        finally
        {
            await using var cleanDb = CreateContext();
            var pra = await cleanDb.StudentPracticeAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            cleanDb.StudentPracticeAttempts.RemoveRange(pra);
            var aia = await cleanDb.AiExerciseAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            cleanDb.AiExerciseAttempts.RemoveRange(aia);
            var stat = await cleanDb.LearningSkillStatistics.Where(s => s.UserId == testUser.Id).ToListAsync();
            cleanDb.LearningSkillStatistics.RemoveRange(stat);
            var exs = await cleanDb.AiGeneratedExercises.Where(e => e.UserId == testUser.Id).ToListAsync();
            cleanDb.AiGeneratedExercises.RemoveRange(exs);
            var u = await cleanDb.Users.FirstOrDefaultAsync(x => x.Id == testUser.Id);
            if (u != null) cleanDb.Users.Remove(u);
            await cleanDb.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task ErrorAnalysis_UsesMetadataCache_OnRetry()
    {
        await using var db = CreateContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"cache_{Guid.NewGuid():N}@test.local",
            Email = $"cache_{Guid.NewGuid():N}@test.local",
            DisplayName = "Cache User",
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
            PromptZh = "请选择“猫”的意思：",
            PromptPinyin = "māo",
            PromptVi = "Chọn nghĩa của từ 猫",
            OptionsJson = JsonSerializer.Serialize(new[] { "Con mèo", "Con chó" }),
            CorrectIndex = 0,
            CorrectAnswer = "Con mèo",
            ExplanationVi = "猫 là con mèo",
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(testUser);
        db.AiGeneratedExercises.Add(exercise);
        await db.SaveChangesAsync();

        try
        {
            var countingAi = new CountingAIProvider();
            var errorService = new AIErrorAnalysisService(db, countingAi);
            var exerciseService = new AIExerciseService(db, countingAi, new NoOpUsageLogger(), errorService, NullLogger<AIExerciseService>.Instance);

            // First submission (incorrect answer) -> triggers AI call
            var res1 = await exerciseService.SubmitAttemptAsync(testUser.Id, exercise.Id, new SubmitAiExerciseAttemptDto { SelectedIndex = 1 });
            Assert.NotNull(res1.ErrorAnalysis);
            Assert.Equal(1, countingAi.CallCount);

            // Verify MetadataJson cached the error analysis
            var dbEx = await db.AiGeneratedExercises.AsNoTracking().FirstOrDefaultAsync(e => e.Id == exercise.Id);
            Assert.NotNull(dbEx);
            Assert.Contains("cachedErrorAnalyses", dbEx!.MetadataJson ?? "");

            // Second submission (idempotent retry) -> must load cached analysis and NOT call AI again
            var res2 = await exerciseService.SubmitAttemptAsync(testUser.Id, exercise.Id, new SubmitAiExerciseAttemptDto { SelectedIndex = 1 });
            Assert.NotNull(res2.ErrorAnalysis);
            Assert.Equal(1, countingAi.CallCount); // Still exactly 1!
        }
        finally
        {
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
    public async Task ConcurrentSubmissions_FromSeparateDbContexts_GuaranteedIdempotentByUniqueConstraint()
    {
        await using var db1 = CreateContext();
        await using var db2 = CreateContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"concurrent_{Guid.NewGuid():N}@test.local",
            Email = $"concurrent_{Guid.NewGuid():N}@test.local",
            DisplayName = "Concurrent User",
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
            PromptZh = "请选择“书”的意思：",
            PromptPinyin = "shū",
            PromptVi = "Chọn nghĩa của từ 书",
            OptionsJson = JsonSerializer.Serialize(new[] { "Quyển sách", "Cái bút", "Cái bàn", "Cái ghế" }),
            CorrectIndex = 0,
            CorrectAnswer = "Quyển sách",
            ExplanationVi = "书 nghĩa là Quyển sách",
            CreatedAt = DateTime.UtcNow
        };

        db1.Users.Add(testUser);
        db1.AiGeneratedExercises.Add(exercise);
        await db1.SaveChangesAsync();

        try
        {
            var ai1 = new MockAIProvider();
            var ai2 = new MockAIProvider();
            var errorService1 = new AIErrorAnalysisService(db1, ai1);
            var errorService2 = new AIErrorAnalysisService(db2, ai2);

            var svc1 = new AIExerciseService(db1, ai1, new NoOpUsageLogger(), errorService1, NullLogger<AIExerciseService>.Instance);
            var svc2 = new AIExerciseService(db2, ai2, new NoOpUsageLogger(), errorService2, NullLogger<AIExerciseService>.Instance);

            // Run two submissions concurrently on separate DbContexts
            var task1 = svc1.SubmitAttemptAsync(testUser.Id, exercise.Id, new SubmitAiExerciseAttemptDto { SelectedIndex = 0 });
            var task2 = svc2.SubmitAttemptAsync(testUser.Id, exercise.Id, new SubmitAiExerciseAttemptDto { SelectedIndex = 0 });

            var results = await Task.WhenAll(task1, task2);

            Assert.NotNull(results[0]);
            Assert.NotNull(results[1]);
            Assert.True(results[0].IsCorrect);
            Assert.True(results[1].IsCorrect);
            Assert.Equal(results[0].AttemptId, results[1].AttemptId);

            // Verify EXACTLY one row exists in ai_exercise_attempts
            await using var verifyDb = CreateContext();
            var attemptsCount = await verifyDb.AiExerciseAttempts.CountAsync(a => a.UserId == testUser.Id && a.AiExerciseId == exercise.Id);
            Assert.Equal(1, attemptsCount);
        }
        finally
        {
            await using var cleanDb = CreateContext();
            var pra = await cleanDb.StudentPracticeAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            cleanDb.StudentPracticeAttempts.RemoveRange(pra);
            var aia = await cleanDb.AiExerciseAttempts.Where(a => a.UserId == testUser.Id).ToListAsync();
            cleanDb.AiExerciseAttempts.RemoveRange(aia);
            var exs = await cleanDb.AiGeneratedExercises.Where(e => e.UserId == testUser.Id).ToListAsync();
            cleanDb.AiGeneratedExercises.RemoveRange(exs);
            var u = await cleanDb.Users.FirstOrDefaultAsync(x => x.Id == testUser.Id);
            if (u != null) cleanDb.Users.Remove(u);
            await cleanDb.SaveChangesAsync();
        }
    }

    [Fact]
    public async Task ErrorAnalysis_DoesNotReturnCache_WhenUserAnswerIsDifferent()
    {
        await using var db = CreateContext();

        var testUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = $"cachediff_{Guid.NewGuid():N}@test.local",
            Email = $"cachediff_{Guid.NewGuid():N}@test.local",
            DisplayName = "Diff User",
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
            PromptZh = "请选择“水”的意思：",
            PromptPinyin = "shuǐ",
            PromptVi = "Chọn nghĩa của từ 水",
            OptionsJson = JsonSerializer.Serialize(new[] { "Nước", "Lửa", "Đất", "Gió" }),
            CorrectIndex = 0,
            CorrectAnswer = "Nước",
            ExplanationVi = "水 là nước",
            CreatedAt = DateTime.UtcNow
        };

        db.Users.Add(testUser);
        db.AiGeneratedExercises.Add(exercise);
        await db.SaveChangesAsync();

        try
        {
            var countingAi = new CountingAIProvider();
            var errorService = new AIErrorAnalysisService(db, countingAi);

            // 1. Analyze for answer "Lửa"
            var res1 = await errorService.AnalyzeErrorDetailAsync(testUser.Id, new RequestErrorAnalysisDto
            {
                ExerciseId = exercise.Id,
                UserAnswer = "Lửa"
            });
            Assert.NotNull(res1);
            Assert.Equal(1, countingAi.CallCount);

            // 2. Analyze for DIFFERENT answer "Đất" -> MUST call AI and NOT return "Lửa" cached analysis
            var res2 = await errorService.AnalyzeErrorDetailAsync(testUser.Id, new RequestErrorAnalysisDto
            {
                ExerciseId = exercise.Id,
                UserAnswer = "Đất"
            });
            Assert.NotNull(res2);
            Assert.Equal(2, countingAi.CallCount); // Incremented because answer is different!

            // 3. Retry same answer "Lửa" -> must hit cache and NOT call AI
            var res3 = await errorService.AnalyzeErrorDetailAsync(testUser.Id, new RequestErrorAnalysisDto
            {
                ExerciseId = exercise.Id,
                UserAnswer = "Lửa"
            });
            Assert.NotNull(res3);
            Assert.Equal(2, countingAi.CallCount); // Still 2!
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

    private sealed class FailingAIProvider : IAIProvider
    {
        public Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default)
        {
            throw new InvalidOperationException("Simulated AI Provider failure to force curated fallback.");
        }
    }

    private sealed class CountingAIProvider : IAIProvider
    {
        private readonly MockAIProvider _inner = new();
        public int CallCount { get; private set; }

        public Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default)
        {
            CallCount++;
            return _inner.GenerateContentAsync(request, cancellationToken);
        }
    }

    private sealed class NoOpUsageLogger : IAIUsageLogger
    {
        public Task LogAsync(Guid userId, string feature, AIProviderResponse? response, bool isSuccess, string? errorCode, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureWithinDailyBudgetAsync(Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}

