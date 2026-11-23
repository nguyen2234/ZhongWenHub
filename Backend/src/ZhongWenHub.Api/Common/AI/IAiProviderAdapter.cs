using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Data.Entities.AI;

namespace ZhongWenHub.Common.AI;

public class AiGenerationOptions
{
    public int? MaxTokens { get; set; }
    public double? Temperature { get; set; }
    public string? SystemInstruction { get; set; }
}

public class AiAdapterResponse
{
    public string Text { get; set; } = string.Empty;
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public int TotalTokens { get; set; }
    public long LatencyMs { get; set; }
    public string Model { get; set; } = string.Empty;
}

public class AiHealthCheckResult
{
    public bool IsSuccess { get; set; }
    public int StatusCode { get; set; }
    public long LatencyMs { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
}

public interface IAiProviderAdapter
{
    string ProviderType { get; }
    Task<AiAdapterResponse> GenerateTextAsync(
        AiProviderConfiguration config,
        string apiKey,
        string prompt,
        AiGenerationOptions? options = null,
        CancellationToken ct = default);

    Task<AiHealthCheckResult> TestConnectionAsync(
        AiProviderConfiguration config,
        string apiKey,
        CancellationToken ct = default);
}
