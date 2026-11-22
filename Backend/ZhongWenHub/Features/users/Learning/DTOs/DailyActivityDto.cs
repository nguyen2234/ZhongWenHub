using System.Collections.Generic;

namespace ZhongWenHub.Business.Learning.DTOs;

public class DailyActivityDto
{
    public string Date { get; set; } = string.Empty;
    public int Minutes { get; set; }
    public int XpEarned { get; set; }
    public List<string> CompletedLessons { get; set; } = new();
    public int ExercisesCompleted { get; set; }
    public int ReviewsCompleted { get; set; }
}
