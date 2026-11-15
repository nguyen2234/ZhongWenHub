using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class DailyLearningTaskEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public Guid? LearningPathId { get; set; }
    public DateTime PlanDate { get; set; }
    public string TaskType { get; set; } = "vocab"; // vocab, srs, grammar, reading, ai-exercise, weakness, lesson
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int EstimatedMinutes { get; set; } = 10;
    public int Priority { get; set; } = 1; // 1 = High, 2 = Medium, 3 = Normal
    public string TargetSkill { get; set; } = "vocabulary"; // vocabulary, grammar, reading, pinyin, hanzi, listening
    public int TargetHskLevel { get; set; } = 1;
    public string? ResourceId { get; set; }
    public string DestinationRoute { get; set; } = "/dashboard";
    public string CompletionStatus { get; set; } = "PENDING"; // PENDING, IN_PROGRESS, COMPLETED
    public DateTime? CompletedAt { get; set; }

    public virtual ApplicationUser? User { get; set; }
    public virtual PersonalizedLearningPathEntity? LearningPath { get; set; }
}
