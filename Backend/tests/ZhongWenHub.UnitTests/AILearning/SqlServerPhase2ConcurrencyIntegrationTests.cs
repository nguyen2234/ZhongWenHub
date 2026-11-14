using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Diagnostic;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests.AILearning;

[Collection("SqlServerIntegrationTests")]
public class SqlServerPhase2ConcurrencyIntegrationTests
{
    private const string SqlServerConnectionString =
        "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

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

        var studentId = Guid.Parse("46e15f31-a780-490c-bfca-fc07113786d6"); // hocvien@gmail.com
        var service = new DiagnosticAssessmentService(initContext);

        // 2. Start a new session on SQL Server
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
            // 3. Create two independent DbContext instances to simulate two real concurrent HTTP requests arriving simultaneously
            using var context1 = CreateSqlServerContext();
            using var context2 = CreateSqlServerContext();

            var service1 = new DiagnosticAssessmentService(context1);
            var service2 = new DiagnosticAssessmentService(context2);

            // Execute two concurrent submissions simultaneously
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

            // 4. Verification:
            // Exactly ONE request must succeed, and the other MUST be rejected with InvalidOperationException!
            var successCount = (result1 != null ? 1 : 0) + (result2 != null ? 1 : 0);
            var failureCount = (exception1 != null ? 1 : 0) + (exception2 != null ? 1 : 0);

            Assert.Equal(1, successCount);
            Assert.Equal(1, failureCount);

            var thrownEx = exception1 ?? exception2;
            Assert.NotNull(thrownEx);
            Assert.IsType<InvalidOperationException>(thrownEx);

            // 5. Verify database integrity in SQL Server
            using var verifyContext = CreateSqlServerContext();
            var finalSession = await verifyContext.QuestionBankPracticeSessions.FindAsync(sessionId);
            Assert.NotNull(finalSession);
            Assert.Equal("COMPLETED", finalSession.Status);
            Assert.Equal(12, finalSession.CorrectCount);

            // Practice attempts should be recorded exactly 12 times (NOT 24 from race condition)
            var questionIds = snapshots.Select(s => s.QuestionId).ToList();
            var createdAttempts = await verifyContext.StudentPracticeAttempts
                .Where(a => a.UserId == studentId && questionIds.Contains(a.QuestionId))
                .ToListAsync();

            Assert.Equal(12, createdAttempts.Count);
        }
        finally
        {
            // Clean up test data in SQL Server
            using var cleanupContext = CreateSqlServerContext();
            var testSession = await cleanupContext.QuestionBankPracticeSessions.FindAsync(sessionId);
            if (testSession != null)
            {
                cleanupContext.QuestionBankPracticeSessions.Remove(testSession);
            }

            var questionIds = snapshots.Select(s => s.QuestionId).ToList();
            var attemptsToDelete = cleanupContext.StudentPracticeAttempts
                .Where(a => a.UserId == studentId && questionIds.Contains(a.QuestionId));
            cleanupContext.StudentPracticeAttempts.RemoveRange(attemptsToDelete);

            await cleanupContext.SaveChangesAsync();
        }
    }
}
