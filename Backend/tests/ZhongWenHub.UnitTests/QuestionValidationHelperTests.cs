using ZhongWenHub.Business.QuestionBank.Helpers;
using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.UnitTests;

public class QuestionValidationHelperTests
{
    [Fact]
    public void NormalizeAnswerText_HandlesUnicodeNfkcPunctuationAndPinyin()
    {
        var raw = "  火车站。！？ ";
        var fullwidth = "火车站（）";
        var parenthetical = QuestionValidationHelper.StripParentheticalNote("火车站 (huǒchēzhàn)");

        Assert.Equal("火车站", QuestionValidationHelper.NormalizeAnswerText(raw));
        Assert.Equal("火车站", QuestionValidationHelper.NormalizeAnswerText(fullwidth));
        Assert.Equal("火车站", QuestionValidationHelper.NormalizeAnswerText(parenthetical));
    }

    [Fact]
    public void ComputeContentHash_IsStableAcrossTypeAliasesAndWhitespace()
    {
        var h1 = QuestionValidationHelper.ComputeContentHash(
            2, "fill-in-the-blank", "我每天____去学校。", "Điền từ", "坐车。");
        var h2 = QuestionValidationHelper.ComputeContentHash(
            2, "fill-blank", "我每天 ____ 去学校", "Điền từ!", "坐车");

        Assert.Equal(h1, h2);
        Assert.Equal(64, h1.Length);
    }

    [Fact]
    public void ValidateQuestion_RejectsPlaceholdersAndDuplicateOptions()
    {
        var placeholder = QuestionValidationHelper.ValidateQuestion(
            "multiple-choice", "vocabulary", 1, "EASY",
            "Sample TODO", "Chọn đáp án", "Lorem ipsum", null, null, null,
            "[\"A\",\"B\",\"C\",\"D\"]", 0, "A", "Giải thích chi tiết", null);

        Assert.False(placeholder.IsValid);
        Assert.Contains(placeholder.Errors, e => e.Contains("placeholder", StringComparison.OrdinalIgnoreCase));

        var dupOptions = QuestionValidationHelper.ValidateQuestion(
            "multiple-choice", "vocabulary", 1, "EASY",
            "Câu hỏi HSK 1", "Chọn nghĩa đúng", "你好", "nǐ hǎo", "Chào hỏi", null,
            "[\"Xin chào\",\"Xin chào！\",\"Cảm ơn\",\"Tạm biệt\"]", 0, "Xin chào", "Chào buổi sáng/chiều", "hsk1");

        Assert.False(dupOptions.IsValid);
        Assert.Contains(dupOptions.Errors, e => e.Contains("trùng lặp", StringComparison.OrdinalIgnoreCase));
    }

    [Fact]
    public void GradeSubmission_MatchesMcqSentenceOrderAndFreeTextDeterministically()
    {
        var mcq = new ExerciseEntity
        {
            Type = "multiple-choice",
            OptionsJson = "[\"Tôi\",\"Bạn\",\"Anh ấy\",\"Cô ấy\"]",
            CorrectOptionIndex = 0,
            CorrectAnswer = "Tôi"
        };
        Assert.True(QuestionValidationHelper.GradeSubmission(mcq, 0, null, null, null).IsCorrect);
        Assert.False(QuestionValidationHelper.GradeSubmission(mcq, 2, null, null, null).IsCorrect);

        var order = new ExerciseEntity
        {
            Type = "sentence-order",
            PromptHanzi = "[学校] [我] [去]",
            CorrectAnswer = "我去学校。"
        };
        Assert.True(QuestionValidationHelper.GradeSubmission(order, null, ["我", "去", "学校"], null, null).IsCorrect);
        Assert.False(QuestionValidationHelper.GradeSubmission(order, null, ["去", "我", "学校"], null, null).IsCorrect);

        var fill = new ExerciseEntity
        {
            Type = "fill-blank",
            CorrectAnswer = "火车站 (huǒchēzhàn)"
        };
        Assert.True(QuestionValidationHelper.GradeSubmission(fill, null, null, null, "火车站。").IsCorrect);
        Assert.False(QuestionValidationHelper.GradeSubmission(fill, null, null, null, "飞机场").IsCorrect);
    }
}

