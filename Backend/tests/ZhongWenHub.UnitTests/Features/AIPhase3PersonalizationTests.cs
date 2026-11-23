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
