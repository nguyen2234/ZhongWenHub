using System;

namespace ZhongWenHub.Models.Learning;

public class StudentLearningGoalEntity : BaseEntity
{
    public Guid UserId { get; set; }
    public int TargetHskLevel { get; set; } = 1;
    public int DailyStudyMinutes { get; set; } = 30; // 15, 30, 45, 60
    public int StudyDaysPerWeek { get; set; } = 5; // 1-7
    public DateTime? TargetDate { get; set; }
    public string PrioritySkillsJson { get; set; } = "[]"; // ["vocabulary", "grammar", "reading", "listening", "hanzi", "pinyin"]
    public string IntensityMode { get; set; } = "balanced"; // light, balanced, intensive

    public virtual ApplicationUser? User { get; set; }
}

