using ZhongWenHub.Business.Exams;

namespace ZhongWenHub.UnitTests;

public class ExamServiceTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(7)]
    [InlineData(9)]
    public void ValidateExamMetadata_RejectsOutOfRangeHsk20Levels(int hskLevel)
    {
        var ex = Assert.Throws<ArgumentException>(() =>
            ExamService.ValidateExamMetadata("HSK-TEST-01", "Đề kiểm tra", hskLevel, "MOCK", 40, 120));

        Assert.Contains("HSK 1 đến HSK 6", ex.Message);
    }

    [Theory]
    [InlineData(1)]
    [InlineData(2)]
    [InlineData(3)]
    [InlineData(4)]
    [InlineData(5)]
    [InlineData(6)]
    public void ValidateExamMetadata_AcceptsValidHsk20Levels(int hskLevel)
    {
        ExamService.ValidateExamMetadata($"HSK{hskLevel}-01", $"Đề HSK {hskLevel}", hskLevel, "MOCK", 45, 120);
    }

    [Fact]
    public void ValidateExamMetadata_RejectsInvalidDurationAndPassingScore()
    {
        Assert.Throws<ArgumentException>(() =>
            ExamService.ValidateExamMetadata("HSK1-01", "Đề HSK 1", 1, "MOCK", 0, 120));
        Assert.Throws<ArgumentException>(() =>
            ExamService.ValidateExamMetadata("HSK1-01", "Đề HSK 1", 1, "MOCK", 40, -1));
        Assert.Throws<ArgumentException>(() =>
            ExamService.ValidateExamMetadata("HSK1-01", "Đề HSK 1", 1, "INVALID_TYPE", 40, 120));
    }

    [Fact]
    public void ValidateCanPublishExam_BlocksSelfApprovalSkipWorkflowAndEmptyQuestions()
    {
        var authorId = Guid.NewGuid();
        var reviewerId = Guid.NewGuid();

        // Must be PENDING_REVIEW first
        Assert.Throws<InvalidOperationException>(() =>
            ExamService.ValidateCanPublishExam("DRAFT", authorId, reviewerId, 10));

        // Must have reviewer identity
        Assert.Throws<InvalidOperationException>(() =>
            ExamService.ValidateCanPublishExam("PENDING_REVIEW", authorId, null, 10));

        // Segregation of Duties: editor cannot self-approve
        Assert.Throws<InvalidOperationException>(() =>
            ExamService.ValidateCanPublishExam("PENDING_REVIEW", authorId, authorId, 10));

        // Must have at least 1 question
        Assert.Throws<InvalidOperationException>(() =>
            ExamService.ValidateCanPublishExam("PENDING_REVIEW", authorId, reviewerId, 0));

        // Valid case passes cleanly
        ExamService.ValidateCanPublishExam("PENDING_REVIEW", authorId, reviewerId, 5);
    }

    [Fact]
    public void ValidateDeleteAllowed_BlocksExamsWithAttemptsOrPublishedStatus()
    {
        Assert.Throws<InvalidOperationException>(() =>
            ExamService.ValidateDeleteAllowed("ARCHIVED", hasAttempts: true));

        Assert.Throws<InvalidOperationException>(() =>
            ExamService.ValidateDeleteAllowed("PUBLISHED", hasAttempts: false));

        // Draft or archived without student attempts may be deleted cleanly
        ExamService.ValidateDeleteAllowed("DRAFT", hasAttempts: false);
        ExamService.ValidateDeleteAllowed("ARCHIVED", hasAttempts: false);
    }
}

