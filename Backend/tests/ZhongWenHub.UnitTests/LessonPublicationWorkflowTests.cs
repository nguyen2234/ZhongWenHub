using ZhongWenHub.Business.Content;
using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.UnitTests;

public class LessonPublicationWorkflowTests
{
    private static LessonEntity BuildCompleteLesson(string status = "DRAFT", Guid? updatedBy = null)
    {
        return new LessonEntity
        {
            Id = Guid.NewGuid(),
            CourseId = Guid.NewGuid(),
            LessonNumber = 4,
            TitleZh = "他是我的汉语老师",
            TitleVi = "Thầy ấy là giáo viên tiếng Trung của tôi",
            Status = status,
            UpdatedByUserId = updatedBy,
            DialogueJson = "{\"lines\":[{\"speaker\":\"A\",\"hanzi\":\"他是谁？\",\"pinyin\":\"Tā shì shéi?\",\"meaningVi\":\"Anh ấy là ai?\"},{\"speaker\":\"B\",\"hanzi\":\"他是我的老师。\",\"pinyin\":\"Tā shì wǒ de lǎoshī.\",\"meaningVi\":\"Thầy ấy là giáo viên của tôi.\"}]}",
            ListeningJson = "[{\"prompt\":\"Nghe đoạn hội thoại\",\"transcriptZh\":\"他是我的老师。\",\"transcriptPinyin\":\"Tā shì wǒ de lǎoshī.\",\"transcriptVi\":\"Thầy ấy là giáo viên của tôi.\"}]",
        };
    }

    [Fact]
    public void EvaluateLessonReleaseReadiness_BlocksWhenVocabBelowMinimumOrMissingSections()
    {
        var lesson = BuildCompleteLesson();

        // Vocab = 0 (< 5) -> BLOCKED
        var zeroVocab = ContentService.EvaluateLessonReleaseReadiness(lesson, vocabCount: 0, grammarCount: 5, exerciseCount: 4);
        Assert.False(zeroVocab.IsReadyForPublish);
        Assert.Equal("BLOCKED", zeroVocab.ReadinessState);
        Assert.Contains(zeroVocab.BlockerReasons, r => r.Contains("hiện có: 0"));

        // Vocab = 3 (< 5) -> BLOCKED
        var threeVocab = ContentService.EvaluateLessonReleaseReadiness(lesson, vocabCount: 3, grammarCount: 5, exerciseCount: 4);
        Assert.False(threeVocab.IsReadyForPublish);
        Assert.Equal("BLOCKED", threeVocab.ReadinessState);

        // Hanzi leak in pinyin -> BLOCKED
        var badDialogueLesson = BuildCompleteLesson();
        badDialogueLesson.DialogueJson = "{\"lines\":[{\"pinyin\":\"你好\",\"meaningVi\":\"Xin chào\"},{\"pinyin\":\"xièxie\",\"meaningVi\":\"Cảm ơn\"}]}";
        var leakResult = ContentService.EvaluateLessonReleaseReadiness(badDialogueLesson, vocabCount: 10, grammarCount: 2, exerciseCount: 2);
        Assert.False(leakResult.DialogueValid);
        Assert.False(leakResult.IsReadyForPublish);

        // '(Bản thảo)' placeholder label -> BLOCKED
        var draftLabelLesson = BuildCompleteLesson();
        draftLabelLesson.TitleVi = "Thầy ấy là giáo viên tiếng Trung của tôi (Bản thảo)";
        var draftLabelResult = ContentService.EvaluateLessonReleaseReadiness(draftLabelLesson, vocabCount: 10, grammarCount: 2, exerciseCount: 2);
        Assert.False(draftLabelResult.IsReadyForPublish);
        Assert.Equal("BLOCKED", draftLabelResult.ReadinessState);
        Assert.Contains(draftLabelResult.BlockerReasons, r => r.Contains("Bản thảo"));

        // Unpublished parent Unit -> BLOCKED
        var draftUnitLesson = BuildCompleteLesson();
        draftUnitLesson.Unit = new UnitEntity { Id = Guid.NewGuid(), UnitNumber = 3, TitleVi = "Unit 3", Status = "DRAFT" };
        var draftUnitResult = ContentService.EvaluateLessonReleaseReadiness(draftUnitLesson, vocabCount: 10, grammarCount: 2, exerciseCount: 2);
        Assert.False(draftUnitResult.IsReadyForPublish);
        Assert.Equal("BLOCKED", draftUnitResult.ReadinessState);
        Assert.Contains(draftUnitResult.BlockerReasons, r => r.Contains("Unit 3"));
    }

    [Fact]
    public void EvaluateLessonReleaseReadiness_MarksReadyToPublishWhenAllFiveGatesPass()
    {
        var lesson = BuildCompleteLesson(status: "DRAFT");
        var readiness = ContentService.EvaluateLessonReleaseReadiness(lesson, vocabCount: 15, grammarCount: 5, exerciseCount: 4);

        Assert.True(readiness.IsReadyForPublish);
        Assert.True(readiness.DialogueValid);
        Assert.True(readiness.ListeningValid);
        Assert.Empty(readiness.BlockerReasons);
        Assert.Equal("READY_TO_PUBLISH", readiness.ReadinessState);
    }

    [Fact]
    public void ValidateLessonPublishTransition_EnforcesWorkflowSegregationAndReadiness()
    {
        var editorId = Guid.NewGuid();
        var reviewerId = Guid.NewGuid();

        var readyLesson = BuildCompleteLesson(status: "PENDING_REVIEW", updatedBy: editorId);
        var readyDto = ContentService.EvaluateLessonReleaseReadiness(readyLesson, vocabCount: 18, grammarCount: 5, exerciseCount: 3);

        // 1. Cannot skip PENDING_REVIEW (DRAFT -> PUBLISHED blocked)
        var draftLesson = BuildCompleteLesson(status: "DRAFT", updatedBy: editorId);
        Assert.Throws<InvalidOperationException>(() =>
            ContentService.ValidateLessonPublishTransition(draftLesson, reviewerId, readyDto));

        // 2. Cannot self-approve (Segregation of Duties)
        Assert.Throws<InvalidOperationException>(() =>
            ContentService.ValidateLessonPublishTransition(readyLesson, editorId, readyDto));

        // 3. Cannot publish without reviewer identity
        Assert.Throws<InvalidOperationException>(() =>
            ContentService.ValidateLessonPublishTransition(readyLesson, null, readyDto));

        // 4. Cannot publish BLOCKED lesson
        var blockedDto = ContentService.EvaluateLessonReleaseReadiness(readyLesson, vocabCount: 0, grammarCount: 5, exerciseCount: 3);
        Assert.Throws<InvalidOperationException>(() =>
            ContentService.ValidateLessonPublishTransition(readyLesson, reviewerId, blockedDto));

        // 5. Separate reviewer + PENDING_REVIEW + READY succeeds
        ContentService.ValidateLessonPublishTransition(readyLesson, reviewerId, readyDto);
    }
}

