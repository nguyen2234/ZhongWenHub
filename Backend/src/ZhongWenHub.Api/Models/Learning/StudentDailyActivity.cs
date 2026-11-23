using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class StudentDailyActivity : BaseEntity
{
    public Guid UserId { get; set; }
    public string ActivityDate { get; set; } = string.Empty; // YYYY-MM-DD
    public int Minutes { get; set; } = 0;
    public int XpEarned { get; set; } = 0;
    public string CompletedLessonsJson { get; set; } = "[]";
    public int ExercisesCompleted { get; set; } = 0;
    public int ReviewsCompleted { get; set; } = 0;

    public virtual ApplicationUser? User { get; set; }
}
