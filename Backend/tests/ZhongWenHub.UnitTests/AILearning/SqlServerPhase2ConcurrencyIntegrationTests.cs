using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Diagnostic;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests.AILearning;

[Collection("SqlServerIntegrationTests")]
[Trait("Category", "Integration")]
public class SqlServerPhase2ConcurrencyIntegrationTests
{
    private static readonly string SqlServerConnectionString =
        Environment.GetEnvironmentVariable("TEST_SQLSERVER_CONNECTION_STRING")
        ?? "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private static ApplicationDbContext CreateSqlServerContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(SqlServerConnectionString)
            .Options;
        return new ApplicationDbContext(options);
    }

    [Fact]
    public async Task SqlServer_ConcurrentSubmissions_GuaranteesAtomicStatusUpdateAndPreventsDoubleGrading()
    {
        using var initContext = CreateSqlServerContext();

        // 1. Verify connection to dedicated test SQL Server database
        Assert.True(await initContext.Database.CanConnectAsync(), "Must connect to SQL Server ZhongWenHub_Test database");

        // 2. Create isolated transient test student (NEVER use real user data)
        var studentId = Guid.NewGuid();
        var testUser = new ApplicationUser
        {
            Id = studentId,
            UserName = $"test.student.{studentId:N}@zhongwenhub.edu.vn",
            Email = $"test.student.{studentId:N}@zhongwenhub.edu.vn",
            DisplayName = "Transient Concurrency Test Student",
            Status = UserStatus.ACTIVE,
            EmailConfirmed = true
        };
        initContext.Users.Add(testUser);

        // Pre-seed student profile with target HSK 1
        initContext.StudentLearningProfiles.Add(new StudentLearningProfile
        {
            UserId = studentId,
            SelectedHskLevel = 1,
            LastActivityDate = "2026-11-10"
        });
        await initContext.SaveChangesAsync();

        var service = new DiagnosticAssessmentService(initContext);

        // 3. Start a new session on SQL Server
        var sessionStart = await service.StartSessionAsync(studentId);
        var sessionId = sessionStart.SessionId;

        // Fetch the session snapshot to build a valid submission payload
        var dbSession = await initContext.QuestionBankPracticeSessions.FindAsync(sessionId);
        Assert.NotNull(dbSession);
        var snapshots = JsonSerializer.Deserialize<List<SessionQuestionSnapshotItem>>(dbSession.ExerciseIdsJson)!;

        var submission = new DiagnosticSubmissionDto
        {
            SessionId = sessionId,
            TimeSpentSeconds = 240,
            Answers = snapshots.Select(s => new DiagnosticAnswerSubmissionDto
            {
                QuestionId = s.QuestionId,
                SelectedIndex = s.CorrectIndex
            }).ToList()
        };

        try
        {
            // 4. Create two independent DbContext instances to simulate two real concurrent HTTP requests arriving simultaneously
            using var context1 = CreateSqlServerContext();
            using var context2 = CreateSqlServerContext();

            var service1 = new DiagnosticAssessmentService(context1);
            var service2 = new DiagnosticAssessmentService(context2);

            Exception? exception1 = null;
            Exception? exception2 = null;
            DiagnosticResultDto? result1 = null;
            DiagnosticResultDto? result2 = null;

            var task1 = Task.Run(async () =>
            {
                try
                {
                    result1 = await service1.SubmitAssessmentAsync(studentId, submission);
                }
                catch (Exception ex)
                {
                    exception1 = ex;
                }
            });

            var task2 = Task.Run(async () =>
            {
                try
                {
                    result2 = await service2.SubmitAssessmentAsync(studentId, submission);
                }
                catch (Exception ex)
                {
                    exception2 = ex;
                }
            });

            await Task.WhenAll(task1, task2);

            // 5. Verification:
            // Exactly ONE request must succeed, and the other MUST be rejected with InvalidOperationException!
            var successCount = (result1 != null ? 1 : 0) + (result2 != null ? 1 : 0);
            var failureCount = (exception1 != null ? 1 : 0) + (exception2 != null ? 1 : 0);

            Assert.Equal(1, successCount);
            Assert.Equal(1, failureCount);

            var thrownEx = exception1 ?? exception2;
            Assert.NotNull(thrownEx);
            Assert.IsType<InvalidOperationException>(thrownEx);

            // 6. Verify database integrity in SQL Server
            using var verifyContext = CreateSqlServerContext();
            var finalSession = await verifyContext.QuestionBankPracticeSessions.FindAsync(sessionId);
            Assert.NotNull(finalSession);
            Assert.Equal("COMPLETED", finalSession.Status);
            Assert.Equal(12, finalSession.CorrectCount);

            // Practice attempts should be recorded exactly 12 times (NOT 24 from race condition)
            var createdAttempts = await verifyContext.StudentPracticeAttempts
                .Where(a => a.UserId == studentId)
                .ToListAsync();

            Assert.Equal(12, createdAttempts.Count);

            // SelectedHskLevel must NOT be overwritten!
            var profile = await verifyContext.StudentLearningProfiles
                .FirstAsync(p => p.UserId == studentId);
            Assert.Equal(1, profile.SelectedHskLevel);
        }
        finally
        {
            // Clean up strictly isolated transient test records
            using var cleanupContext = CreateSqlServerContext();
            var user = await cleanupContext.Users.FindAsync(studentId);
            if (user != null)
            {
                var sessions = await cleanupContext.QuestionBankPracticeSessions.Where(s => s.UserId == studentId).ToListAsync();
                cleanupContext.QuestionBankPracticeSessions.RemoveRange(sessions);

                var attempts = await cleanupContext.StudentPracticeAttempts.Where(a => a.UserId == studentId).ToListAsync();
                cleanupContext.StudentPracticeAttempts.RemoveRange(attempts);

                var profiles = await cleanupContext.StudentLearningProfiles.Where(p => p.UserId == studentId).ToListAsync();
                cleanupContext.StudentLearningProfiles.RemoveRange(profiles);

                cleanupContext.Users.Remove(user);
                await cleanupContext.SaveChangesAsync();
            }
        }
    }

    [Fact]
    public async Task SqlServer_InvalidRequest_DoesNotCommit_AndAllowsSubsequentValidRetry()
    {
        using var initContext = CreateSqlServerContext();

        Assert.True(await initContext.Database.CanConnectAsync(), "Must connect to SQL Server ZhongWenHub_Test database");

        // 1. Create isolated transient test student
        var studentId = Guid.NewGuid();
        var testUser = new ApplicationUser
        {
            Id = studentId,
            UserName = $"test.student.retry.{studentId:N}@zhongwenhub.edu.vn",
            Email = $"test.student.retry.{studentId:N}@zhongwenhub.edu.vn",
            DisplayName = "Transient Retry Test Student",
            Status = UserStatus.ACTIVE,
            EmailConfirmed = true
        };
        initContext.Users.Add(testUser);
        await initContext.SaveChangesAsync();

        var service = new DiagnosticAssessmentService(initContext);
        var sessionStart = await service.StartSessionAsync(studentId);
        var sessionId = sessionStart.SessionId;

        var dbSession = await initContext.QuestionBankPracticeSessions.FindAsync(sessionId);
        Assert.NotNull(dbSession);
        var snapshots = JsonSerializer.Deserialize<List<SessionQuestionSnapshotItem>>(dbSession.ExerciseIdsJson)!;

        try
        {
            // 2. Submit an INVALID payload (contains an alien QuestionId not in snapshot)
            var invalidSubmission = new DiagnosticSubmissionDto
            {
                SessionId = sessionId,
                TimeSpentSeconds = 60,
                Answers = new List<DiagnosticAnswerSubmissionDto>
                {
                    new() { QuestionId = "alien-invalid-id", SelectedIndex = 0 }
                }
            };

            await Assert.ThrowsAsync<ArgumentException>(() =>
                service.SubmitAssessmentAsync(studentId, invalidSubmission));

            // 3. Verify session in SQL Server is STILL IN_PROGRESS and no attempts were created!
            using var checkContext = CreateSqlServerContext();
            var sessionAfterFail = await checkContext.QuestionBankPracticeSessions.FindAsync(sessionId);
            Assert.NotNull(sessionAfterFail);
            Assert.Equal("IN_PROGRESS", sessionAfterFail.Status);

            var attemptsAfterFail = await checkContext.StudentPracticeAttempts
                .Where(a => a.UserId == studentId)
                .ToListAsync();
            Assert.Empty(attemptsAfterFail);

            // 4. RETRY with a VALID submission on the SAME session
            var validSubmission = new DiagnosticSubmissionDto
            {
                SessionId = sessionId,
                TimeSpentSeconds = 180,
                Answers = snapshots.Select(s => new DiagnosticAnswerSubmissionDto
                {
                    QuestionId = s.QuestionId,
                    SelectedIndex = s.CorrectIndex
                }).ToList()
            };

            var result = await service.SubmitAssessmentAsync(studentId, validSubmission);

            // 5. Verify the valid submission succeeded completely!
            Assert.NotNull(result);
            Assert.Equal(sessionId, result.SessionId);
            Assert.Equal(12, result.TotalQuestions);
            Assert.Equal(12, result.CorrectCount);
            Assert.Equal(100.0, result.AccuracyPercent);

            using var verifyContext = CreateSqlServerContext();
            var sessionAfterSuccess = await verifyContext.QuestionBankPracticeSessions.FindAsync(sessionId);
            Assert.NotNull(sessionAfterSuccess);
            Assert.Equal("COMPLETED", sessionAfterSuccess.Status);

            var attemptsAfterSuccess = await verifyContext.StudentPracticeAttempts
                .Where(a => a.UserId == studentId)
                .ToListAsync();
            Assert.Equal(12, attemptsAfterSuccess.Count);
        }
        finally
        {
            // Clean up strictly isolated transient test records
            using var cleanupContext = CreateSqlServerContext();
            var user = await cleanupContext.Users.FindAsync(studentId);
            if (user != null)
            {
                var sessions = await cleanupContext.QuestionBankPracticeSessions.Where(s => s.UserId == studentId).ToListAsync();
                cleanupContext.QuestionBankPracticeSessions.RemoveRange(sessions);

                var attempts = await cleanupContext.StudentPracticeAttempts.Where(a => a.UserId == studentId).ToListAsync();
                cleanupContext.StudentPracticeAttempts.RemoveRange(attempts);

                var profiles = await cleanupContext.StudentLearningProfiles.Where(p => p.UserId == studentId).ToListAsync();
                cleanupContext.StudentLearningProfiles.RemoveRange(profiles);

                cleanupContext.Users.Remove(user);
                await cleanupContext.SaveChangesAsync();
            }
        }
    }
}
