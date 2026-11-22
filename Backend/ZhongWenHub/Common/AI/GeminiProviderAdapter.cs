using System;
using System.Diagnostics;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Data.Entities.AI;

namespace ZhongWenHub.Common.AI;

public class GeminiProviderAdapter : IAiProviderAdapter
{
    private readonly HttpClient _httpClient;

    public GeminiProviderAdapter(HttpClient httpClient)
    {
        _httpClient = httpClient;
    }

    public string ProviderType => "GEMINI";

    public async Task<AiAdapterResponse> GenerateTextAsync(
        AiProviderConfiguration config,
        string apiKey,
        string prompt,
        AiGenerationOptions? options = null,
        CancellationToken ct = default)
    {
        var model = string.IsNullOrWhiteSpace(config.DefaultModel) ? "gemini-1.5-flash" : config.DefaultModel;
        var baseUrl = string.IsNullOrWhiteSpace(config.BaseUrl)
            ? "https://generativelanguage.googleapis.com"
            : config.BaseUrl.TrimEnd('/');

        var url = $"{baseUrl}/v1beta/models/{model}:generateContent?key={apiKey}";

        var requestBody = new
        {
            contents = new[]
            {
                new { parts = new[] { new { text = prompt } } }
            },
            generationConfig = new
            {
                maxOutputTokens = options?.MaxTokens ?? config.MaxTokens ?? 2048,
                temperature = options?.Temperature ?? config.Temperature ?? 0.7
            }
        };

        var content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var sw = Stopwatch.StartNew();
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(config.TimeoutSeconds > 0 ? config.TimeoutSeconds : 30));

        var response = await _httpClient.PostAsync(url, content, cts.Token);
        sw.Stop();

        if (!response.IsSuccessStatusCode)
        {
            var errorText = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"Gemini API error (Status {(int)response.StatusCode}): {errorText}", null, response.StatusCode);
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);

        var text = string.Empty;
        if (doc.RootElement.TryGetProperty("candidates", out var candidates) &&
            candidates.GetArrayLength() > 0 &&
            candidates[0].TryGetProperty("content", out var contentElem) &&
            contentElem.TryGetProperty("parts", out var parts) &&
            parts.GetArrayLength() > 0 &&
            parts[0].TryGetProperty("text", out var textElem))
        {
            text = textElem.GetString() ?? string.Empty;
        }

        var promptTokens = 0;
        var completionTokens = 0;
        var totalTokens = 0;
        if (doc.RootElement.TryGetProperty("usageMetadata", out var usage))
        {
            if (usage.TryGetProperty("promptTokenCount", out var pt)) promptTokens = pt.GetInt32();
            if (usage.TryGetProperty("candidatesTokenCount", out var ctElem)) completionTokens = ctElem.GetInt32();
            if (usage.TryGetProperty("totalTokenCount", out var tt)) totalTokens = tt.GetInt32();
        }

        return new AiAdapterResponse
        {
            Text = text,
            PromptTokens = promptTokens,
            CompletionTokens = completionTokens,
            TotalTokens = totalTokens > 0 ? totalTokens : promptTokens + completionTokens,
            LatencyMs = sw.ElapsedMilliseconds,
            Model = model
        };
    }

    public async Task<AiHealthCheckResult> TestConnectionAsync(
        AiProviderConfiguration config,
        string apiKey,
        CancellationToken ct = default)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            var res = await GenerateTextAsync(config, apiKey, "Say OK", new AiGenerationOptions { MaxTokens = 10 }, ct);
            sw.Stop();
            return new AiHealthCheckResult
            {
                IsSuccess = true,
                StatusCode = 200,
                LatencyMs = sw.ElapsedMilliseconds,
                Message = "Connection successful. Response: " + (res.Text.Length > 50 ? res.Text[..50] : res.Text).Trim(),
                Model = config.DefaultModel
            };
        }
        catch (HttpRequestException ex)
        {
            sw.Stop();
            return new AiHealthCheckResult
            {
                IsSuccess = false,
                StatusCode = (int)(ex.StatusCode ?? System.Net.HttpStatusCode.BadGateway),
                LatencyMs = sw.ElapsedMilliseconds,
                Message = ex.Message,
                Model = config.DefaultModel
            };
        }
        catch (Exception ex)
        {
            sw.Stop();
            return new AiHealthCheckResult
            {
                IsSuccess = false,
                StatusCode = 500,
                LatencyMs = sw.ElapsedMilliseconds,
                Message = ex.Message,
                Model = config.DefaultModel
            };
        }
    }
}
