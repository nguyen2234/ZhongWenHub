using System;
using System.Collections.Generic;

namespace ZhongWenHub.Business.AILearning.DTOs;

public sealed class LearningGoalDto
{
    public int TargetHskLevel { get; init; } = 1;
    public int DailyStudyMinutes { get; init; } = 30; // 15, 30, 45, 60
    public int StudyDaysPerWeek { get; init; } = 5; // 1-7
    public DateTime? TargetDate { get; init; }
    public List<string> PrioritySkills { get; init; } = new();
    public string IntensityMode { get; init; } = "balanced"; // light, balanced, intensive
    public DateTime? UpdatedAt { get; init; }
}

public sealed class UpdateLearningGoalDto
{
    public int TargetHskLevel { get; init; } = 1;
    public int DailyStudyMinutes { get; init; } = 30;
    public int StudyDaysPerWeek { get; init; } = 5;
    public DateTime? TargetDate { get; init; }
    public List<string> PrioritySkills { get; init; } = new();
    public string IntensityMode { get; init; } = "balanced";
}

public sealed class GenerateLearningPathRequestDto
{
    public int? TargetHskLevel { get; init; }
    public bool IncludeAiExplanation { get; init; } = true;
}

public sealed class LearningPathLessonItemDto
{
    public Guid LessonId { get; init; }
    public int LessonNumber { get; init; }
    public string TitleZh { get; init; } = string.Empty;
    public string TitleVi { get; init; } = string.Empty;
    public string? Pinyin { get; init; }
    public int DurationMinutes { get; init; }
    public bool IsCompleted { get; init; }
}

public sealed class LearningPathMilestoneDto
{
    public Guid Id { get; init; }
    public int StageOrder { get; init; }
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public string? PedagogicalGoalVi { get; init; }
    public List<string> TargetSkills { get; init; } = new();
    public List<string> Topics { get; init; } = new();
    public List<LearningPathLessonItemDto> Lessons { get; init; } = new();
    public int EstimatedDays { get; init; }
    public bool IsCompleted { get; init; }
    public DateTime? CompletedAt { get; init; }
}

public sealed class PersonalizedLearningPathDto
{
    public Guid Id { get; init; }
    public Guid UserId { get; init; }
    public string Title { get; init; } = string.Empty;
    public int TargetHskLevel { get; init; }
    public int? CurrentEstimatedHskLevel { get; init; }
    public int TotalEstimatedWeeks { get; init; }
    public int TotalLessonsCount { get; init; }
    public int CompletedLessonsCount { get; init; }
    public double OverallProgressPercent { get; init; }
    public string Status { get; init; } = "ACTIVE"; // ACTIVE, COMPLETED, ARCHIVED
    public string? PedagogicalRationaleVi { get; init; }
    public string? AiFocusTipsVi { get; init; }
    public List<LearningPathMilestoneDto> Milestones { get; init; } = new();
    public DateTime GeneratedAt { get; init; }
    public DateTime? LastReplannedAt { get; init; }
}

public sealed class DailyLearningTaskDto
{
    public Guid TaskId { get; init; }
    public string TaskType { get; init; } = "vocab"; // vocab, srs, grammar, reading, ai-exercise, weakness, lesson
    public string Title { get; init; } = string.Empty;
    public string? Description { get; init; }
    public int EstimatedMinutes { get; init; }
    public int Priority { get; init; } // 1 = High, 2 = Medium, 3 = Normal
    public string TargetSkill { get; init; } = "vocabulary";
    public int TargetHskLevel { get; init; }
    public string? ResourceId { get; init; }
    public string DestinationRoute { get; init; } = "/dashboard";
    public string CompletionStatus { get; init; } = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED
    public DateTime? CompletedAt { get; init; }
}

public sealed class DailyPlanDto
{
    public DateTime PlanDate { get; init; }
    public int TotalTasks { get; init; }
    public int CompletedTasks { get; init; }
    public int TotalEstimatedMinutes { get; init; }
    public double DayCompletionPercent { get; init; }
    public List<DailyLearningTaskDto> Tasks { get; init; } = new();
    public DailyLearningTaskDto? SuggestedNextTask { get; init; }
}

public sealed class CompleteTaskResponseDto
{
    public bool Success { get; init; }
    public Guid CompletedTaskId { get; init; }
    public int RemainingTasksCount { get; init; }
    public double DayCompletionPercent { get; init; }
    public double UpdatedOverallProgressPercent { get; init; }
    public DailyLearningTaskDto? SuggestedNextTask { get; init; }
    public string Message { get; init; } = string.Empty;
}

public sealed class AdaptiveReplanRequestDto
{
    public string? Reason { get; init; }
    public int? AvailableMinutes { get; init; }
}

public sealed class PersonalizedLearningProgressDto
{
    public int SelectedHskLevel { get; init; }
    public int? EstimatedHskLevel { get; init; }
    public double PathProgressPercent { get; init; }
    public int ActiveMilestoneOrder { get; init; }
    public int TotalMilestones { get; init; }
    public int CompletedMilestones { get; init; }
    public int TodayCompletedTasks { get; init; }
    public int TodayTotalTasks { get; init; }
    public int CurrentStreakDays { get; init; }
    public int TotalXp { get; init; }
    public List<string> PrioritySkills { get; init; } = new();
    public string? NextRecommendedActionVi { get; init; }
}
