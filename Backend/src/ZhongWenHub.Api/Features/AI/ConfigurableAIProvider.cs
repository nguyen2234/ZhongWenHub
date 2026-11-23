using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Options;
using ZhongWenHub.Common.AI;

namespace ZhongWenHub.Business.AITutor;

public sealed class ConfigurableAIProvider : IAIProvider
{
    private readonly GeminiProvider _geminiProvider;
    private readonly GeminiOptions _options;
    private readonly IMultiProviderAiRouter? _router;

    public ConfigurableAIProvider(
        GeminiProvider geminiProvider,
        IOptions<GeminiOptions> options,
        IMultiProviderAiRouter? router = null)
    {
        _geminiProvider = geminiProvider;
        _options = options.Value;
        _router = router;
    }

    public async Task<AIProviderResponse> GenerateContentAsync(
        AIProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        if (_router != null)
        {
            try
            {
                var routerResult = await _router.GenerateAsync(
                    capability: "chat",
                    prompt: request.UserPrompt,
                    options: new AiGenerationOptions
                    {
                        MaxTokens = request.MaxOutputTokens,
                        Temperature = request.Temperature,
                        SystemInstruction = request.SystemInstruction
                    },
                    ct: cancellationToken);

                return new AIProviderResponse
                {
                    RawText = routerResult.Text,
                    Model = routerResult.Model,
                    Provider = routerResult.ProviderName,
                    IsMock = false,
                    PromptTokens = routerResult.PromptTokens,
                    CompletionTokens = routerResult.CompletionTokens,
                    TotalTokens = routerResult.TotalTokens,
                    LatencyMs = (int)routerResult.LatencyMs
                };
            }
            catch (AiRouterUnavailableException)
            {
                // If router had no matching providers or all failed, fallback to geminiProvider if configured
                return await _geminiProvider.GenerateContentAsync(request, cancellationToken);
            }
        }

        return await _geminiProvider.GenerateContentAsync(request, cancellationToken);
    }
}
