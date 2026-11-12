namespace ZhongWenHub.Business.AITutor;

public sealed class AIProviderTurn
{
    public string Role { get; init; } = "user";
    public string Content { get; init; } = string.Empty;
}

public sealed class AIProviderRequest
{
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
}

public interface IAIProvider
{
    Task<AIProviderResponse> GenerateContentAsync(AIProviderRequest request, CancellationToken cancellationToken = default);
}
