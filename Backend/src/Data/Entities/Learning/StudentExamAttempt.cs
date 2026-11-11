using ZhongWenHub.Data.Entities.Content;

namespace ZhongWenHub.Data.Entities.Learning;

public class StudentExamAttempt : BaseEntity
{
    public Guid UserId { get; set; }
    public ApplicationUser? User { get; set; }

    public Guid ExamId { get; set; }
    public ExamEntity? Exam { get; set; }

    public int Score { get; set; }
    public int MaxScore { get; set; }
    public bool IsPassed { get; set; }
    public int TimeSpentSeconds { get; set; }
    public string? AnswersJson { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
}

