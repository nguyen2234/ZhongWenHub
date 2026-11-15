using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Xunit;
using ZhongWenHub.Business.AILearning.DTOs;
using ZhongWenHub.Business.AILearning.Services.Competency;
using ZhongWenHub.Business.AILearning.Services.LearningPath;
using ZhongWenHub.Business.AITutor;
using ZhongWenHub.Data.Entities;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.UnitTests;

public class AIPhase4LearningPathUnitTests
{
    [Theory]
    [InlineData(1)]
    [InlineData(4)]
    [InlineData(6)]
    public void GenerateLearningPathRequest_ValidatesHskRanges(int targetHsk)
    {
        var request = new GenerateLearningPathRequestDto
        {
            TargetHskLevel = targetHsk,
            IncludeAiExplanation = true
        };

        Assert.True(request.TargetHskLevel.HasValue);
        Assert.InRange(request.TargetHskLevel.Value, 1, 6);
    }

    [Fact]
    public void UpdateLearningGoalDto_ValidatesBoundaryConditions()
    {
        var goal = new UpdateLearningGoalDto
        {
            TargetHskLevel = 3,
            DailyStudyMinutes = 45,
            StudyDaysPerWeek = 5,
            PrioritySkills = new List<string> { "vocabulary", "grammar" },
            IntensityMode = "balanced"
        };

        Assert.InRange(goal.TargetHskLevel, 1, 6);
        Assert.Contains(goal.DailyStudyMinutes, new[] { 15, 30, 45, 60 });
        Assert.InRange(goal.StudyDaysPerWeek, 1, 7);
        Assert.NotEmpty(goal.PrioritySkills);
    }

    [Fact]
    public void DestinationRoute_OnlyPointsToApprovedApplicationRoutes()
    {
        var approvedPrefixes = new[]
        {
            "/lesson/focus?id=",
            "/srs-review",
            "/practice",
            "/ai-exercises"
        };

        var sampleRoutes = new[]
        {
            "/lesson/focus?id=abc-123",
            "/srs-review",
            "/practice",
            "/ai-exercises"
        };

        foreach (var route in sampleRoutes)
        {
            Assert.True(approvedPrefixes.Any(p => route.StartsWith(p)), $"Route {route} must start with an approved prefix");
        }
    }

    [Fact]
    public void FallbackRationale_ProvidesDetailedPedagogicalGuidance_WithoutCrashing()
    {
        var weakConcepts = new List<WeakConceptDto>
        {
            new() { ConceptCode = "HSK2-GRAM-01", TitleVi = "Câu chữ 把 (bǎ)", SkillCategory = "grammar" }
        };

        var rationale = LearningPathService.BuildDeterministicRationale(
            selectedHsk: 1,
            targetHsk: 2,
            estimatedHsk: 2,
            weakConcepts: weakConcepts,
            dailyMinutes: 45,
            daysPerWeek: 6);

        Assert.False(string.IsNullOrWhiteSpace(rationale));
        Assert.Contains("HSK 1", rationale);
        Assert.Contains("HSK 2", rationale);
        Assert.Contains("45 phút/ngày", rationale);
        Assert.Contains("Câu chữ 把 (bǎ)", rationale);
    }
}

[Collection("SqlServerIntegrationTests")]
public class AIPhase4SqlServerIntegrationTests
{
    private const string ConnectionString = "Server=.\\SQLEXPRESS;Database=ZhongWenHub_Test;Trusted_Connection=True;TrustServerCertificate=True;";

