using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Features.Teacher.DTOs;
using ZhongWenHub.Features.Teacher.Services;
using ZhongWenHub.Features.Admin.Users;
using ZhongWenHub.Data.Constants;
using ZhongWenHub.Models.Users;
using ZhongWenHub.Models.Teacher;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class StudentHomeworkServiceTests
{
    private class FakeCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; } = null;
        public string? Username { get; set; } = "test-student";
        public string? Email { get; set; } = "student@zhongwenhub.edu.vn";
        public bool IsAuthenticated { get; set; } = true;
        public IReadOnlyList<string> Roles { get; set; } = new List<string> { RoleConstants.Student };
    }

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task StartHomeworkAttemptAsync_StripsAnswerKeys_GuaranteesAntiCheat()
    {
        using var dbContext = CreateInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var cls = new TeachingClass { Id = Guid.NewGuid(), Name = "Lớp HSK 1", Code = "HSK1", TeacherId = teacherId };
        dbContext.TeachingClasses.Add(cls);

        var member = new TeachingClassMember { Id = Guid.NewGuid(), ClassId = cls.Id, StudentId = studentId, Status = "ACTIVE" };
        dbContext.TeachingClassMembers.Add(member);

        var assignment = new TeachingAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherId,
            Title = "Kiểm tra 15 phút",
            HskLevelId = "level-hsk-1",
            Status = "PUBLISHED",
            MaxAttempts = 3,
            Questions = new List<AssignmentQuestion>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Prompt = "Nghĩa của '谢谢' là gì?",
                    QuestionType = "SINGLE_CHOICE",
                    OptionsJson = "[\"Cảm ơn\",\"Tạm biệt\",\"Xin lỗi\"]",
                    CorrectAnswer = "Cảm ơn",
                    Explanation = "Xie Xie nghĩa là cảm ơn",
                    Points = 10
                }
            },
            Targets = new List<AssignmentTarget>
            {
                new() { Id = Guid.NewGuid(), ClassId = cls.Id, DueDate = DateTime.UtcNow.AddDays(3) }
            }
        };
        dbContext.TeachingAssignments.Add(assignment);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = studentId };
        var service = new StudentHomeworkService(dbContext, currentUserService, NullLogger<StudentHomeworkService>.Instance);

        var result = await service.StartHomeworkAttemptAsync(assignment.Id);

        Assert.NotNull(result);
        Assert.Single(result.Questions);
        var q = result.Questions[0];
        Assert.Equal("Nghĩa của '谢谢' là gì?", q.Prompt);
        Assert.Equal(3, q.Options?.Count ?? 0);

        // Security assertion: Student taking DTO must NEVER contain answer key fields
        var takingType = typeof(StudentTakingQuestionDto);
        Assert.Null(takingType.GetProperty("CorrectAnswer"));
        Assert.Null(takingType.GetProperty("Explanation"));
    }

    [Fact]
    public async Task SubmitHomeworkAsync_ObjectiveQuestions_AutoGradesAndCalculatesScore()
    {
        using var dbContext = CreateInMemoryDbContext();
        var studentId = Guid.NewGuid();
        var teacherId = Guid.NewGuid();

        var cls = new TeachingClass { Id = Guid.NewGuid(), Name = "Lớp HSK 2", Code = "HSK2", TeacherId = teacherId };
        dbContext.TeachingClasses.Add(cls);

        var member = new TeachingClassMember { Id = Guid.NewGuid(), ClassId = cls.Id, StudentId = studentId, Status = "ACTIVE" };
        dbContext.TeachingClassMembers.Add(member);

        var q1Id = Guid.NewGuid();
        var q2Id = Guid.NewGuid();

        var assignment = new TeachingAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherId,
            Title = "Luyện tập HSK 2",
            HskLevelId = "level-hsk-2",
            Status = "PUBLISHED",
            PassingPoints = 60.0,
            ShowCorrectAnswers = true,
            Questions = new List<AssignmentQuestion>
            {
                new()
                {
                    Id = q1Id,
                    Prompt = "Câu 1",
                    QuestionType = "SINGLE_CHOICE",
                    OptionsJson = "[\"A\",\"B\"]",
                    CorrectAnswer = "A",
                    Points = 10
                },
                new()
                {
                    Id = q2Id,
                    Prompt = "Câu 2",
                    QuestionType = "TRUE_FALSE",
                    OptionsJson = "[\"Đúng\",\"Sai\"]",
                    CorrectAnswer = "Đúng",
                    Points = 10
                }
            },
            Targets = new List<AssignmentTarget>
            {
                new() { Id = Guid.NewGuid(), ClassId = cls.Id, DueDate = DateTime.UtcNow.AddDays(2) }
            }
        };
        dbContext.TeachingAssignments.Add(assignment);

        var submission = new StudentAssignmentSubmission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment.Id,
            StudentId = studentId,
            ClassId = cls.Id,
            Status = "IN_PROGRESS",
            StartedAt = DateTime.UtcNow.AddMinutes(-10),
            StudentAnswersJson = "[]"
        };
        dbContext.StudentAssignmentSubmissions.Add(submission);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = studentId };
        var service = new StudentHomeworkService(dbContext, currentUserService, NullLogger<StudentHomeworkService>.Instance);

        var submitDto = new SubmitHomeworkDto
        {
            TimeSpentSeconds = 300,
            Answers = new List<StudentAnswerItemDto>
            {
                new() { QuestionId = q1Id, SelectedOption = "A" },     // Correct: 10/10
                new() { QuestionId = q2Id, SelectedOption = "Sai" }   // Incorrect: 0/10
            }
        };

        var result = await service.SubmitHomeworkAsync(submission.Id, submitDto);

        Assert.NotNull(result);
        // Total points earned: 10 out of 20 -> 50%
        Assert.Equal(50.0, result.Score);
        Assert.False(result.IsPassed); // Passing is 60.0%
        Assert.Equal("GRADED", result.Status); // No essay -> auto GRADED
        Assert.NotNull(result.ReviewQuestions);
        Assert.Equal(2, result.ReviewQuestions.Count);

        var q1Review = result.ReviewQuestions.First(r => r.QuestionId == q1Id);
        Assert.True(q1Review.IsCorrect);
        Assert.Equal(10.0, q1Review.PointsEarned);

        var q2Review = result.ReviewQuestions.First(r => r.QuestionId == q2Id);
        Assert.False(q2Review.IsCorrect);
        Assert.Equal(0.0, q2Review.PointsEarned);
    }
}
