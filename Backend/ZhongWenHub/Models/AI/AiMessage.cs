using System;

namespace ZhongWenHub.Data.Entities.AI;

public class AiMessage : BaseEntity
{
    public Guid SessionId { get; set; }
    public Guid UserId { get; set; }
    public string Role { get; set; } = "user"; // user, assistant
    public string ContentZh { get; set; } = string.Empty;
    public string? Pinyin { get; set; }
    public string? ContentVi { get; set; }
    public string? CorrectionJson { get; set; }
    public string? StructuredPayloadJson { get; set; }
    public string? Model { get; set; }
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int LatencyMs { get; set; }

    public virtual AiConversationSession? Session { get; set; }
}
