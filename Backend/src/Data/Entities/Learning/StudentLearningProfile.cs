using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class StudentLearningProfile : BaseEntity
{
    public Guid UserId { get; set; }
    public int SelectedHskLevel { get; set; } = 1;
    public string CurrentLessonId { get; set; } = "aaaaaaaa-1111-1111-1111-111111111111";
    public int XpTotal { get; set; } = 0;
    public int StreakDays { get; set; } = 0;
    public string LastActivityDate { get; set; } = string.Empty;
    public int TargetDailyMinutes { get; set; } = 30;
    public int TargetDailyXp { get; set; } = 50;

    public virtual ApplicationUser? User { get; set; }
}
