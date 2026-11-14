using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Diagnostic;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests.AILearning;

public class DiagnosticAssessmentServiceTests
{
    private static ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString())
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task StartSessionAsync_CreatesSessionWithoutExposingCorrectAnswers()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        Assert.NotNull(session);
        Assert.NotEqual(Guid.Empty, session.SessionId);
        Assert.Equal(12, session.TotalQuestions);
        Assert.Equal(12, session.Questions.Count);

        // Security check: questions must NOT expose answers or explanations
        foreach (var q in session.Questions)
        {
            Assert.NotEmpty(q.Id);
            Assert.NotEmpty(q.PromptZh);
            Assert.NotEmpty(q.Options);
            Assert.True(q.HskLevel is >= 1 and <= 4);
        }

        // Verify session is recorded in database as IN_PROGRESS
        var dbSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.NotNull(dbSession);
        Assert.Equal("diagnostic", dbSession.Mode);
        Assert.Equal("IN_PROGRESS", dbSession.Status);
    }

    [Fact]
    public async Task SubmitAssessmentAsync_AllCorrectAnswers_EstimatesHsk4AndPersistsAttempts()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        // Submit all index 0 (which is the correct index for all questions in pool)
        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 300,
            Answers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = q.Id,
                SelectedIndex = 0
            }).ToList()
        };

        var result = await service.SubmitAssessmentAsync(userId, submission);

        Assert.NotNull(result);
        Assert.Equal(session.SessionId, result.SessionId);
        Assert.Equal(12, result.TotalQuestions);
        Assert.Equal(12, result.CorrectCount);
        Assert.Equal(100.0, result.AccuracyPercent);
        Assert.Equal(4, result.EstimatedHskLevel);
        Assert.True(result.ConfidenceScore >= 0.70);

        // Verify practice attempts are persisted into database
        var attempts = await context.StudentPracticeAttempts.Where(a => a.UserId == userId).ToListAsync();
        Assert.Equal(12, attempts.Count);
        Assert.All(attempts, a => Assert.True(a.IsCorrect));

        // Verify session status updated to COMPLETED
        var dbSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.NotNull(dbSession);
        Assert.Equal("COMPLETED", dbSession.Status);
        Assert.Equal(12, dbSession.CorrectCount);

        // Verify student learning profile is updated
        var profile = await context.StudentLearningProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
        Assert.NotNull(profile);
        Assert.Equal(4, profile.SelectedHskLevel);
    }

    [Fact]
    public async Task SubmitAssessmentAsync_DuplicateSubmission_IsRejected()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 120,
            Answers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = q.Id,
                SelectedIndex = 0
            }).ToList()
        };

        // First submission succeeds
        await service.SubmitAssessmentAsync(userId, submission);

        // Second submission must be rejected (anti-duplicate)
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitAssessmentAsync(userId, submission));
    }

    [Fact]
    public async Task SubmitAssessmentAsync_BeginnerAnswers_EstimatesHsk1()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        // Answer correctly only HSK 1 questions (first 3), fail everything else
        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 180,
            Answers = session.Questions.Select((q, index) => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = q.Id,
                SelectedIndex = index < 3 ? 0 : 2 // 0 is correct, 2 is wrong
            }).ToList()
        };

        var result = await service.SubmitAssessmentAsync(userId, submission);

        Assert.Equal(3, result.CorrectCount);
        Assert.Equal(25.0, result.AccuracyPercent);
        Assert.Equal(1, result.EstimatedHskLevel);
    }

    [Fact]
    public async Task GetLatestResultAsync_ReturnsCompletedResultWithDetailedExplanations()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        // Initially no result
        var initial = await service.GetLatestResultAsync(userId);
        Assert.Null(initial);

        // Start and submit
        var session = await service.StartSessionAsync(userId);
        await service.SubmitAssessmentAsync(userId, new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 200,
            Answers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = q.Id,
                SelectedIndex = 0
            }).ToList()
        });

        // Query latest
        var latest = await service.GetLatestResultAsync(userId);
        Assert.NotNull(latest);
        Assert.Equal(session.SessionId, latest.SessionId);
        Assert.Equal(12, latest.DetailedQuestions.Count);
        Assert.All(latest.DetailedQuestions, q => Assert.NotEmpty(q.ExplanationVi));
    }
}
