namespace ZhongWenHub.Business.Learning.DTOs;

public class PracticeAttemptDto
{
    public string Id { get; set; } = string.Empty;
    public string StudentId { get; set; } = string.Empty;
    public string ExerciseId { get; set; } = string.Empty;
    public string? QuestionId { get; set; }
    public string KnowledgePointId { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public string Category { get; set; } = "grammar";
    public int HskLevel { get; set; } = 1;
    public string UserAnswer { get; set; } = string.Empty;
    public bool IsCorrect { get; set; }
    public string AttemptedAt { get; set; } = string.Empty;
}
