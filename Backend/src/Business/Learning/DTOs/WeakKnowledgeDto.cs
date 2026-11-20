using System.Collections.Generic;

namespace ZhongWenHub.Business.Learning.DTOs;

public class WeakKnowledgeSuggestedPracticeDto
{
    public string Title { get; set; } = string.Empty;
    public string Route { get; set; } = string.Empty;
    public List<string> ExerciseIds { get; set; } = new();
}

public class WeakKnowledgeDto
{
    public string Id { get; set; } = string.Empty;
    public string KnowledgePointId { get; set; } = string.Empty;
    public string TopicTitle { get; set; } = string.Empty;
    public string Category { get; set; } = "grammar";
    public int HskLevel { get; set; } = 1;
    public int TotalAttempts { get; set; }
    public int CorrectAttempts { get; set; }
    public int IncorrectAttempts { get; set; }
    public double Accuracy { get; set; }
    public string MasteryLevel { get; set; } = "WEAK";
    public string Trend { get; set; } = "stagnant";
    public string Evidence { get; set; } = string.Empty;
    public WeakKnowledgeSuggestedPracticeDto SuggestedPractice { get; set; } = new();
    public string LastEvaluatedAt { get; set; } = string.Empty;
}
