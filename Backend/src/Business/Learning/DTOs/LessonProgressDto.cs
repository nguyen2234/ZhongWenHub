namespace ZhongWenHub.Business.Learning.DTOs;

public class LessonProgressDto
{
    public string LessonId { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string Status { get; set; } = "NOT_STARTED";
    public int CurrentStepIndex { get; set; }
    public int MaxUnlockedStepIndex { get; set; }
    public int? QuizScore { get; set; }
    public int? TotalQuizQuestions { get; set; }
    public int XpEarned { get; set; }
    public string? CompletedAt { get; set; }
    public string UpdatedAt { get; set; } = string.Empty;
}
