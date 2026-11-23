using ZhongWenHub.Business.Content;
using ZhongWenHub.Business.Content.DTOs;

namespace ZhongWenHub.UnitTests;

public class CurriculumCreationRulesTests
{
    [Theory]
    [InlineData(1, 15)]
    [InlineData(2, 15)]
    [InlineData(3, 20)]
    [InlineData(4, 20)]
    [InlineData(5, null)]
    [InlineData(6, null)]
    public void ResolveStandardCurriculumLimit_MatchesHsk20Structure(int hskLevel, int? expectedLimit)
    {
        Assert.Equal(expectedLimit, ContentService.ResolveStandardCurriculumLimit(hskLevel));
    }

    [Fact]
    public void CreateLessonDto_DefaultsStatusToDraft()
    {
        var dto = new CreateLessonDto();
        Assert.Equal("DRAFT", dto.Status);
        Assert.False(dto.AllowExceedStandardLimit);
    }

    [Fact]
    public void ValidateAndNormalizeNewLessonCreation_BlocksDirectPublishedAndNormalizesDraft()
    {
        Assert.Throws<InvalidOperationException>(() =>
            ContentService.ValidateAndNormalizeNewLessonCreation(1, 3, "PUBLISHED", false));

        var normalized = ContentService.ValidateAndNormalizeNewLessonCreation(1, 3, null, false);
        Assert.Equal("DRAFT", normalized);

        var archivedFallback = ContentService.ValidateAndNormalizeNewLessonCreation(2, 5, "ARCHIVED", false);
        Assert.Equal("DRAFT", archivedFallback);
    }

    [Fact]
    public void ValidateAndNormalizeNewLessonCreation_BlocksUnconfirmedLesson16OnHsk1AndAllowsExplicitOverride()
    {
        var ex = Assert.Throws<InvalidOperationException>(() =>
            ContentService.ValidateAndNormalizeNewLessonCreation(1, 15, "DRAFT", false));
        Assert.Contains("HSK 1", ex.Message);
        Assert.Contains("15/15", ex.Message);

        var allowed = ContentService.ValidateAndNormalizeNewLessonCreation(1, 15, "DRAFT", true);
        Assert.Equal("DRAFT", allowed);
    }
}

