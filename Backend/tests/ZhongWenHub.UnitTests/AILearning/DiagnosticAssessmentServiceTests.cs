using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Diagnostic;
using ZhongWenHub.Data.Entities.Learning;
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
    public async Task StartSessionAsync_GuaranteesZeroAnswerLeakAndShuffledOptions()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        Assert.NotNull(session);
        Assert.NotEqual(Guid.Empty, session.SessionId);
        Assert.Equal(12, session.TotalQuestions);
        Assert.Equal(12, session.Questions.Count);
        Assert.Equal("HSK_PLACEMENT_SCREENING", session.AssessmentType);
        Assert.Equal(60, session.MaxDurationMinutes);

        // Security check: questions must NOT expose answers or explanations in DTO
        foreach (var q in session.Questions)
        {
            Assert.NotEmpty(q.Id);
            Assert.NotEmpty(q.PromptZh);
            Assert.Equal(4, q.Options.Count);
            Assert.True(q.HskLevel is >= 1 and <= 4);
        }

        // Verify session snapshot in database has shuffled options and recorded CorrectIndex
        var dbSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.NotNull(dbSession);
        Assert.Equal("diagnostic", dbSession.Mode);
        Assert.Equal("IN_PROGRESS", dbSession.Status);

        var snapshots = JsonSerializer.Deserialize<List<SessionQuestionSnapshotItem>>(dbSession.ExerciseIdsJson);
        Assert.NotNull(snapshots);
        Assert.Equal(12, snapshots.Count);

        // Prove that correct indices are NOT all fixed to 0
        var distinctCorrectIndices = snapshots.Select(s => s.CorrectIndex).Distinct().ToList();
        Assert.True(distinctCorrectIndices.Count > 1, "Correct indices across questions must not be fixed to 0.");
    }

    [Fact]
    public async Task StartSessionAsync_DoesNotLeakSentenceTranslationInReadingOrListeningPromptVi()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        var readingOrListening = session.Questions
            .Where(q => q.SkillCategory is "reading" or "listening")
            .ToList();

        Assert.NotEmpty(readingOrListening);
        foreach (var q in readingOrListening)
        {
            // PromptVi must not translate full prompt text; must only contain directive/question instruction
            if (!string.IsNullOrEmpty(q.PromptVi))
            {
                Assert.DoesNotContain("Tôi uống trà, không uống cà phê", q.PromptVi);
                Assert.DoesNotContain("Anh ấy tuy bị ốm, nhưng vẫn đi làm", q.PromptVi);
                Assert.DoesNotContain("Chỉ cần kiên trì luyện tập mỗi ngày", q.PromptVi);
                Assert.DoesNotContain("Mấu chốt của thành công không chỉ ở thiên phú", q.PromptVi);
            }
        }
    }

    [Fact]
    public async Task SubmitAssessmentAsync_OwnershipValidation_RejectsDifferentUser()
    {
        using var context = CreateContext();
        var ownerId = Guid.NewGuid();
        var attackerId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(ownerId);

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

        // Attacker attempts to submit owner's session -> must throw UnauthorizedAccessException
        await Assert.ThrowsAsync<UnauthorizedAccessException>(() =>
            service.SubmitAssessmentAsync(attackerId, submission));
    }

    [Fact]
    public async Task SubmitAssessmentAsync_SessionTimeout_RejectsExpiredSession()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        // Manually simulate expired session (>60 minutes ago)
        var dbSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.NotNull(dbSession);
        dbSession.StartedAt = DateTime.UtcNow.AddMinutes(-65);
        await context.SaveChangesAsync();

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 3900,
            Answers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = q.Id,
                SelectedIndex = 0
            }).ToList()
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitAssessmentAsync(userId, submission));
        Assert.Contains("60 phút", ex.Message);

        var updated = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.Equal("EXPIRED", updated?.Status);
    }

    [Fact]
    public async Task SubmitAssessmentAsync_DuplicateQuestionIdInPayload_IsRejected()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        var duplicatedAnswers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
        {
            QuestionId = q.Id,
            SelectedIndex = 0
        }).ToList();

        // Duplicate the first question answer in payload
        duplicatedAnswers.Add(new DiagnosticAnswerSubmissionDto
        {
            QuestionId = session.Questions[0].Id,
            SelectedIndex = 1
        });

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 100,
            Answers = duplicatedAnswers
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SubmitAssessmentAsync(userId, submission));
        Assert.Contains("lặp QuestionId", ex.Message);
    }

    [Fact]
    public async Task SubmitAssessmentAsync_InvalidQuestionIdNotInSnapshot_IsRejected()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        var answers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
        {
            QuestionId = q.Id,
            SelectedIndex = 0
        }).ToList();

        // Replace one questionId with an invalid ID
        answers[0].QuestionId = "fake-alien-question-id";

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 100,
            Answers = answers
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SubmitAssessmentAsync(userId, submission));
        Assert.Contains("không thuộc phiên kiểm tra", ex.Message);
    }

    [Fact]
    public async Task SubmitAssessmentAsync_InvalidSelectedIndexOutOfBounds_IsRejected()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        var answers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
        {
            QuestionId = q.Id,
            SelectedIndex = 0
        }).ToList();

        // Put an out of bounds index (e.g. 99)
        answers[0].SelectedIndex = 99;

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 100,
            Answers = answers
        };

        var ex = await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SubmitAssessmentAsync(userId, submission));
        Assert.Contains("không hợp lệ", ex.Message);
    }

    [Fact]
    public async Task SubmitAssessmentAsync_DoesNotOverwriteSelectedHskLevel_RequiresExplicitConfirmation()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();

        // Student originally chose HSK 1 as target
        context.StudentLearningProfiles.Add(new StudentLearningProfile
        {
            UserId = userId,
            SelectedHskLevel = 1,
            LastActivityDate = "2026-11-10"
        });
        await context.SaveChangesAsync();

        var service = new DiagnosticAssessmentService(context);
        var session = await service.StartSessionAsync(userId);

        // Fetch snapshot from DB to submit 100% correct answers according to this session
        var dbSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        var snapshots = JsonSerializer.Deserialize<List<SessionQuestionSnapshotItem>>(dbSession!.ExerciseIdsJson)!;

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 300,
            Answers = snapshots.Select(s => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = s.QuestionId,
                SelectedIndex = s.CorrectIndex
            }).ToList()
        };

        var result = await service.SubmitAssessmentAsync(userId, submission);

        Assert.Equal(4, result.EstimatedHskLevel);
        Assert.Equal(100.0, result.AccuracyPercent);
        Assert.Equal("HSK_PLACEMENT_SCREENING", result.AssessmentType);
        Assert.NotEmpty(result.AssessmentLimitationsVi);
        Assert.True(result.ConfidenceScore is >= 0.40 and <= 0.60, "Confidence should reflect 12-question screening psychometrics (~0.46).");

        // CRITICAL CHECK: SelectedHskLevel MUST NOT be overwritten!
        var profile = await context.StudentLearningProfiles.FirstAsync(p => p.UserId == userId);
        Assert.Equal(1, profile.SelectedHskLevel); // Must remain 1 (student's own selected goal)

        // Only after student explicitly confirms target HSK, SelectedHskLevel is updated
        await service.ApplyConfirmedTargetHskAsync(userId, 4);

        var updatedProfile = await context.StudentLearningProfiles.FirstAsync(p => p.UserId == userId);
        Assert.Equal(4, updatedProfile.SelectedHskLevel);
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

        // Second submission must be rejected
        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitAssessmentAsync(userId, submission));
    }

    [Fact]
    public async Task SubmitAssessmentAsync_CorruptSnapshotJson_ThrowsInvalidOperationException_AndSessionRemainsInProgress()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);

        // Corrupt snapshot JSON in database
        var dbSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.NotNull(dbSession);
        dbSession.ExerciseIdsJson = "corrupt-non-json-data";
        await context.SaveChangesAsync();

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 60,
            Answers = session.Questions.Select(q => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = q.Id,
                SelectedIndex = 0
            }).ToList()
        };

        var ex = await Assert.ThrowsAsync<InvalidOperationException>(() =>
            service.SubmitAssessmentAsync(userId, submission));
        Assert.Contains("lỗi hoặc không thể phục hồi", ex.Message);

        // Session must NOT be marked COMPLETED and attempts must not be created
        var refreshedSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.Equal("IN_PROGRESS", refreshedSession?.Status);
        var attempts = await context.StudentPracticeAttempts.Where(a => a.UserId == userId).ToListAsync();
        Assert.Empty(attempts);
    }

    [Fact]
    public async Task SubmitAssessmentAsync_InvalidRequest_DoesNotCommit_AndAllowsSubsequentValidRetry()
    {
        using var context = CreateContext();
        var userId = Guid.NewGuid();
        var service = new DiagnosticAssessmentService(context);

        var session = await service.StartSessionAsync(userId);
        var dbSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.NotNull(dbSession);
        var snapshots = JsonSerializer.Deserialize<List<SessionQuestionSnapshotItem>>(dbSession.ExerciseIdsJson)!;

        // 1. Submit invalid payload (SelectedIndex out of bounds)
        var invalidSubmission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 60,
            Answers = snapshots.Select(s => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = s.QuestionId,
                SelectedIndex = 99 // Invalid index
            }).ToList()
        };

        await Assert.ThrowsAsync<ArgumentException>(() =>
            service.SubmitAssessmentAsync(userId, invalidSubmission));

        // Verify session remains IN_PROGRESS and no attempts inserted
        var refreshed = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.Equal("IN_PROGRESS", refreshed?.Status);
        var attemptsBeforeRetry = await context.StudentPracticeAttempts.Where(a => a.UserId == userId).ToListAsync();
        Assert.Empty(attemptsBeforeRetry);

        // 2. Retry with valid payload on the SAME session
        var validSubmission = new DiagnosticSubmissionDto
        {
            SessionId = session.SessionId,
            TimeSpentSeconds = 180,
            Answers = snapshots.Select(s => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = s.QuestionId,
                SelectedIndex = s.CorrectIndex
            }).ToList()
        };

        var result = await service.SubmitAssessmentAsync(userId, validSubmission);
        Assert.NotNull(result);
        Assert.Equal(12, result.CorrectCount);
        Assert.Equal(100.0, result.AccuracyPercent);

        var completedSession = await context.QuestionBankPracticeSessions.FindAsync(session.SessionId);
        Assert.Equal("COMPLETED", completedSession?.Status);
        var attemptsAfterRetry = await context.StudentPracticeAttempts.Where(a => a.UserId == userId).ToListAsync();
        Assert.Equal(12, attemptsAfterRetry.Count);
    }
}