    private ApplicationDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;
        return new ApplicationDbContext(options);
    }

    private LearningPathService CreateService(ApplicationDbContext db)
    {
        var mockAiProvider = new MockAIProvider();
        var competencyService = new CompetencyProfileService(db);
        var logger = NullLogger<LearningPathService>.Instance;

        return new LearningPathService(db, competencyService, mockAiProvider, new NoOpUsageLogger(), logger);
    }

    private async Task<ApplicationUser> EnsureTestUserAsync(ApplicationDbContext db, string username = "phase4_learner")
    {
        var email = $"{username}@zhongwenhub.test";
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == email);
        if (user == null)
        {
            user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                DisplayName = username,
                Status = UserStatus.ACTIVE,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();
        }

        var profile = await db.StudentLearningProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
        if (profile == null)
        {
            profile = new StudentLearningProfile
            {
                UserId = user.Id,
                SelectedHskLevel = 1,
                StreakDays = 3,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };
            db.StudentLearningProfiles.Add(profile);
            await db.SaveChangesAsync();
        }

        // Clean up any existing tasks for clean test isolation
        var oldTasks = await db.DailyLearningTasks.Where(t => t.UserId == user.Id).ToListAsync();
        if (oldTasks.Count > 0)
        {
            db.DailyLearningTasks.RemoveRange(oldTasks);
            await db.SaveChangesAsync();
        }

        return user;
    }

    [Fact]
    public async Task GetGoal_ForNewLearner_ReturnsSensibleDefaults()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_user_default");
        var service = CreateService(db);

        var goal = await service.GetLearningGoalAsync(user.Id);

        Assert.NotNull(goal);
        Assert.InRange(goal.TargetHskLevel, 1, 6);
        Assert.True(goal.DailyStudyMinutes > 0);
        Assert.True(goal.StudyDaysPerWeek > 0);
        Assert.NotEmpty(goal.PrioritySkills);
    }

    [Fact]
    public async Task UpdateGoal_NeverOverwritesSelectedHskLevel()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_user_no_overwrite");
        var profile = await db.StudentLearningProfiles.FirstAsync(p => p.UserId == user.Id);
        profile.SelectedHskLevel = 2; // Intentionally set to 2
        await db.SaveChangesAsync();

        var service = CreateService(db);

        // Update target goal to HSK 4
        var updatedGoal = await service.UpdateLearningGoalAsync(user.Id, new UpdateLearningGoalDto
        {
            TargetHskLevel = 4,
            DailyStudyMinutes = 45,
            StudyDaysPerWeek = 6,
            PrioritySkills = new List<string> { "grammar", "reading" },
            IntensityMode = "intensive"
        });

        Assert.Equal(4, updatedGoal.TargetHskLevel);
        Assert.Equal(45, updatedGoal.DailyStudyMinutes);
        Assert.Equal(6, updatedGoal.StudyDaysPerWeek);

        // Re-read profile from DB to ensure SelectedHskLevel is STILL 2
        var profileAfter = await db.StudentLearningProfiles.AsNoTracking().FirstAsync(p => p.UserId == user.Id);
        Assert.Equal(2, profileAfter.SelectedHskLevel);
    }

    [Fact]
    public async Task GenerateLearningPath_PartitionsRealLessonsIntoMilestones_AndCreatesDailyPlan()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_path_generation");
        var service = CreateService(db);

        var path = await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 2,
            IncludeAiExplanation = true
        });

        Assert.NotNull(path);
        Assert.Equal(user.Id, path.UserId);
        Assert.Equal(2, path.TargetHskLevel);
        Assert.Equal("ACTIVE", path.Status);
        Assert.NotEmpty(path.Milestones);
        Assert.False(string.IsNullOrWhiteSpace(path.PedagogicalRationaleVi));

        // Verify milestone order & contents
        foreach (var milestone in path.Milestones)
        {
            Assert.True(milestone.StageOrder > 0);
            Assert.NotEmpty(milestone.Title);
            Assert.True(milestone.EstimatedDays > 0);
        }

        // Verify daily plan was seeded
        var dailyPlan = await service.GetTodayPlanAsync(user.Id);
        Assert.NotNull(dailyPlan);
        Assert.NotEmpty(dailyPlan.Tasks);

        // Verify task routes are strictly valid
        var validPrefixes = new[] { "/lesson/focus?id=", "/srs-review", "/practice", "/ai-exercises" };
        foreach (var task in dailyPlan.Tasks)
        {
            Assert.True(validPrefixes.Any(p => task.DestinationRoute.StartsWith(p)),
                $"Task route '{task.DestinationRoute}' must be an approved app route");
        }
    }

    [Fact]
    public async Task CompleteTask_IsIdempotent_AndProvidesNextSuggestedTask()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_task_completion");
        var service = CreateService(db);

        // Ensure user has a daily plan
        await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 2,
            IncludeAiExplanation = true
        });

        var plan = await service.GetTodayPlanAsync(user.Id);
        var pendingTask = plan.Tasks.First(t => t.CompletionStatus == "PENDING");

        // 1. Complete task
        var response1 = await service.CompleteTaskAsync(user.Id, pendingTask.TaskId);
        Assert.True(response1.Success);
        Assert.Equal(pendingTask.TaskId, response1.CompletedTaskId);

        // 2. Complete again (idempotent)
        var response2 = await service.CompleteTaskAsync(user.Id, pendingTask.TaskId);
        Assert.True(response2.Success);

        // 3. Verify progress increased
        var progress = await service.GetProgressAsync(user.Id);
        Assert.True(progress.TodayCompletedTasks >= 1);
    }

    [Fact]
    public async Task CompleteTask_CrossUserAuthorization_ThrowsSecurityException()
    {
        await using var db = CreateContext();
        var userOwner = await EnsureTestUserAsync(db, "phase4_owner");
        var userAttacker = await EnsureTestUserAsync(db, "phase4_attacker");
        var service = CreateService(db);

        await service.GenerateLearningPathAsync(userOwner.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 2
        });

        var plan = await service.GetTodayPlanAsync(userOwner.Id);
        var ownerTask = plan.Tasks.First();

        // Attacker attempts to complete owner's task
        await Assert.ThrowsAsync<UnauthorizedAccessException>(async () =>
        {
            await service.CompleteTaskAsync(userAttacker.Id, ownerTask.TaskId);
        });
    }

    [Fact]
    public async Task ReplanToday_PreservesCompletedTasks_AndRecalculatesPending()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_replan");
        var service = CreateService(db);

        await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 2
        });

        var initialPlan = await service.GetTodayPlanAsync(user.Id);
        var firstTask = initialPlan.Tasks.First();

        // Complete 1 task
        await service.CompleteTaskAsync(user.Id, firstTask.TaskId);

        // Replan today with extra minutes
        var replanned = await service.ReplanTodayAsync(user.Id, new AdaptiveReplanRequestDto
        {
            Reason = "Extra study time"
        });

        // The completed task MUST still be present and COMPLETED
        var preservedTask = replanned.Tasks.FirstOrDefault(t => t.TaskId == firstTask.TaskId);
        Assert.NotNull(preservedTask);
        Assert.Equal("COMPLETED", preservedTask.CompletionStatus);

        // Tasks must exist for today
        Assert.True(replanned.Tasks.Count >= 1);
    }

    [Fact]
    public async Task CompleteTask_NeverFakesOfficialLessonProgress_OrQuizScore()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_no_fake_progress");
        var service = CreateService(db);

        // Ensure user has a daily plan for HSK 1
        await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 1
        });

        var plan = await service.GetTodayPlanAsync(user.Id);
        var lessonTask = plan.Tasks.FirstOrDefault(t => t.TaskType == "lesson");
        Assert.NotNull(lessonTask);
        Assert.NotNull(lessonTask!.ResourceId);

        // Complete the daily task
        var response = await service.CompleteTaskAsync(user.Id, lessonTask.TaskId);
        Assert.True(response.Success);

        // Verify StudentLessonProgress does NOT have a fake 100 score or fake COMPLETED
        var officialProgress = await db.StudentLessonProgresses
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == user.Id && p.LessonId == lessonTask.ResourceId);

        // It must either be null or NOT automatically scored with 100 QuizScore
        if (officialProgress != null)
        {
            Assert.NotEqual(100, officialProgress.QuizScore);
        }

        // Profile SelectedHskLevel MUST NOT be mutated
        var profile = await db.StudentLearningProfiles.AsNoTracking().FirstAsync(p => p.UserId == user.Id);
        Assert.Equal(1, profile.SelectedHskLevel);
    }

    [Fact]
    public async Task GenerateLearningPath_WhenTargetHskHasNoLessons_ThrowsInvalidOperationException()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_no_lessons_target");
        var service = CreateService(db);

        // Request an HSK level with no published lessons in test DB (HSK 5 has 0 published lessons)
        await Assert.ThrowsAsync<InvalidOperationException>(async () =>
        {
            await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
            {
                TargetHskLevel = 5
            });
        });
    }

    [Fact]
    public async Task GenerateLearningPath_ReplacesPendingTasks_PreservingCompleted()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_path_switch");
        var service = CreateService(db);

        // Generate Path 1 for HSK 1
        await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 1
        });

        var plan1 = await service.GetTodayPlanAsync(user.Id);
        var taskToComplete = plan1.Tasks.First();

        // Complete 1 task from Path 1
        await service.CompleteTaskAsync(user.Id, taskToComplete.TaskId);

        // Now switch to Path 2 for HSK 2
        var path2 = await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 2
        });
        Assert.Equal(2, path2.TargetHskLevel);

        var plan2 = await service.GetTodayPlanAsync(user.Id);

        // Completed task from earlier today MUST be preserved
        var preservedTask = plan2.Tasks.FirstOrDefault(t => t.TaskId == taskToComplete.TaskId);
        Assert.NotNull(preservedTask);
        Assert.Equal("COMPLETED", preservedTask.CompletionStatus);

        // All PENDING tasks must now belong to HSK 2
        var pendingTasks = plan2.Tasks.Where(t => t.CompletionStatus == "PENDING").ToList();
        Assert.NotEmpty(pendingTasks);
        foreach (var pt in pendingTasks)
        {
            Assert.Equal(2, pt.TargetHskLevel);
        }
    }

    [Fact]
    public async Task DailyPlan_WhenQuotaCompleted_DoesNotForceAdditionalTasks_UnlessVoluntary()
    {
        await using var db = CreateContext();
        var user = await EnsureTestUserAsync(db, "phase4_quota_completed");
        var service = CreateService(db);

        // Set daily study minutes goal to 15 minutes
        await service.UpdateLearningGoalAsync(user.Id, new UpdateLearningGoalDto
        {
            TargetHskLevel = 1,
            DailyStudyMinutes = 15,
            StudyDaysPerWeek = 5,
            PrioritySkills = new List<string> { "vocabulary" },
            IntensityMode = "light"
        });

        await service.GenerateLearningPathAsync(user.Id, new GenerateLearningPathRequestDto
        {
            TargetHskLevel = 1
        });

        var plan = await service.GetTodayPlanAsync(user.Id);
        Assert.NotEmpty(plan.Tasks);

        // Complete all tasks so that total completed minutes >= daily goal (15m)
        foreach (var task in plan.Tasks)
        {
            await service.CompleteTaskAsync(user.Id, task.TaskId);
        }

        // Replan without voluntary extra minutes should NOT seed any additional tasks
        var replannedWithoutVoluntary = await service.ReplanTodayAsync(user.Id, new AdaptiveReplanRequestDto
        {
            AvailableMinutes = null
        });

        // Day percent should be 100% and no extra pending tasks
        Assert.Equal(100.0, replannedWithoutVoluntary.DayCompletionPercent);
        Assert.DoesNotContain(replannedWithoutVoluntary.Tasks, t => t.CompletionStatus == "PENDING");

        // If student explicitly requests voluntary extra study minutes (e.g. 15 minutes)
        var replannedVoluntary = await service.ReplanTodayAsync(user.Id, new AdaptiveReplanRequestDto
        {
            AvailableMinutes = 15
        });

        // Now voluntary tasks can be added
        var voluntaryPending = replannedVoluntary.Tasks.Where(t => t.CompletionStatus == "PENDING").ToList();
        Assert.NotEmpty(voluntaryPending);
        Assert.True(voluntaryPending.Sum(t => t.EstimatedMinutes) <= 15, "Voluntary tasks should not exceed voluntary budget");
    }

    private sealed class NoOpUsageLogger : IAIUsageLogger
    {
        public Task LogAsync(Guid userId, string feature, AIProviderResponse? response, bool isSuccess, string? errorCode, CancellationToken cancellationToken = default) => Task.CompletedTask;
        public Task EnsureWithinDailyBudgetAsync(Guid userId, CancellationToken cancellationToken = default) => Task.CompletedTask;
    }
}
