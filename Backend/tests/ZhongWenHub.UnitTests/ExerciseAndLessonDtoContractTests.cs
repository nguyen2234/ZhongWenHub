using System.ComponentModel.DataAnnotations;
using ZhongWenHub.Business.Content.DTOs;
using ZhongWenHub.Business.Learning.DTOs;

namespace ZhongWenHub.UnitTests;

public class ExerciseAndLessonDtoContractTests
{
    [Fact]
    public void CompleteLessonDto_AllowsZeroQuizQuestions_WhenLessonHasExercisesOnly()
    {
        var dto = new CompleteLessonDto
        {
            QuizScore = 0,
            TotalQuizQuestions = 0,
            XpEarned = 100,
        };

        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);

        Assert.True(isValid);
        Assert.Empty(results);
    }

    [Fact]
    public void RecordPracticeAttemptDto_AllowsNullUserAnswer_WithoutValidationError()
    {
        var dto = new RecordPracticeAttemptDto
        {
            ExerciseId = Guid.NewGuid().ToString(),
            KnowledgePointId = "kp-1",
            TopicTitle = "Từ vựng",
            Category = "vocabulary",
            HskLevel = 2,
            UserAnswer = null,
            IsCorrect = false,
        };

        var results = new List<ValidationResult>();
        var isValid = Validator.TryValidateObject(dto, new ValidationContext(dto), results, validateAllProperties: true);

        Assert.True(isValid);
        Assert.Empty(results);
    }

    [Fact]
    public void LessonDetailDto_ExposesHskLevelAndUnitNumberDefaults()
    {
        var dto = new LessonDetailDto();
        Assert.Equal(1, dto.HskLevel);
        Assert.Equal(1, dto.UnitNumber);
    }
}
