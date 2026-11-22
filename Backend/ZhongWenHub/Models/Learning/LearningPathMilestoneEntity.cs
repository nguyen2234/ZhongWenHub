using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class LearningPathMilestoneEntity : BaseEntity
{
    public Guid LearningPathId { get; set; }
    public int StageOrder { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? PedagogicalGoalVi { get; set; }
    public string TargetSkillsJson { get; set; } = "[]";
    public string TopicsJson { get; set; } = "[]";
    public string LessonIdsJson { get; set; } = "[]";
    public int EstimatedDays { get; set; } = 7;
    public bool IsCompleted { get; set; } = false;
    public DateTime? CompletedAt { get; set; }

    public virtual PersonalizedLearningPathEntity? LearningPath { get; set; }
}

