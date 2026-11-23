using System;

namespace ZhongWenHub.Data.Entities.AI;

public class LearningSkillStatistic : BaseEntity
{
    public Guid UserId { get; set; }
    public string SkillCategory { get; set; } = "vocabulary"; // vocabulary, grammar, hanzi, pinyin, reading, listening
    public int TotalAttempts { get; set; }
    public int CorrectAttempts { get; set; }
    public int IncorrectAttempts { get; set; }
    public double AccuracyPercent { get; set; }
    public string? WeakTopicsJson { get; set; }
    public DateTime LastAssessedAt { get; set; } = DateTime.UtcNow;

    public virtual ApplicationUser? User { get; set; }
}
