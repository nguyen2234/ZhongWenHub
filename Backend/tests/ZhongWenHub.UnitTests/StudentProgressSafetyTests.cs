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
}
