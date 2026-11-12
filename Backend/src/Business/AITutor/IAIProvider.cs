namespace ZhongWenHub.Business.AITutor;

public sealed class AIProviderTurn
{
    public string Role { get; init; } = "user";
    public string Content { get; init; } = string.Empty;
}

public sealed class AIProviderRequest
{
    public string Feature { get; init; } = "AI_TUTOR";
    public string SystemInstruction { get; init; } = string.Empty;
    public string UserPrompt { get; init; } = string.Empty;
    public IReadOnlyList<AIProviderTurn> History { get; init; } = Array.Empty<AIProviderTurn>();
    public bool ExpectJson { get; init; } = true;
    public double Temperature { get; init; } = 0.4;
    public int MaxOutputTokens { get; init; } = 1400;
}

public sealed class AIProviderResponse
{
    public string RawText { get; init; } = string.Empty;
    public string Model { get; init; } = string.Empty;
    public string Provider { get; init; } = "Gemini";
    public bool IsMock { get; init; }
    public int PromptTokens { get; init; }
    public int CompletionTokens { get; init; }
    public int TotalTokens { get; init; }
    public int LatencyMs { get; init; }
}

public interface IAIProvider
{
    Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default);
}
