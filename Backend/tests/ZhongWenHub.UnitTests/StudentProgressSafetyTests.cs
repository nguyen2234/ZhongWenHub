using System;
using Xunit;
using ZhongWenHub.Business.Learning;
using ZhongWenHub.Business.Learning.DTOs;
using ZhongWenHub.Data.Entities.Learning;

namespace ZhongWenHub.UnitTests;

public class StudentProgressSafetyTests
{
    [Theory]
    [InlineData("les-1", LearningService.Lesson1Guid)]
    [InlineData("LES-1", LearningService.Lesson1Guid)]
    [InlineData("  les-1  ", LearningService.Lesson1Guid)]
    [InlineData("AAAAAAAA-1111-1111-1111-111111111111", LearningService.Lesson1Guid)]
    [InlineData("aaaaaaaa-1111-1111-1111-111111111111", LearningService.Lesson1Guid)]
    [InlineData("  AAAAAAAA-2222-2222-2222-222222222222  ", "aaaaaaaa-2222-2222-2222-222222222222")]
    public void NormalizeLessonId_ValidInputs_ReturnsNormalizedGuid(string input, string expected)
    {
        var result = LearningService.NormalizeLessonId(input);
        Assert.Equal(expected, result);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void NormalizeLessonId_NullOrWhitespace_ReturnsEmptyString(string? input)
    {
        var result = LearningService.NormalizeLessonId(input);
        Assert.Equal(string.Empty, result);
    }

    [Theory]
    [InlineData("les-1", true)]
    [InlineData("LES-1", true)]
    [InlineData("aaaaaaaa-1111-1111-1111-111111111111", true)]
    [InlineData("AAAAAAAA-1111-1111-1111-111111111111", true)]
    [InlineData("les-2", false)]
    [InlineData("aaaaaaaa-2222-2222-2222-222222222222", false)]
    [InlineData(null, false)]
    [InlineData("", false)]
    public void IsLesson1_IdentifiesLesson1Correctly(string? input, bool expected)
    {
        var result = LearningService.IsLesson1(input);
        Assert.Equal(expected, result);
    }

    [Fact]
    public void EntityAndDtoDefaults_UseLesson1Guid_InsteadOfLegacyString()
    {
        var profile = new StudentLearningProfile();
        Assert.Equal(LearningService.Lesson1Guid, profile.CurrentLessonId);

        var stateDto = new StudentLearningStateDto();
        Assert.Equal(LearningService.Lesson1Guid, stateDto.CurrentLessonId);
    }

    [Theory]
    [InlineData("DRAFT")]
    [InlineData("PENDING_REVIEW")]
    [InlineData("ARCHIVED")]
    [InlineData(null)]
    [InlineData("")]
    public void EnsureLessonPublishedOrThrow_NonPublishedLesson_ThrowsKeyNotFound(string? status)
    {
        Assert.Throws<KeyNotFoundException>(() =>
            LearningService.EnsureLessonPublishedOrThrow(status, "aaaaaaaa-4444-4444-4444-444444444444"));
    }

    [Fact]
    public void EnsureLessonPublishedOrThrow_PublishedLesson_DoesNotThrow()
    {
        LearningService.EnsureLessonPublishedOrThrow("PUBLISHED", LearningService.Lesson1Guid);
        LearningService.EnsureLessonPublishedOrThrow("published", LearningService.Lesson1Guid);
    }

    [Theory]
    [InlineData(0, 50)]
    [InlineData(-100, 50)]
    [InlineData(20, 20)]
    [InlineData(99999, 200)]
    public void ResolveServerLessonXp_ClampsAndDefaults(int dbXpReward, int expected)
    {
        Assert.Equal(expected, LearningService.ResolveServerLessonXp(dbXpReward));
    }

    [Theory]
    [InlineData(0, 5, 5)]
    [InlineData(5, 5, 25)]
    [InlineData(100, 5, 25)]
    [InlineData(100, 100, 100)]
    public void ResolvePracticeSessionXp_PreventsClientSpoofing(int correct, int total, int expected)
    {
        Assert.Equal(expected, LearningService.ResolvePracticeSessionXp(correct, total));
    }

    [Theory]
    [InlineData(0, 5)]
    [InlineData(10, 30)]
    [InlineData(9999, 60)]
    public void ResolveSrsSessionXp_BoundsReviewedWords(int reviewedCount, int expected)
    {
        Assert.Equal(expected, LearningService.ResolveSrsSessionXp(reviewedCount));
    }
}
