using System;
using System.Threading;
using System.Threading.Tasks;

namespace ZhongWenHub.Common.AI;

public class AiRouterResult
{
    public bool IsSuccess { get; set; }
    public string Text { get; set; } = string.Empty;
    public string ProviderName { get; set; } = string.Empty;
    public string ProviderType { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
    public long LatencyMs { get; set; }
    public string? ErrorMessage { get; set; }
}

public interface IMultiProviderAiRouter
{
    Task<AiRouterResult> GenerateAsync(
        string capability,
        string prompt,
        AiGenerationOptions? options = null,
        Guid? userId = null,
        string feature = "AI_TUTOR",
        CancellationToken ct = default);
}
