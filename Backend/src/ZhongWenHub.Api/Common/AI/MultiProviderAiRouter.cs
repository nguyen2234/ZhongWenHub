using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ZhongWenHub.Data;
using ZhongWenHub.Data.Entities.AI;

namespace ZhongWenHub.Common.AI;

public class AiRouterUnavailableException : Exception
{
    public AiRouterUnavailableException(string message) : base(message)
    {
    }
}

public class MultiProviderAiRouter : IMultiProviderAiRouter
{
    private readonly ApplicationDbContext _dbContext;
    private readonly IEnumerable<IAiProviderAdapter> _adapters;
    private readonly IAiProviderSecretProtector _secretProtector;
    private readonly ILogger<MultiProviderAiRouter> _logger;

    public MultiProviderAiRouter(
        ApplicationDbContext dbContext,
        IEnumerable<IAiProviderAdapter> adapters,
        IAiProviderSecretProtector secretProtector,
        ILogger<MultiProviderAiRouter> logger)
    {
        _dbContext = dbContext;
        _adapters = adapters;
        _secretProtector = secretProtector;
        _logger = logger;
    }

    public async Task<AiRouterResult> GenerateAsync(
        string capability,
        string prompt,
        AiGenerationOptions? options = null,
        Guid? userId = null,
        string feature = "AI_TUTOR",
        CancellationToken ct = default)
    {
        var providers = await _dbContext.AiProviderConfigurations
            .Where(p => p.IsEnabled)
            .OrderBy(p => p.Priority)
            .ToListAsync(ct);

        var matchingProviders = providers.Where(p =>
        {
            if (string.IsNullOrWhiteSpace(capability) || string.IsNullOrWhiteSpace(p.CapabilitiesJson))
            {
                return true;
            }

            try
            {
                var caps = JsonSerializer.Deserialize<List<string>>(p.CapabilitiesJson);
                return caps != null && (caps.Contains(capability, StringComparer.OrdinalIgnoreCase) || caps.Contains("*"));
            }
            catch
            {
                return true;
            }
        }).ToList();

        if (matchingProviders.Count == 0)
        {
            _logger.LogWarning("No enabled AI provider found for capability '{Capability}'.", capability);
            throw new AiRouterUnavailableException("All AI providers are currently unavailable. Please try again later.");
        }

        List<string> failureReasons = new();

        foreach (var config in matchingProviders)
        {
            var adapter = _adapters.FirstOrDefault(a => 
                string.Equals(a.ProviderType, config.ProviderType, StringComparison.OrdinalIgnoreCase));

            if (adapter == null)
            {
                _logger.LogWarning("No adapter found for provider type '{ProviderType}'. Skipping provider '{Name}'.", config.ProviderType, config.Name);
                continue;
            }

            var apiKey = _secretProtector.Decrypt(config.EncryptedApiKey);
            if (string.IsNullOrWhiteSpace(apiKey))
            {
                _logger.LogWarning("API key could not be decrypted for provider '{Name}'. Skipping.", config.Name);
                continue;
            }

            var sw = Stopwatch.StartNew();
            try
            {
                _logger.LogInformation("Attempting AI generation with provider '{Name}' (Priority {Priority}).", config.Name, config.Priority);
                var response = await adapter.GenerateTextAsync(config, apiKey, prompt, options, ct);
                sw.Stop();

                // Log successful usage
                var usageLog = new AiUsageLog
                {
                    UserId = userId ?? Guid.Empty,
                    Feature = feature,
                    Provider = config.Name,
                    Model = response.Model,
                    PromptTokens = response.PromptTokens,
                    CompletionTokens = response.CompletionTokens,
                    TotalTokens = response.TotalTokens,
                    LatencyMs = (int)response.LatencyMs,
                    Success = true,
                    CreatedAt = DateTime.UtcNow
                };
                _dbContext.AiUsageLogs.Add(usageLog);
                await _dbContext.SaveChangesAsync(ct);

                return new AiRouterResult
                {
                    IsSuccess = true,
                    Text = response.Text,
                    ProviderName = config.Name,
                    ProviderType = config.ProviderType,
                    Model = response.Model,
                    PromptTokens = response.PromptTokens,
                    CompletionTokens = response.CompletionTokens,
                    TotalTokens = response.TotalTokens,
                    LatencyMs = response.LatencyMs
                };
            }
            catch (Exception ex)
            {
                sw.Stop();
                var statusCode = (ex as HttpRequestException)?.StatusCode;
                var isTransient = ex is TimeoutException 
                    || ex is TaskCanceledException 
                    || statusCode == HttpStatusCode.RequestTimeout 
                    || statusCode == HttpStatusCode.TooManyRequests 
                    || (statusCode.HasValue && (int)statusCode.Value >= 500);

                _logger.LogWarning(ex, "Provider '{Name}' failed with {Status}. Transient: {Transient}. Failing over...", 
                    config.Name, statusCode?.ToString() ?? ex.GetType().Name, isTransient);

                failureReasons.Add($"Provider '{config.Name}' failed: {ex.Message}");

                // Log failed attempt
                try
                {
                    var failLog = new AiUsageLog
                    {
                        UserId = userId ?? Guid.Empty,
                        Feature = feature,
                        Provider = config.Name,
                        Model = config.DefaultModel,
                        LatencyMs = (int)sw.ElapsedMilliseconds,
                        Success = false,
                        ErrorCode = statusCode?.ToString() ?? ex.GetType().Name,
                        CreatedAt = DateTime.UtcNow
                    };
                    _dbContext.AiUsageLogs.Add(failLog);
                    await _dbContext.SaveChangesAsync(ct);
                }
                catch
                {
                    // Ignore usage logging failure
                }
            }
        }

        _logger.LogError("All AI providers failed. Reasons: {Reasons}", string.Join("; ", failureReasons));
        throw new AiRouterUnavailableException("All AI providers are currently unavailable. Please try again later.");
    }
}
