using System;
using System.Collections.Generic;

namespace ZhongWenHub.Data.Entities.Learning;

public class PersonalizedLearningPathEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? GoalId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int TargetHskLevel { get; set; } = 1;
    public int? CurrentEstimatedHskLevel { get; set; }
    public int TotalEstimatedWeeks { get; set; } = 4;
    public int TotalLessonsCount { get; set; } = 0;
    public int CompletedLessonsCount { get; set; } = 0;
    public double OverallProgressPercent { get; set; } = 0.0;
    public string Status { get; set; } = "ACTIVE"; // ACTIVE, COMPLETED, ARCHIVED
    public string? PedagogicalRationaleVi { get; set; }
    public string? AiFocusTipsVi { get; set; }
    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastReplannedAt { get; set; }

    public virtual ApplicationUser? User { get; set; }
    public virtual StudentLearningGoalEntity? Goal { get; set; }
    public virtual ICollection<LearningPathMilestoneEntity> Milestones { get; set; } = new List<LearningPathMilestoneEntity>();
}
