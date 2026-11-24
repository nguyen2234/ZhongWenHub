using System.ComponentModel.DataAnnotations;
using Microsoft.EntityFrameworkCore;
using ZhongWenHub.Features.Content;
using ZhongWenHub.Features.Content.DTOs;
using ZhongWenHub.Features.Student.Learning.DTOs;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Persistence;

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

    [Fact]
    public async Task UpdateDraftLesson_PersistsNewQuizExerciseAcrossRetries_AndCanUnlinkIt()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        await using var db = new ApplicationDbContext(options);
        var course = new CourseEntity { HskLevel = 3, Status = "PUBLISHED" };
        var lesson = new LessonEntity { CourseId = course.Id, Status = "DRAFT" };
        db.AddRange(course, lesson);
        await db.SaveChangesAsync();

        var exerciseId = Guid.NewGuid();
        var edit = new LessonExerciseEditDto
        {
            Id = exerciseId,
            IsNew = true,
            Content = new CreateExerciseDto { Title = "Câu hỏi mới", Instruction = "Chọn đáp án đúng." },
            Presentation = new LessonExercisePresentationDto { Section = "QUIZ", DisplayOrder = 1, Points = 15 },
        };
        var update = new UpdateLessonDto
        {
            TitleZh = "你好",
            TitleVi = "Xin chào",
            LinkedExerciseIds = [exerciseId],
            ExerciseEdits = [edit],
        };
        var service = new ContentService(db);

        var result = await service.UpdateLessonAsync(lesson.Id, update);
        Assert.Equal("DRAFT", result!.Status);
        db.ChangeTracker.Clear();
        await service.UpdateLessonAsync(lesson.Id, update);
        db.ChangeTracker.Clear();

        var detail = await service.GetLessonByIdAsync(lesson.Id);
        var question = Assert.Single(detail!.Exercises);
        Assert.Equal(exerciseId, question.Id);
        Assert.Equal("Câu hỏi mới", question.Title);
        Assert.Equal(3, question.HskLevel);
        Assert.Equal("DRAFT", question.Status);
        Assert.Contains("\"section\":\"QUIZ\"", question.LessonPresentationJson);
        Assert.Contains("\"points\":15", question.LessonPresentationJson);

        edit.IsNew = false;
        edit.Content.Title = "Câu hỏi đã sửa";
        await service.UpdateLessonAsync(lesson.Id, update);
        db.ChangeTracker.Clear();
        Assert.Equal("Câu hỏi đã sửa", (await db.Exercises.SingleAsync()).Title);

        update.LinkedExerciseIds = [];
        update.ExerciseEdits = [];
        await service.UpdateLessonAsync(lesson.Id, update);
        db.ChangeTracker.Clear();
        Assert.Empty((await service.GetLessonByIdAsync(lesson.Id))!.Exercises);
        Assert.Null((await db.Exercises.SingleAsync()).LessonId);
    }
}
