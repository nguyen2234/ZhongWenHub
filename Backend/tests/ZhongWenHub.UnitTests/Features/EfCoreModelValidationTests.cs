using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Xunit;
using ZhongWenHub.Models.Users;
using ZhongWenHub.Models.AI;
using ZhongWenHub.Models.Content;
using ZhongWenHub.Models.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class EfCoreModelValidationTests
{
    private static ApplicationDbContext CreateContext(List<string>? loggedWarnings = null)
    {
        var builder = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(Guid.NewGuid().ToString());

        if (loggedWarnings != null)
        {
            builder.LogTo(
                (eventId, level) => eventId.Id == 10622,
                eventData => loggedWarnings.Add(eventData.ToString()));
        }

        return new ApplicationDbContext(builder.Options);
    }

    [Fact]
    public void ApplicationDbContext_ModelValidation_HasZeroWarning10622()
    {
        var loggedWarnings = new List<string>();
        using var context = CreateContext(loggedWarnings);

        // Force model compilation and validation
        var model = context.Model;
        Assert.NotNull(model);

        Assert.True(loggedWarnings.Count == 0,
            $"Found {loggedWarnings.Count} EF Core 10622 warnings:\n" + string.Join("\n---\n", loggedWarnings));
    }

    [Fact]
    public async Task SoftDelete_ActiveUser_LoadsUserAndChildEntities()
    {
        using var context = CreateContext();

        var activeUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "active@test.com",
            Email = "active@test.com",
            DisplayName = "Active Student",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(activeUser);

        var attempt = new StudentPracticeAttempt
        {
            Id = Guid.NewGuid(),
            UserId = activeUser.Id,
            ExerciseId = "ex-1",
            KnowledgePointId = "kp-1",
            TopicTitle = "Grammar 1",
            Category = "grammar",
            UserAnswer = "A",
            IsCorrect = true,
            AttemptedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        context.StudentPracticeAttempts.Add(attempt);

        var wallet = new UserWallet
        {
            Id = Guid.NewGuid(),
            UserId = activeUser.Id,
            Balance = 100000m,
            Currency = "VND",
            CreatedAt = DateTime.UtcNow
        };
        context.UserWallets.Add(wallet);

        var tx = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            UserId = activeUser.Id,
            WalletId = wallet.Id,
            Amount = 50000m,
            BalanceBefore = 50000m,
            BalanceAfter = 100000m,
            TransactionType = "TopUp",
            Reason = "Deposit",
            CreatedAt = DateTime.UtcNow
        };
        context.WalletTransactions.Add(tx);

        await context.SaveChangesAsync();

        // 1. Direct user query respects Global Query Filter
        var foundUser = await context.Users.FirstOrDefaultAsync(u => u.Id == activeUser.Id);
        Assert.NotNull(foundUser);

        // 2. Direct child query
        var foundAttempt = await context.StudentPracticeAttempts.FirstOrDefaultAsync(a => a.Id == attempt.Id);
        Assert.NotNull(foundAttempt);

        // 3. Child query with Include(User)
        var attemptWithUser = await context.StudentPracticeAttempts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == attempt.Id);
        Assert.NotNull(attemptWithUser);
        Assert.NotNull(attemptWithUser.User);
        Assert.Equal("active@test.com", attemptWithUser.User.UserName);

        // 4. Financial transaction query with Include(User)
        var txWithUser = await context.WalletTransactions
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == tx.Id);
        Assert.NotNull(txWithUser);
        Assert.NotNull(txWithUser.User);
        Assert.Equal(100000m, txWithUser.BalanceAfter);
    }

    [Fact]
    public async Task SoftDelete_DeletedUser_PreservesChildDataAndNullsNavigationWithoutInnerJoinDrop()
    {
        using var context = CreateContext();

        var deletedUser = new ApplicationUser
        {
            Id = Guid.NewGuid(),
            UserName = "deleted@test.com",
            Email = "deleted@test.com",
            DisplayName = "Deleted Student",
            IsDeleted = true,
            DeletedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(deletedUser);

        var attempt = new StudentPracticeAttempt
        {
            Id = Guid.NewGuid(),
            UserId = deletedUser.Id,
            ExerciseId = "ex-del-1",
            KnowledgePointId = "kp-del-1",
            TopicTitle = "Grammar Old",
            Category = "grammar",
            UserAnswer = "B",
            IsCorrect = false,
            AttemptedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        };
        context.StudentPracticeAttempts.Add(attempt);

        var wallet = new UserWallet
        {
            Id = Guid.NewGuid(),
            UserId = deletedUser.Id,
            Balance = 0m,
            Currency = "VND",
            CreatedAt = DateTime.UtcNow
        };
        context.UserWallets.Add(wallet);

        var tx = new WalletTransaction
        {
            Id = Guid.NewGuid(),
            UserId = deletedUser.Id,
            WalletId = wallet.Id,
            Amount = 25000m,
            BalanceBefore = 25000m,
            BalanceAfter = 0m,
            TransactionType = "Purchase",
            Reason = "Lesson purchase",
            CreatedAt = DateTime.UtcNow
        };
        context.WalletTransactions.Add(tx);

        await context.SaveChangesAsync();
        context.ChangeTracker.Clear();

        // 1. Direct user query filters out soft-deleted user
        var directUser = await context.Users.FirstOrDefaultAsync(u => u.Id == deletedUser.Id);
        Assert.Null(directUser);

        // 2. IgnoreQueryFilters loads the soft-deleted user
        var ignoredUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Id == deletedUser.Id);
        Assert.NotNull(ignoredUser);
        Assert.True(ignoredUser.IsDeleted);

        // 3. Direct child queries (attempt & financial transactions) are preserved
        var directAttempt = await context.StudentPracticeAttempts.FirstOrDefaultAsync(a => a.Id == attempt.Id);
        Assert.NotNull(directAttempt);
        Assert.Equal(deletedUser.Id, directAttempt.UserId);

        var directTx = await context.WalletTransactions.FirstOrDefaultAsync(t => t.Id == tx.Id);
        Assert.NotNull(directTx);
        Assert.Equal(25000m, directTx.Amount);

        // 4. Query child with Include(User):
        // Because Navigation is optional, child row is NOT dropped by an INNER JOIN filter.
        var attemptWithUser = await context.StudentPracticeAttempts
            .Include(a => a.User)
            .FirstOrDefaultAsync(a => a.Id == attempt.Id);
        Assert.NotNull(attemptWithUser);

        var txWithUser = await context.WalletTransactions
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == tx.Id);
        Assert.NotNull(txWithUser);
    }

    [Fact]
    public async Task All18Entities_CanBeQueriedWithOptionalNavigation()
    {
        using var context = CreateContext();
        var uid = Guid.NewGuid();
        var user = new ApplicationUser
        {
            Id = uid,
            UserName = "learner@test.com",
            Email = "learner@test.com",
            DisplayName = "Learner",
            IsDeleted = false,
            CreatedAt = DateTime.UtcNow
        };
        context.Users.Add(user);

        // 1. StudentLearningProfile
        context.StudentLearningProfiles.Add(new StudentLearningProfile
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            CurrentLessonId = "les-1",
            LastActivityDate = "2026-11-16",
            CreatedAt = DateTime.UtcNow
        });

        // 2. StudentLessonProgress
        context.StudentLessonProgresses.Add(new StudentLessonProgress
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            LessonId = "les-1",
            Status = "COMPLETED",
            CreatedAt = DateTime.UtcNow
        });

        // 3. StudentPracticeAttempt
        context.StudentPracticeAttempts.Add(new StudentPracticeAttempt
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            ExerciseId = "ex-1",
            KnowledgePointId = "kp-1",
            TopicTitle = "Topic",
            Category = "reading",
            UserAnswer = "Answer",
            CreatedAt = DateTime.UtcNow
        });

        // 4. StudentDailyActivity
        context.StudentDailyActivities.Add(new StudentDailyActivity
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            ActivityDate = "2026-11-16",
            CompletedLessonsJson = "[]",
            CreatedAt = DateTime.UtcNow
        });

        // 5. StudentVocabularyProgress
        context.StudentVocabularyProgresses.Add(new StudentVocabularyProgress
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            VocabularyId = "vocab-1",
            Status = "LEARNING",
            FirstLearnedAt = DateTime.UtcNow,
            LastReviewedAt = DateTime.UtcNow,
            NextReviewAt = DateTime.UtcNow.AddDays(1),
            CreatedAt = DateTime.UtcNow
        });

        // 6. StudentXpTransaction
        context.StudentXpTransactions.Add(new StudentXpTransaction
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            EventId = "evt-1",
            Source = "Lesson",
            CreatedAt = DateTime.UtcNow
        });

        // 7. QuestionBankPracticeSessionEntity
        context.QuestionBankPracticeSessions.Add(new QuestionBankPracticeSessionEntity
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            ExerciseIdsJson = "[]",
            SelectionReasonsJson = "[]",
            StartedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // 8. UserWallet
        var walletId = Guid.NewGuid();
        context.UserWallets.Add(new UserWallet
        {
            Id = walletId,
            UserId = uid,
            Balance = 0m,
            CreatedAt = DateTime.UtcNow
        });

        // 9. WalletTransaction
        context.WalletTransactions.Add(new WalletTransaction
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            WalletId = walletId,
            Amount = 100m,
            BalanceBefore = 0m,
            BalanceAfter = 100m,
            TransactionType = "Bonus",
            Reason = "Welcome bonus",
            CreatedAt = DateTime.UtcNow
        });

        // 10. UserSubscription
        context.UserSubscriptions.Add(new UserSubscription
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            Plan = "Pro",
            Status = "ACTIVE",
            StartDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // 11. StudentExamAttempt
        var examId = Guid.NewGuid();
        context.Exams.Add(new ExamEntity
        {
            Id = examId,
            Code = "EXAM-1",
            Title = "HSK 1 Mock",
            Status = "PUBLISHED",
            CreatedAt = DateTime.UtcNow
        });
        context.StudentExamAttempts.Add(new StudentExamAttempt
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            ExamId = examId,
            StartedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // 12. AiConversationSession
        context.AiConversationSessions.Add(new AiConversationSession
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            SessionType = "Tutor",
            ScenarioCode = "SCN-1",
            ScenarioTitle = "Coffee ordering",
            Status = "ACTIVE",
            StartedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // 13. AiGeneratedExercise
        context.AiGeneratedExercises.Add(new AiGeneratedExercise
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            SourceType = "ErrorPattern",
            ExerciseType = "MultipleChoice",
            OriginTag = "Tag",
            AcademicStatus = "Accepted",
            PromptZh = "Question",
            ExplanationVi = "Explanation",
            CreatedAt = DateTime.UtcNow
        });

        // 14. AiSpeakingAttempt
        context.AiSpeakingAttempts.Add(new AiSpeakingAttempt
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            PracticeType = "ReadAloud",
            TargetTextZh = "你好",
            AssessmentMethod = "SpeechRecognition",
            AudioStorageStatus = "Saved",
            AttemptedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // 15. LearningSkillStatistic
        context.LearningSkillStatistics.Add(new LearningSkillStatistic
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            SkillCategory = "Reading",
            LastAssessedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // 16. StudentLearningGoalEntity
        context.StudentLearningGoals.Add(new StudentLearningGoalEntity
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            IntensityMode = "Normal",
            CreatedAt = DateTime.UtcNow
        });

        // 17. PersonalizedLearningPathEntity
        var pathId = Guid.NewGuid();
        context.PersonalizedLearningPaths.Add(new PersonalizedLearningPathEntity
        {
            Id = pathId,
            UserId = uid,
            Title = "My Path",
            Status = "ACTIVE",
            GeneratedAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        // 18. DailyLearningTaskEntity
        context.DailyLearningTasks.Add(new DailyLearningTaskEntity
        {
            Id = Guid.NewGuid(),
            UserId = uid,
            LearningPathId = pathId,
            TaskType = "Vocabulary",
            Title = "Learn 5 words",
            TargetSkill = "Vocabulary",
            DestinationRoute = "/vocab",
            CompletionStatus = "PENDING",
            PlanDate = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        await context.SaveChangesAsync();

        // Verify all 18 can be queried with Include(User)
        Assert.NotNull(await context.StudentLearningProfiles.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.StudentLessonProgresses.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.StudentPracticeAttempts.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.StudentDailyActivities.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.StudentVocabularyProgresses.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.StudentXpTransactions.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.QuestionBankPracticeSessions.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.UserWallets.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.WalletTransactions.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.UserSubscriptions.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.StudentExamAttempts.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.AiConversationSessions.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.AiGeneratedExercises.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.AiSpeakingAttempts.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.LearningSkillStatistics.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.StudentLearningGoals.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.PersonalizedLearningPaths.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
        Assert.NotNull(await context.DailyLearningTasks.Include(x => x.User).FirstOrDefaultAsync(x => x.UserId == uid));
    }
}
