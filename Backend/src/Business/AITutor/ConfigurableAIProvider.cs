using Microsoft.Extensions.Options;

namespace ZhongWenHub.Business.AITutor;

/// <summary>
/// Explicit AI provider router based on configuration ("Gemini" or "Mock").
/// Never falls back silently to another provider.
/// </summary>
public sealed class ConfigurableAIProvider : IAIProvider
{
    private readonly GeminiProvider _geminiProvider;
    private readonly MockAIProvider _mockProvider;
    private readonly GeminiOptions _options;

    public ConfigurableAIProvider(
        GeminiProvider geminiProvider,
        MockAIProvider mockProvider,
        IOptions<GeminiOptions> options)
    {
        _geminiProvider = geminiProvider;
        _mockProvider = mockProvider;
        _options = options.Value;
    }

    public Task<AIProviderResponse> GenerateContentAsync(
        AIProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (string.Equals(_options.Provider?.Trim(), "Mock", StringComparison.OrdinalIgnoreCase))
        {
            return _mockProvider.GenerateContentAsync(request, cancellationToken);
        }

        return _geminiProvider.GenerateContentAsync(request, cancellationToken);
    }
}
