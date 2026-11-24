using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Features.AI.DTOs;
using ZhongWenHub.Features.AI.Services.Competency;
using ZhongWenHub.Features.AI;
using ZhongWenHub.Data.Entities.Content;
using ZhongWenHub.Data.Entities.Learning;
using ZhongWenHub.Data.Persistence;

namespace ZhongWenHub.Features.AI.Services.LearningPath;

public sealed class LearningPathService : ILearningPathService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly ApplicationDbContext _dbContext;
    private readonly ICompetencyProfileService _competencyService;
    private readonly IAIProvider _aiProvider;
    private readonly IAIUsageLogger _usageLogger;
    private readonly ILogger<LearningPathService> _logger;

    public LearningPathService(
        ApplicationDbContext dbContext,
        ICompetencyProfileService competencyService,
        IAIProvider aiProvider,
        IAIUsageLogger usageLogger,
        ILogger<LearningPathService> logger)
    {
        _dbContext = dbContext;
        _competencyService = competencyService;
        _aiProvider = aiProvider;
        _usageLogger = usageLogger;
        _logger = logger;
    }

    public async Task<LearningGoalDto> GetLearningGoalAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var goal = await _dbContext.StudentLearningGoals
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.UserId == userId, cancellationToken);

        if (goal != null)
        {
            return MapGoalDto(goal);
        }

        var profile = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var selectedHsk = profile?.SelectedHskLevel is >= 1 and <= 6 ? profile.SelectedHskLevel : 1;
        var dailyMinutes = profile?.TargetDailyMinutes is 15 or 30 or 45 or 60 ? profile.TargetDailyMinutes : 30;

        return new LearningGoalDto
        {
            TargetHskLevel = selectedHsk,
            DailyStudyMinutes = dailyMinutes,
            StudyDaysPerWeek = 5,
            TargetDate = DateTime.UtcNow.AddMonths(3),
            PrioritySkills = new List<string> { "vocabulary", "grammar" },
            IntensityMode = "balanced",
            UpdatedAt = null
        };
    }

    public async Task<LearningGoalDto> UpdateLearningGoalAsync(
        Guid userId,
        UpdateLearningGoalDto request,
        CancellationToken cancellationToken = default)
    {
        var targetHsk = Math.Clamp(request.TargetHskLevel, 1, 6);
        var minutes = request.DailyStudyMinutes switch
        {
            15 => 15,
            45 => 45,
            60 => 60,
            _ => 30
        };
        var daysPerWeek = Math.Clamp(request.StudyDaysPerWeek, 1, 7);
        var intensity = request.IntensityMode?.ToLowerInvariant() switch
        {
            "light" => "light",
            "intensive" => "intensive",
            _ => "balanced"
        };

        var prioritySkills = (request.PrioritySkills != null && request.PrioritySkills.Count > 0)
            ? request.PrioritySkills.Select(s => s.Trim().ToLowerInvariant()).Distinct().ToList()
            : new List<string> { "vocabulary", "grammar" };

        var goal = await _dbContext.StudentLearningGoals
            .FirstOrDefaultAsync(g => g.UserId == userId, cancellationToken);

        var now = DateTime.UtcNow;
        if (goal == null)
        {
            goal = new StudentLearningGoalEntity
            {
                UserId = userId,
                TargetHskLevel = targetHsk,
                DailyStudyMinutes = minutes,
                StudyDaysPerWeek = daysPerWeek,
                TargetDate = request.TargetDate,
                PrioritySkillsJson = JsonSerializer.Serialize(prioritySkills, JsonOptions),
                IntensityMode = intensity,
                CreatedAt = now,
                UpdatedAt = now
            };
            _dbContext.StudentLearningGoals.Add(goal);
        }
        else
        {
            goal.TargetHskLevel = targetHsk;
            goal.DailyStudyMinutes = minutes;
            goal.StudyDaysPerWeek = daysPerWeek;
            goal.TargetDate = request.TargetDate;
            goal.PrioritySkillsJson = JsonSerializer.Serialize(prioritySkills, JsonOptions);
            goal.IntensityMode = intensity;
            goal.UpdatedAt = now;
        }

        // Synchronize TargetDailyMinutes on StudentLearningProfile without modifying SelectedHskLevel
        var profile = await _dbContext.StudentLearningProfiles
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);
        if (profile != null)
        {
            profile.TargetDailyMinutes = minutes;
            profile.UpdatedAt = now;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);
        return MapGoalDto(goal);
    }

    public async Task<PersonalizedLearningPathDto> GenerateLearningPathAsync(
        Guid userId,
        GenerateLearningPathRequestDto request,
        CancellationToken cancellationToken = default)
    {
        var profile = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var goal = await _dbContext.StudentLearningGoals
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.UserId == userId, cancellationToken);

        var selectedHsk = profile?.SelectedHskLevel is >= 1 and <= 6 ? profile.SelectedHskLevel : 1;
        var targetHsk = request.TargetHskLevel is >= 1 and <= 6
            ? request.TargetHskLevel.Value
            : (goal?.TargetHskLevel ?? selectedHsk);

        // Competency Profile & Weak Concepts
        var competency = await _competencyService.GetCompetencyProfileAsync(userId, cancellationToken);
        var estimatedHsk = competency.EstimatedHskLevel;
        var weakConcepts = competency.TopWeakConcepts ?? new List<WeakConceptDto>();

        // Published real lessons from database
        var lessons = await _dbContext.Lessons
            .AsNoTracking()
            .Include(l => l.Course)
            .Where(l => l.Status == "PUBLISHED" && l.Course != null && l.Course.HskLevel == targetHsk)
            .OrderBy(l => l.OrderIndex)
            .ToListAsync(cancellationToken);

        if (lessons.Count == 0)
        {
            throw new InvalidOperationException($"Chưa có giáo trình xuất bản cho cấp độ HSK {targetHsk}. Vui lòng chọn cấp độ khác hoặc liên hệ giáo viên để cập nhật nội dung.");
        }

        // Completed lessons check
        var completedLessonIds = await _dbContext.StudentLessonProgresses
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.Status == "COMPLETED")
            .Select(p => p.LessonId)
            .ToListAsync(cancellationToken);

        var completedSet = new HashSet<string>(completedLessonIds, StringComparer.OrdinalIgnoreCase);

        // Construct 3-4 pedagogical milestones
        var milestones = BuildMilestones(lessons, completedSet, targetHsk, weakConcepts, goal?.DailyStudyMinutes ?? 30);

        var totalLessons = lessons.Count;
        var completedLessons = lessons.Count(l => completedSet.Contains(l.Id.ToString()));
        var progressPercent = totalLessons > 0 ? Math.Round((double)completedLessons / totalLessons * 100.0, 1) : 0.0;

        var dailyMinutes = goal?.DailyStudyMinutes ?? 30;
        var daysPerWeek = goal?.StudyDaysPerWeek ?? 5;
        var totalEstimatedWeeks = Math.Max(2, (int)Math.Ceiling((double)totalLessons * 45 / (dailyMinutes * daysPerWeek * 60) * 4));

        var title = $"Lộ trình Chinh phục HSK {targetHsk} Cá nhân hóa";
        var rationale = BuildDeterministicRationale(selectedHsk, targetHsk, estimatedHsk, weakConcepts, dailyMinutes, daysPerWeek);
        string? aiFocusTips = null;

        if (_aiProvider != null && request.IncludeAiExplanation)
        {
            try
            {
                var prompt = $"Hãy đóng vai trò cố vấn học tập tiếng Trung (HSK {targetHsk}). Học viên đang ở HSK {selectedHsk}, ước lượng năng lực HSK {estimatedHsk?.ToString() ?? "Chưa xác định"}, điểm yếu chính: {string.Join(", ", weakConcepts.Select(w => w.TitleVi))}. Viết 2-3 câu lời khuyên ngắn gọn, thiết thực bằng tiếng Việt để giúp học viên hoàn thành lộ trình.";
                var aiRes = await _aiProvider.GenerateContentAsync(new AIProviderRequest
                {
                    Feature = "AI_LEARNING_EXPLAIN",
                    SystemInstruction = "Bạn là chuyên gia sư phạm tiếng Trung cố vấn học tập cá nhân hóa.",
                    UserPrompt = prompt,
                    Temperature = 0.5,
                    MaxOutputTokens = 300
                }, cancellationToken);

                if (!string.IsNullOrWhiteSpace(aiRes.RawText))
                {
                    aiFocusTips = aiRes.RawText.Trim();
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Could not fetch AI focus tips for learning path. Falling back to deterministic tips.");
            }
        }

        aiFocusTips ??= $"Tập trung luyện {dailyMinutes} phút mỗi ngày, ưu tiên giải quyết các điểm yếu về {string.Join(", ", weakConcepts.Take(2).Select(w => w.TitleVi))} và ôn từ vựng SRS đúng lịch.";

        // Archive older active paths for this user
        var oldPaths = await _dbContext.PersonalizedLearningPaths
            .Where(p => p.UserId == userId && p.Status == "ACTIVE")
            .ToListAsync(cancellationToken);

        foreach (var op in oldPaths)
        {
            op.Status = "ARCHIVED";
        }

        var pathEntity = new PersonalizedLearningPathEntity
        {
            UserId = userId,
            GoalId = goal?.Id,
            Title = title,
            TargetHskLevel = targetHsk,
            CurrentEstimatedHskLevel = estimatedHsk,
            TotalEstimatedWeeks = totalEstimatedWeeks,
            TotalLessonsCount = totalLessons,
            CompletedLessonsCount = completedLessons,
            OverallProgressPercent = progressPercent,
            Status = "ACTIVE",
            PedagogicalRationaleVi = rationale,
            AiFocusTipsVi = aiFocusTips,
            GeneratedAt = DateTime.UtcNow
        };

        foreach (var m in milestones)
        {
            pathEntity.Milestones.Add(m);
        }

        _dbContext.PersonalizedLearningPaths.Add(pathEntity);
        await _dbContext.SaveChangesAsync(cancellationToken);

        // Clean up pending daily tasks from older paths for today, preserving any tasks already completed today
        var today = DateTime.UtcNow.Date;
        var pendingOldTasks = await _dbContext.DailyLearningTasks
            .Where(t => t.UserId == userId && t.PlanDate == today && t.CompletionStatus != "COMPLETED")
            .ToListAsync(cancellationToken);

        if (pendingOldTasks.Count > 0)
        {
            _dbContext.DailyLearningTasks.RemoveRange(pendingOldTasks);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        // Seed daily tasks for today for the new active path
        await SeedDailyTasksAsync(userId, pathEntity, forceSeed: true, customAvailableMinutes: null, cancellationToken);

        return MapPathDto(pathEntity, lessons, completedSet);
    }

    public async Task<PersonalizedLearningPathDto?> GetCurrentLearningPathAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var path = await _dbContext.PersonalizedLearningPaths
            .Include(p => p.Milestones)
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.Status == "ACTIVE")
            .OrderByDescending(p => p.GeneratedAt)
            .FirstOrDefaultAsync(cancellationToken);

        if (path == null) return null;

        var lessons = await _dbContext.Lessons
            .AsNoTracking()
            .Include(l => l.Course)
            .Where(l => l.Status == "PUBLISHED" && l.Course != null && l.Course.HskLevel == path.TargetHskLevel)
            .OrderBy(l => l.OrderIndex)
            .ToListAsync(cancellationToken);

        var completedLessonIds = await _dbContext.StudentLessonProgresses
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.Status == "COMPLETED")
            .Select(p => p.LessonId)
            .ToListAsync(cancellationToken);

        var completedSet = new HashSet<string>(completedLessonIds, StringComparer.OrdinalIgnoreCase);

        return MapPathDto(path, lessons, completedSet);
    }

    public async Task<DailyPlanDto> GetTodayPlanAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;
        var tasks = await _dbContext.DailyLearningTasks
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.PlanDate == today)
            .OrderBy(t => t.Priority)
            .ToListAsync(cancellationToken);

        if (tasks.Count == 0)
        {
            var activePath = await _dbContext.PersonalizedLearningPaths
                .Include(p => p.Milestones)
                .FirstOrDefaultAsync(p => p.UserId == userId && p.Status == "ACTIVE", cancellationToken);

            await SeedDailyTasksAsync(userId, activePath, forceSeed: false, customAvailableMinutes: null, cancellationToken);

            tasks = await _dbContext.DailyLearningTasks
                .AsNoTracking()
                .Where(t => t.UserId == userId && t.PlanDate == today)
                .OrderBy(t => t.Priority)
                .ToListAsync(cancellationToken);
        }

        return MapDailyPlanDto(today, tasks);
    }

    public async Task<CompleteTaskResponseDto> CompleteTaskAsync(
        Guid userId,
        Guid taskId,
        CancellationToken cancellationToken = default)
    {
        var task = await _dbContext.DailyLearningTasks
            .FirstOrDefaultAsync(t => t.Id == taskId, cancellationToken);

        if (task == null)
        {
            throw new KeyNotFoundException("Không tìm thấy nhiệm vụ học tập này.");
        }

        if (task.UserId != userId)
        {
            throw new UnauthorizedAccessException("Bạn không có quyền cập nhật nhiệm vụ của người học khác.");
        }

        var today = DateTime.UtcNow.Date;
        if (task.CompletionStatus != "COMPLETED")
        {
            task.CompletionStatus = "COMPLETED";
            task.CompletedAt = DateTime.UtcNow;

            // Recalculate milestone & overall path progress if linked to active path based on genuine official lesson progress
            if (task.LearningPathId.HasValue)
            {
                var path = await _dbContext.PersonalizedLearningPaths
                    .Include(p => p.Milestones)
                    .FirstOrDefaultAsync(p => p.Id == task.LearningPathId.Value, cancellationToken);

                if (path != null)
                {
                    var completedLessonIds = await _dbContext.StudentLessonProgresses
                        .Where(p => p.UserId == userId && p.Status == "COMPLETED")
                        .Select(p => p.LessonId)
                        .ToListAsync(cancellationToken);

                    var completedSet = new HashSet<string>(completedLessonIds, StringComparer.OrdinalIgnoreCase);

                    foreach (var m in path.Milestones)
                    {
                        var mLessonIds = JsonSerializer.Deserialize<List<string>>(m.LessonIdsJson, JsonOptions) ?? new();
                        if (mLessonIds.Count > 0 && mLessonIds.All(id => completedSet.Contains(id)))
                        {
                            m.IsCompleted = true;
                            m.CompletedAt ??= DateTime.UtcNow;
                        }
                    }

                    if (path.TotalLessonsCount > 0)
                    {
                        path.CompletedLessonsCount = path.Milestones
                            .SelectMany(m => JsonSerializer.Deserialize<List<string>>(m.LessonIdsJson, JsonOptions) ?? new())
                            .Distinct()
                            .Count(id => completedSet.Contains(id));

                        path.OverallProgressPercent = Math.Round((double)path.CompletedLessonsCount / path.TotalLessonsCount * 100.0, 1);
                    }
                }
            }

            await _dbContext.SaveChangesAsync(cancellationToken);
        }

        var todayTasks = await _dbContext.DailyLearningTasks
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.PlanDate == today)
            .OrderBy(t => t.Priority)
            .ToListAsync(cancellationToken);

        var remainingTasks = todayTasks.Count(t => t.CompletionStatus != "COMPLETED");
        var completedCount = todayTasks.Count(t => t.CompletionStatus == "COMPLETED");
        var dayPercent = todayTasks.Count > 0 ? Math.Round((double)completedCount / todayTasks.Count * 100.0, 1) : 100.0;

        var nextTask = todayTasks.FirstOrDefault(t => t.CompletionStatus != "COMPLETED");

        var activePathProgress = await _dbContext.PersonalizedLearningPaths
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.Status == "ACTIVE")
            .Select(p => p.OverallProgressPercent)
            .FirstOrDefaultAsync(cancellationToken);

        return new CompleteTaskResponseDto
        {
            Success = true,
            CompletedTaskId = task.Id,
            RemainingTasksCount = remainingTasks,
            DayCompletionPercent = dayPercent,
            UpdatedOverallProgressPercent = activePathProgress,
            SuggestedNextTask = nextTask != null ? MapTaskDto(nextTask) : null,
            Message = remainingTasks == 0 ? "Xuất sắc! Bạn đã hoàn thành toàn bộ kế hoạch học tập hôm nay." : "Đã hoàn thành nhiệm vụ thành công."
        };
    }

    public async Task<DailyPlanDto> ReplanTodayAsync(
        Guid userId,
        AdaptiveReplanRequestDto? request = null,
        CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        // Keep COMPLETED tasks, remove only PENDING / IN_PROGRESS tasks to adjust intelligently
        var pendingTasks = await _dbContext.DailyLearningTasks
            .Where(t => t.UserId == userId && t.PlanDate == today && t.CompletionStatus != "COMPLETED")
            .ToListAsync(cancellationToken);

        _dbContext.DailyLearningTasks.RemoveRange(pendingTasks);
        await _dbContext.SaveChangesAsync(cancellationToken);

        var activePath = await _dbContext.PersonalizedLearningPaths
            .Include(p => p.Milestones)
            .FirstOrDefaultAsync(p => p.UserId == userId && p.Status == "ACTIVE", cancellationToken);

        if (activePath != null)
        {
            activePath.LastReplannedAt = DateTime.UtcNow;
        }

        await SeedDailyTasksAsync(userId, activePath, forceSeed: true, customAvailableMinutes: request?.AvailableMinutes, cancellationToken);

        var refreshedTasks = await _dbContext.DailyLearningTasks
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.PlanDate == today)
            .OrderBy(t => t.Priority)
            .ToListAsync(cancellationToken);

        return MapDailyPlanDto(today, refreshedTasks);
    }

    public async Task<PersonalizedLearningProgressDto> GetProgressAsync(Guid userId, CancellationToken cancellationToken = default)
    {
        var today = DateTime.UtcNow.Date;

        var profile = await _dbContext.StudentLearningProfiles
            .AsNoTracking()
            .FirstOrDefaultAsync(p => p.UserId == userId, cancellationToken);

        var competency = await _competencyService.GetCompetencyProfileAsync(userId, cancellationToken);

        var path = await _dbContext.PersonalizedLearningPaths
            .Include(p => p.Milestones)
            .AsNoTracking()
            .Where(p => p.UserId == userId && p.Status == "ACTIVE")
            .OrderByDescending(p => p.GeneratedAt)
            .FirstOrDefaultAsync(cancellationToken);

        var todayTasks = await _dbContext.DailyLearningTasks
            .AsNoTracking()
            .Where(t => t.UserId == userId && t.PlanDate == today)
            .ToListAsync(cancellationToken);

        var goal = await _dbContext.StudentLearningGoals
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.UserId == userId, cancellationToken);

        var prioritySkills = (goal != null && !string.IsNullOrWhiteSpace(goal.PrioritySkillsJson))
            ? JsonSerializer.Deserialize<List<string>>(goal.PrioritySkillsJson, JsonOptions) ?? new()
            : new List<string> { "vocabulary", "grammar" };

        var totalMilestones = path?.Milestones.Count ?? 0;
        var completedMilestones = path?.Milestones.Count(m => m.IsCompleted) ?? 0;
        var activeMilestoneOrder = path?.Milestones
            .Where(m => !m.IsCompleted)
            .OrderBy(m => m.StageOrder)
            .Select(m => m.StageOrder)
            .FirstOrDefault() ?? (totalMilestones > 0 ? totalMilestones : 1);

        var nextTask = todayTasks.FirstOrDefault(t => t.CompletionStatus != "COMPLETED");
        var nextAction = nextTask != null
            ? $"{nextTask.Title} ({nextTask.EstimatedMinutes} phút)"
            : "Đã hoàn tất toàn bộ kế hoạch hôm nay. Hãy duy trì chuỗi học tập!";

        return new PersonalizedLearningProgressDto
        {
            SelectedHskLevel = profile?.SelectedHskLevel ?? 1,
            EstimatedHskLevel = competency.EstimatedHskLevel,
            PathProgressPercent = path?.OverallProgressPercent ?? 0.0,
            ActiveMilestoneOrder = activeMilestoneOrder,
            TotalMilestones = totalMilestones,
            CompletedMilestones = completedMilestones,
            TodayCompletedTasks = todayTasks.Count(t => t.CompletionStatus == "COMPLETED"),
            TodayTotalTasks = todayTasks.Count,
            CurrentStreakDays = profile?.StreakDays ?? 0,
            TotalXp = profile?.XpTotal ?? 0,
            PrioritySkills = prioritySkills,
            NextRecommendedActionVi = nextAction
        };
    }

    // =========================================================================
    // HELPER & SEEDING METHODS
    // =========================================================================

    private async Task SeedDailyTasksAsync(
        Guid userId,
        PersonalizedLearningPathEntity? path,
        bool forceSeed,
        int? customAvailableMinutes,
        CancellationToken cancellationToken)
    {
        var today = DateTime.UtcNow.Date;
        var existingTasks = await _dbContext.DailyLearningTasks
            .Where(t => t.UserId == userId && t.PlanDate == today)
            .ToListAsync(cancellationToken);

        var completedTasks = existingTasks.Where(t => t.CompletionStatus == "COMPLETED").ToList();
        var pendingTasks = existingTasks.Where(t => t.CompletionStatus != "COMPLETED").ToList();

        if (!forceSeed && pendingTasks.Count > 0)
        {
            return;
        }

        var goal = await _dbContext.StudentLearningGoals
            .AsNoTracking()
            .FirstOrDefaultAsync(g => g.UserId == userId, cancellationToken);

        var targetDailyMinutes = customAvailableMinutes ?? goal?.DailyStudyMinutes ?? 30;
        var alreadyCompletedMinutes = completedTasks.Sum(t => t.EstimatedMinutes);

        // If customAvailableMinutes is explicitly specified (voluntary extra study), honor it directly.
        // Otherwise calculate remaining budget = targetDailyMinutes - alreadyCompletedMinutes.
        var isVoluntaryExtra = customAvailableMinutes.HasValue && customAvailableMinutes.Value > 0;
        var budgetMinutes = isVoluntaryExtra
            ? customAvailableMinutes!.Value
            : targetDailyMinutes - alreadyCompletedMinutes;

        // When today's quota is already satisfied and no extra voluntary minutes requested, do not seed more tasks.
        if (budgetMinutes <= 0)
        {
            return;
        }

        var completedTaskTypes = completedTasks.Select(t => t.TaskType).ToHashSet(StringComparer.OrdinalIgnoreCase);
        var completedResourceIds = completedTasks.Where(t => !string.IsNullOrWhiteSpace(t.ResourceId)).Select(t => t.ResourceId!).ToHashSet(StringComparer.OrdinalIgnoreCase);

        var targetHsk = path?.TargetHskLevel ?? goal?.TargetHskLevel ?? 1;
        var now = DateTime.UtcNow;
        var tasksToSeed = new List<DailyLearningTaskEntity>();
        var priority = completedTasks.Count + 1;

        // 1. Check SRS due words (if not completed today and words are due)
        if (!completedTaskTypes.Contains("srs"))
        {
            var dueSrsCount = await _dbContext.StudentVocabularyProgresses
                .AsNoTracking()
                .CountAsync(v => v.UserId == userId && v.NextReviewAt <= now, cancellationToken);

            if (dueSrsCount > 0 && budgetMinutes >= 5)
            {
                var estMin = Math.Min(budgetMinutes, Math.Min(15, Math.Max(5, dueSrsCount)));
                tasksToSeed.Add(new DailyLearningTaskEntity
                {
                    UserId = userId,
                    LearningPathId = path?.Id,
                    PlanDate = today,
                    TaskType = "srs",
                    Title = $"Ôn tập {Math.Min(dueSrsCount, 20)} từ vựng SRS đến hạn",
                    Description = "Củng cố trí nhớ dài hạn các từ vựng đến hạn ôn tập theo thuật toán Spaced Repetition.",
                    EstimatedMinutes = estMin,
                    Priority = priority++,
                    TargetSkill = "vocabulary",
                    TargetHskLevel = targetHsk,
                    ResourceId = null,
                    DestinationRoute = "/srs-review",
                    CompletionStatus = "PENDING",
                    CreatedAt = now
                });
                budgetMinutes -= estMin;
            }
        }

        // 2. Core Lesson (if not completed today and budget accommodates it)
        LessonEntity? nextLesson = null;
        if (path != null)
        {
            var uncompletedMilestone = path.Milestones
                .Where(m => !m.IsCompleted)
                .OrderBy(m => m.StageOrder)
                .FirstOrDefault();

            if (uncompletedMilestone != null)
            {
                var lessonIds = JsonSerializer.Deserialize<List<string>>(uncompletedMilestone.LessonIdsJson, JsonOptions) ?? new();
                var completedIds = await _dbContext.StudentLessonProgresses
                    .AsNoTracking()
                    .Where(p => p.UserId == userId && p.Status == "COMPLETED")
                    .Select(p => p.LessonId)
                    .ToListAsync(cancellationToken);
                var completedSet = new HashSet<string>(completedIds, StringComparer.OrdinalIgnoreCase);

                var pendingLessonIdStr = lessonIds.FirstOrDefault(id => !completedSet.Contains(id) && !completedResourceIds.Contains(id));
                if (pendingLessonIdStr != null && Guid.TryParse(pendingLessonIdStr, out var pendingGuid))
                {
                    nextLesson = await _dbContext.Lessons.AsNoTracking().FirstOrDefaultAsync(l => l.Id == pendingGuid, cancellationToken);
                }
            }
        }

        if (nextLesson == null)
        {
            nextLesson = await _dbContext.Lessons
                .AsNoTracking()
                .Include(l => l.Course)
                .Where(l => l.Status == "PUBLISHED" && l.Course != null && l.Course.HskLevel == targetHsk && !completedResourceIds.Contains(l.Id.ToString()))
                .OrderBy(l => l.OrderIndex)
                .FirstOrDefaultAsync(cancellationToken);
        }

        if (nextLesson != null)
        {
            var estMin = nextLesson.DurationMinutes > 0 ? nextLesson.DurationMinutes : 15;
            if (budgetMinutes >= estMin)
            {
                tasksToSeed.Add(new DailyLearningTaskEntity
                {
                    UserId = userId,
                    LearningPathId = path?.Id,
                    PlanDate = today,
                    TaskType = "lesson",
                    Title = $"Học bài: {nextLesson.TitleZh} ({nextLesson.TitleVi})",
                    Description = $"Tìm hiểu từ vựng, ngữ pháp và hội thoại bài {nextLesson.LessonNumber} giáo trình HSK {targetHsk}.",
                    EstimatedMinutes = estMin,
                    Priority = priority++,
                    TargetSkill = "reading",
                    TargetHskLevel = targetHsk,
                    ResourceId = nextLesson.Id.ToString(),
                    DestinationRoute = $"/lesson/focus?id={nextLesson.Id}",
                    CompletionStatus = "PENDING",
                    CreatedAt = now
                });
                budgetMinutes -= estMin;
            }
        }

        // 3. Weakness Review (if not completed today and budget accommodates it)
        var competency = await _competencyService.GetCompetencyProfileAsync(userId, cancellationToken);
        var weakConcept = competency.TopWeakConcepts.FirstOrDefault();

        if (weakConcept != null && !completedTaskTypes.Contains("weakness") && !completedResourceIds.Contains(weakConcept.ConceptCode) && budgetMinutes >= 10)
        {
            tasksToSeed.Add(new DailyLearningTaskEntity
            {
                UserId = userId,
                LearningPathId = path?.Id,
                PlanDate = today,
                TaskType = "weakness",
                Title = $"Củng cố điểm yếu: {weakConcept.TitleVi}",
                Description = $"Luyện tập chuyên sâu kỹ năng {weakConcept.SkillCategory} nhằm nâng cao xác suất thành thạo.",
                EstimatedMinutes = 10,
                Priority = priority++,
                TargetSkill = weakConcept.SkillCategory,
                TargetHskLevel = targetHsk,
                ResourceId = weakConcept.ConceptCode,
                DestinationRoute = "/practice",
                CompletionStatus = "PENDING",
                CreatedAt = now
            });
            budgetMinutes -= 10;
        }

        // 4. AI Adaptive Exercises (if budget remains >= 10, allow voluntary extra or not yet completed today)
        if (budgetMinutes >= 10 && (!completedTaskTypes.Contains("ai-exercise") || isVoluntaryExtra))
        {
            var estMin = Math.Min(budgetMinutes, 10);
            tasksToSeed.Add(new DailyLearningTaskEntity
            {
                UserId = userId,
                LearningPathId = path?.Id,
                PlanDate = today,
                TaskType = "ai-exercise",
                Title = isVoluntaryExtra ? $"Luyện tập nâng cao tự nguyện AI HSK {targetHsk}" : $"Luyện tập thích ứng AI HSK {targetHsk}",
                Description = "Hoàn thành 3-5 câu hỏi cá nhân hóa do AI điều chỉnh theo tiến trình làm bài.",
                EstimatedMinutes = estMin,
                Priority = priority++,
                TargetSkill = "grammar",
                TargetHskLevel = targetHsk,
                ResourceId = null,
                DestinationRoute = "/ai-exercises",
                CompletionStatus = "PENDING",
                CreatedAt = now
            });
            budgetMinutes -= estMin;
        }

        if (tasksToSeed.Count > 0)
        {
            _dbContext.DailyLearningTasks.AddRange(tasksToSeed);
            await _dbContext.SaveChangesAsync(cancellationToken);
        }
    }

    private static List<LearningPathMilestoneEntity> BuildMilestones(
        List<LessonEntity> lessons,
        HashSet<string> completedSet,
        int targetHsk,
        List<WeakConceptDto> weakConcepts,
        int dailyMinutes)
    {
        var milestones = new List<LearningPathMilestoneEntity>();
        var total = lessons.Count;
        if (total == 0) return milestones;

        var weakSkillNames = weakConcepts.Select(w => w.SkillCategory).Distinct().ToList();

        // Stage 1 (~30%)
        var count1 = Math.Max(1, (int)Math.Ceiling(total * 0.3));
        var slice1 = lessons.Take(count1).ToList();
        var ids1 = slice1.Select(l => l.Id.ToString()).ToList();
        milestones.Add(new LearningPathMilestoneEntity
        {
            StageOrder = 1,
            Title = $"Giai đoạn 1: Nền tảng & Củng cố Ngữ âm / Từ vựng HSK {targetHsk}",
            Description = "Nắm vững phát âm chuẩn, từ vựng cốt lõi và các mẫu câu giao tiếp cơ bản nhất.",
            PedagogicalGoalVi = "Đạt độ thành thạo > 70% từ vựng trọng tâm và làm quen cấu trúc ngữ pháp mở đầu.",
            TargetSkillsJson = JsonSerializer.Serialize(new[] { "pinyin", "vocabulary" }.Union(weakSkillNames.Take(1)), JsonOptions),
            TopicsJson = JsonSerializer.Serialize(slice1.Select(l => l.TitleVi).ToList(), JsonOptions),
            LessonIdsJson = JsonSerializer.Serialize(ids1, JsonOptions),
            EstimatedDays = Math.Max(5, count1 * (dailyMinutes >= 45 ? 2 : 3)),
            IsCompleted = ids1.Count > 0 && ids1.All(completedSet.Contains)
        });

        // Stage 2 (~40%)
        var count2 = Math.Max(1, (int)Math.Ceiling(total * 0.4));
        var slice2 = lessons.Skip(count1).Take(count2).ToList();
        if (slice2.Count > 0)
        {
            var ids2 = slice2.Select(l => l.Id.ToString()).ToList();
            milestones.Add(new LearningPathMilestoneEntity
            {
                StageOrder = 2,
                Title = $"Giai đoạn 2: Phát triển Ngữ pháp & Đọc hiểu ngữ cảnh HSK {targetHsk}",
                Description = "Mở rộng vốn câu ghép, nhận diện bộ thủ chữ Hán và đọc hiểu các đoạn văn ngắn.",
                PedagogicalGoalVi = "Khắc phục triệt để các lỗi sai ngữ pháp thường gặp và nâng cao khả năng phân tích câu.",
                TargetSkillsJson = JsonSerializer.Serialize(new[] { "grammar", "reading" }, JsonOptions),
                TopicsJson = JsonSerializer.Serialize(slice2.Select(l => l.TitleVi).ToList(), JsonOptions),
                LessonIdsJson = JsonSerializer.Serialize(ids2, JsonOptions),
                EstimatedDays = Math.Max(7, count2 * (dailyMinutes >= 45 ? 2 : 3)),
                IsCompleted = ids2.Count > 0 && ids2.All(completedSet.Contains)
            });
        }

        // Stage 3 (Remaining ~30%)
        var slice3 = lessons.Skip(count1 + count2).ToList();
        if (slice3.Count > 0)
        {
            var ids3 = slice3.Select(l => l.Id.ToString()).ToList();
            milestones.Add(new LearningPathMilestoneEntity
            {
                StageOrder = 3,
                Title = $"Giai đoạn 3: Ứng dụng Thực chiến & Tích hợp Kỹ năng Toàn diện",
                Description = "Hoàn thành toàn bộ hội thoại nâng cao, phản xạ giao tiếp tự nhiên và giải đề thực tế.",
                PedagogicalGoalVi = "Tích hợp phản xạ nghe - đọc - ngữ pháp, sẵn sàng vượt qua kỳ đánh giá HSK chuẩn.",
                TargetSkillsJson = JsonSerializer.Serialize(new[] { "reading", "listening", "grammar" }, JsonOptions),
                TopicsJson = JsonSerializer.Serialize(slice3.Select(l => l.TitleVi).ToList(), JsonOptions),
                LessonIdsJson = JsonSerializer.Serialize(ids3, JsonOptions),
                EstimatedDays = Math.Max(7, slice3.Count * (dailyMinutes >= 45 ? 2 : 3)),
                IsCompleted = ids3.Count > 0 && ids3.All(completedSet.Contains)
            });
        }

        return milestones;
    }

    public static string BuildDeterministicRationale(
        int selectedHsk,
        int targetHsk,
        int? estimatedHsk,
        List<WeakConceptDto> weakConcepts,
        int dailyMinutes,
        int daysPerWeek)
    {
        var weaknessText = weakConcepts.Count > 0
            ? $"Hệ thống nhận thấy bạn cần củng cố thêm các điểm kiến thức: {string.Join(", ", weakConcepts.Take(3).Select(w => w.TitleVi))}."
            : "Bạn đang có nền tảng học tập tương đối đồng đều.";

        var levelText = estimatedHsk.HasValue
            ? $"Kết quả đánh giá khách quan cho thấy trình độ thực tế hiện tại tiệm cận HSK {estimatedHsk.Value}."
            : "Hệ thống đang tiếp tục ghi nhận bằng chứng luyện tập để tinh chỉnh ước lượng năng lực.";

        return $"Lộ trình được thiết kế nhằm đưa bạn từ cấp HSK {selectedHsk} lên mục tiêu HSK {targetHsk} với cường độ {dailyMinutes} phút/ngày ({daysPerWeek} ngày/tuần). {levelText} {weaknessText} Các bài học được sắp xếp theo độ khó lũy tiến bám sát đề cương chuẩn.";
    }

    private static LearningGoalDto MapGoalDto(StudentLearningGoalEntity entity)
    {
        var prioritySkills = !string.IsNullOrWhiteSpace(entity.PrioritySkillsJson)
            ? JsonSerializer.Deserialize<List<string>>(entity.PrioritySkillsJson, JsonOptions) ?? new()
            : new List<string> { "vocabulary", "grammar" };

        return new LearningGoalDto
        {
            TargetHskLevel = entity.TargetHskLevel,
            DailyStudyMinutes = entity.DailyStudyMinutes,
            StudyDaysPerWeek = entity.StudyDaysPerWeek,
            TargetDate = entity.TargetDate,
            PrioritySkills = prioritySkills,
            IntensityMode = entity.IntensityMode,
            UpdatedAt = entity.UpdatedAt
        };
    }

    private static PersonalizedLearningPathDto MapPathDto(
        PersonalizedLearningPathEntity entity,
        List<LessonEntity> allLessons,
        HashSet<string> completedSet)
    {
        var lessonDict = allLessons.ToDictionary(l => l.Id.ToString(), StringComparer.OrdinalIgnoreCase);

        var milestoneDtos = entity.Milestones
            .OrderBy(m => m.StageOrder)
            .Select(m =>
            {
                var lessonIds = !string.IsNullOrWhiteSpace(m.LessonIdsJson)
                    ? JsonSerializer.Deserialize<List<string>>(m.LessonIdsJson, JsonOptions) ?? new()
                    : new List<string>();

                var targetSkills = !string.IsNullOrWhiteSpace(m.TargetSkillsJson)
                    ? JsonSerializer.Deserialize<List<string>>(m.TargetSkillsJson, JsonOptions) ?? new()
                    : new List<string>();

                var topics = !string.IsNullOrWhiteSpace(m.TopicsJson)
                    ? JsonSerializer.Deserialize<List<string>>(m.TopicsJson, JsonOptions) ?? new()
                    : new List<string>();

                var lessonItems = lessonIds
                    .Where(id => lessonDict.ContainsKey(id))
                    .Select(id =>
                    {
                        var l = lessonDict[id];
                        return new LearningPathLessonItemDto
                        {
                            LessonId = l.Id,
                            LessonNumber = l.LessonNumber,
                            TitleZh = l.TitleZh,
                            TitleVi = l.TitleVi,
                            Pinyin = l.Pinyin,
                            DurationMinutes = l.DurationMinutes,
                            IsCompleted = completedSet.Contains(id)
                        };
                    })
                    .ToList();

                return new LearningPathMilestoneDto
                {
                    Id = m.Id,
                    StageOrder = m.StageOrder,
                    Title = m.Title,
                    Description = m.Description,
                    PedagogicalGoalVi = m.PedagogicalGoalVi,
                    TargetSkills = targetSkills,
                    Topics = topics,
                    Lessons = lessonItems,
                    EstimatedDays = m.EstimatedDays,
                    IsCompleted = m.IsCompleted,
                    CompletedAt = m.CompletedAt
                };
            })
            .ToList();

        return new PersonalizedLearningPathDto
        {
            Id = entity.Id,
            UserId = entity.UserId,
            Title = entity.Title,
            TargetHskLevel = entity.TargetHskLevel,
            CurrentEstimatedHskLevel = entity.CurrentEstimatedHskLevel,
            TotalEstimatedWeeks = entity.TotalEstimatedWeeks,
            TotalLessonsCount = entity.TotalLessonsCount,
            CompletedLessonsCount = entity.CompletedLessonsCount,
            OverallProgressPercent = entity.OverallProgressPercent,
            Status = entity.Status,
            PedagogicalRationaleVi = entity.PedagogicalRationaleVi,
            AiFocusTipsVi = entity.AiFocusTipsVi,
            Milestones = milestoneDtos,
            GeneratedAt = entity.GeneratedAt,
            LastReplannedAt = entity.LastReplannedAt
        };
    }

    private static DailyLearningTaskDto MapTaskDto(DailyLearningTaskEntity task)
    {
        return new DailyLearningTaskDto
        {
            TaskId = task.Id,
            TaskType = task.TaskType,
            Title = task.Title,
            Description = task.Description,
            EstimatedMinutes = task.EstimatedMinutes,
            Priority = task.Priority,
            TargetSkill = task.TargetSkill,
            TargetHskLevel = task.TargetHskLevel,
            ResourceId = task.ResourceId,
            DestinationRoute = task.DestinationRoute,
            CompletionStatus = task.CompletionStatus,
            CompletedAt = task.CompletedAt
        };
    }

    private static DailyPlanDto MapDailyPlanDto(DateTime planDate, List<DailyLearningTaskEntity> tasks)
    {
        var dtos = tasks.Select(MapTaskDto).ToList();
        var completedCount = dtos.Count(t => t.CompletionStatus == "COMPLETED");
        var totalMinutes = dtos.Sum(t => t.EstimatedMinutes);
        var percent = dtos.Count > 0 ? Math.Round((double)completedCount / dtos.Count * 100.0, 1) : 0.0;
        var nextTask = dtos.FirstOrDefault(t => t.CompletionStatus != "COMPLETED");

        return new DailyPlanDto
        {
            PlanDate = planDate,
            TotalTasks = dtos.Count,
            CompletedTasks = completedCount,
            TotalEstimatedMinutes = totalMinutes,
            DayCompletionPercent = percent,
            Tasks = dtos,
            SuggestedNextTask = nextTask
        };
    }
}
