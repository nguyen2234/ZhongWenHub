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

    [Fact]
    public void Phase2_ExplanationAndPublishGates_RejectTautologiesAndUnapprovedReviewStatus()
    {
        Assert.False(QuestionValidationHelper.HasSubstantiveExplanation("Đáp án đúng là '朋友'.", "朋友"));
        Assert.False(QuestionValidationHelper.HasSubstantiveExplanation("Đáp án đúng là '吃饭' (HSK 4 TEST-01).", "吃饭"));
        Assert.False(QuestionValidationHelper.HasSubstantiveExplanation("Chữ đúng.", "好"));
        Assert.True(QuestionValidationHelper.HasSubstantiveExplanation(
            "\"朋友\" (péngyou) là danh từ chỉ bạn bè; các phương án khác chỉ thành viên gia đình nên không phù hợp ngữ cảnh.",
            "朋友"));

        Assert.Equal("VALIDATED", QuestionValidationHelper.NormalizeReviewStatus("validated"));
        Assert.Equal("NEEDS_ACADEMIC_REVIEW", QuestionValidationHelper.NormalizeReviewStatus("needs_academic_review"));

        var valFail = QuestionValidationHelper.ValidateQuestion(
            "multiple-choice", "vocabulary", 1, "EASY",
            "HSK 1 - Từ vựng", "Chọn đáp án đúng.", "朋友", "péngyou", null, null,
            "[\"Bạn bè\",\"Thầy giáo\",\"Học sinh\",\"Bác sĩ\"]", 0, "Bạn bè", "Đáp án đúng là 'Bạn bè'.", null);
        Assert.False(QuestionValidationHelper.IsPublishQualified(valFail, "Đáp án đúng là 'Bạn bè'.", "Bạn bè", out _));

        const string substantiveExp = "Từ '朋友' (péngyou) mang nghĩa bạn bè. 'Thầy giáo' (老师), 'Học sinh' (学生) và 'Bác sĩ' (医生) thuộc nhóm nghề nghiệp.";
        var valPass = QuestionValidationHelper.ValidateQuestion(
            "multiple-choice", "vocabulary", 1, "EASY",
            "HSK 1 - Từ vựng", "Chọn đáp án đúng.", "朋友", "péngyou", null, null,
            "[\"Bạn bè\",\"Thầy giáo\",\"Học sinh\",\"Bác sĩ\"]", 0, "Bạn bè", substantiveExp, null);
        Assert.True(QuestionValidationHelper.IsPublishQualified(valPass, substantiveExp, "Bạn bè", out _));
    }
}

