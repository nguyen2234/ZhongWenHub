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

public class TeacherAssignmentServiceTests
{
    private class FakeCurrentUserService : ICurrentUserService
    {
        public Guid? UserId { get; set; } = null;
        public string? Username { get; set; } = "test-teacher";
        public string? Email { get; set; } = "teacher@zhongwenhub.edu.vn";
        public bool IsAuthenticated { get; set; } = true;
        public IReadOnlyList<string> Roles { get; set; } = new List<string> { RoleConstants.Teacher };
    }

    private static ApplicationDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task CreateAssignmentAsync_ValidDto_CreatesWithTargetsAndQuestions()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();

        var cls = new TeachingClass
        {
            Id = Guid.NewGuid(),
            Name = "HSK 1 Cơ Bản",
            Code = "HSK1-01",
            TeacherId = teacherId,
            Capacity = 20
        };
        dbContext.TeachingClasses.Add(cls);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = teacherId };
        var service = new TeacherAssignmentService(dbContext, currentUserService, NullLogger<TeacherAssignmentService>.Instance);

        var dto = new CreateAssignmentDto
        {
            Title = "Bài tập tuần 1: Chào hỏi",
            Description = "Luyện tập đại từ và phát âm",
            HskLevelId = "level-hsk-1",
            TimeLimitMinutes = 30,
            MaxAttempts = 2,
            ClassIds = new List<Guid> { cls.Id },
            DueDate = DateTime.UtcNow.AddDays(7),
            Questions = new List<CreateAssignmentQuestionDto>
            {
                new()
                {
                    Prompt = "Chọn pinyin đúng cho '你好':",
                    QuestionType = "SINGLE_CHOICE",
                    Options = new List<string> { "nǐ hǎo", "nǐ hao", "lí hǎo", "mǐ hǎo" },
                    CorrectAnswer = "nǐ hǎo",
                    Points = 10,
                    Explanation = "Ni (thanh 3) + Hao (thanh 3)"
                }
            }
        };

        var result = await service.CreateAssignmentAsync(dto);

        Assert.NotNull(result);
        Assert.Equal("DRAFT", result.Status);
        Assert.Equal(teacherId, result.TeacherId);
        Assert.Equal("Bài tập tuần 1: Chào hỏi", result.Title);
        Assert.Equal(1, result.QuestionsCount);
        Assert.Equal(10, result.TotalPoints);

        // Verify in DB
        var savedAssignment = await dbContext.TeachingAssignments
            .Include(a => a.Questions)
            .Include(a => a.Targets)
            .FirstOrDefaultAsync(a => a.Id == result.Id);

        Assert.NotNull(savedAssignment);
        Assert.Single(savedAssignment.Questions);
        Assert.Single(savedAssignment.Targets);
        Assert.Equal(cls.Id, savedAssignment.Targets.First().ClassId);
    }

    [Fact]
    public async Task PublishAssignmentAsync_NonOwner_ThrowsUnauthorizedAccessException()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacher1Id = Guid.NewGuid();
        var teacher2Id = Guid.NewGuid();

        var assignment = new TeachingAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacher1Id,
            Title = "Bài tập HSK 2",
            HskLevelId = "level-hsk-2",
            Status = "DRAFT"
        };
        dbContext.TeachingAssignments.Add(assignment);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = teacher2Id };
        var service = new TeacherAssignmentService(dbContext, currentUserService, NullLogger<TeacherAssignmentService>.Instance);

        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.PublishAssignmentAsync(assignment.Id));
    }

    [Fact]
    public async Task PublishAssignmentAsync_ValidDraft_TransitionsToPublished()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();

        var cls = new TeachingClass
        {
            Id = Guid.NewGuid(),
            Name = "HSK 3 Chuẩn",
            Code = "HSK3-STD",
            TeacherId = teacherId
        };
        dbContext.TeachingClasses.Add(cls);

        var assignment = new TeachingAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherId,
            Title = "Đọc hiểu HSK 3",
            HskLevelId = "level-hsk-3",
            Status = "DRAFT",
            Questions = new List<AssignmentQuestion>
            {
                new()
                {
                    Id = Guid.NewGuid(),
                    Prompt = "Câu 1",
                    QuestionType = "SINGLE_CHOICE",
                    OptionsJson = "[\"A\",\"B\"]",
                    CorrectAnswer = "A",
                    Points = 5
                }
            },
            Targets = new List<AssignmentTarget>
            {
                new() { Id = Guid.NewGuid(), ClassId = cls.Id }
            }
        };
        dbContext.TeachingAssignments.Add(assignment);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = teacherId };
        var service = new TeacherAssignmentService(dbContext, currentUserService, NullLogger<TeacherAssignmentService>.Instance);

        var result = await service.PublishAssignmentAsync(assignment.Id);

        Assert.Equal("PUBLISHED", result.Status);
        Assert.NotNull(result.PublishedAt);

        var inDb = await dbContext.TeachingAssignments.FindAsync(assignment.Id);
        Assert.Equal("PUBLISHED", inDb!.Status);
    }

    [Fact]
    public async Task GradeSubmissionAsync_UpdatesScoreAndStatus()
    {
        using var dbContext = CreateInMemoryDbContext();
        var teacherId = Guid.NewGuid();
        var studentId = Guid.NewGuid();

        var student = new ApplicationUser { Id = studentId, UserName = "student", DisplayName = "Học sinh A" };
        dbContext.Users.Add(student);

        var cls = new TeachingClass { Id = Guid.NewGuid(), Name = "Lớp 1", Code = "L1", TeacherId = teacherId };
        dbContext.TeachingClasses.Add(cls);

        var assignment = new TeachingAssignment
        {
            Id = Guid.NewGuid(),
            TeacherId = teacherId,
            Title = "Bài viết tự luận",
            HskLevelId = "level-hsk-3",
            Status = "PUBLISHED"
        };
        dbContext.TeachingAssignments.Add(assignment);

        var submission = new StudentAssignmentSubmission
        {
            Id = Guid.NewGuid(),
            AssignmentId = assignment.Id,
            StudentId = studentId,
            ClassId = cls.Id,
            Status = "GRADING",
            Score = 50.0,
            MaxScore = 100.0,
            StudentAnswersJson = "[]"
        };
        dbContext.StudentAssignmentSubmissions.Add(submission);
        await dbContext.SaveChangesAsync();

        var currentUserService = new FakeCurrentUserService { UserId = teacherId };
        var service = new TeacherAssignmentService(dbContext, currentUserService, NullLogger<TeacherAssignmentService>.Instance);

        var gradeDto = new GradeSubmissionDto
        {
            CustomScore = 85.0,
            FeedbackNote = "Bài viết rất tốt, ngữ pháp chuẩn."
        };

        var result = await service.GradeSubmissionAsync(submission.Id, gradeDto);

        Assert.NotNull(result);
        Assert.Equal(85.0, result.Score);
        Assert.Equal("GRADED", result.Status);
        Assert.Equal("Bài viết rất tốt, ngữ pháp chuẩn.", result.FeedbackNote);

        var inDb = await dbContext.StudentAssignmentSubmissions.FindAsync(submission.Id);
        Assert.Equal(85.0, inDb!.Score);
        Assert.Equal("GRADED", inDb.Status);
        Assert.Equal(teacherId, inDb.GradedByTeacherId);
    }
}
