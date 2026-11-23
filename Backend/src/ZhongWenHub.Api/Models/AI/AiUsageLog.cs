using System;

namespace ZhongWenHub.Data.Entities.AI;

public class AiUsageLog : BaseEntity
{
    public Guid UserId { get; set; }
    public string Feature { get; set; } = "AI_TUTOR"; // AI_TUTOR, AI_CONVERSATION, AI_EXERCISE_GEN, AI_LEARNING_EXPLAIN
    public string Provider { get; set; } = "Gemini"; // Gemini, Mock
    public string Model { get; set; } = string.Empty;
    public bool IsMock { get; set; }
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
    public int LatencyMs { get; set; }
    public bool Success { get; set; }
    public string? ErrorCode { get; set; }
}
