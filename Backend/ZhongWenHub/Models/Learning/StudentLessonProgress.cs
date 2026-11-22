using System;

namespace ZhongWenHub.Data.Entities.Learning;

public class StudentLessonProgress : BaseEntity
{
    public Guid UserId { get; set; }
    public string LessonId { get; set; } = string.Empty;
    public string Status { get; set; } = "NOT_STARTED"; // NOT_STARTED, IN_PROGRESS, COMPLETED
    public int CurrentStepIndex { get; set; } = 0;
    public int MaxUnlockedStepIndex { get; set; } = 0;
    public int? QuizScore { get; set; }
    public int? TotalQuizQuestions { get; set; }
    public int XpEarned { get; set; } = 0;
    public DateTime? CompletedAt { get; set; }

    public virtual ApplicationUser? User { get; set; }
}
