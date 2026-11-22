using System;
using System.Diagnostics;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ZhongWenHub.Data.Entities.AI;

namespace ZhongWenHub.Common.AI;

public class OpenAiProviderAdapter : IAiProviderAdapter
{
    protected readonly HttpClient HttpClient;

    public OpenAiProviderAdapter(HttpClient httpClient)
    {
        HttpClient = httpClient;
    }

    public virtual string ProviderType => "OPENAI";

    protected virtual string GetEndpoint(AiProviderConfiguration config)
    {
        var baseUrl = string.IsNullOrWhiteSpace(config.BaseUrl)
            ? "https://api.openai.com"
            : config.BaseUrl.TrimEnd('/');

        if (baseUrl.EndsWith("/chat/completions", StringComparison.OrdinalIgnoreCase))
        {
            return baseUrl;
        }

        return $"{baseUrl}/v1/chat/completions";
    }

    public virtual async Task<AiAdapterResponse> GenerateTextAsync(
        AiProviderConfiguration config,
        string apiKey,
        string prompt,
        AiGenerationOptions? options = null,
        CancellationToken ct = default)
    {
        var model = string.IsNullOrWhiteSpace(config.DefaultModel) ? "gpt-4o-mini" : config.DefaultModel;
        var url = GetEndpoint(config);

        var requestBody = new
        {
            model = model,
            messages = new object[]
            {
                new { role = "user", content = prompt }
            },
            max_tokens = options?.MaxTokens ?? config.MaxTokens ?? 2048,
            temperature = options?.Temperature ?? config.Temperature ?? 0.7
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, url);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");

        var sw = Stopwatch.StartNew();
        using var cts = CancellationTokenSource.CreateLinkedTokenSource(ct);
        cts.CancelAfter(TimeSpan.FromSeconds(config.TimeoutSeconds > 0 ? config.TimeoutSeconds : 30));

        var response = await HttpClient.SendAsync(request, cts.Token);
        sw.Stop();

        if (!response.IsSuccessStatusCode)
        {
            var errorText = await response.Content.ReadAsStringAsync(ct);
            throw new HttpRequestException($"OpenAI API error (Status {(int)response.StatusCode}): {errorText}", null, response.StatusCode);
        }

        var json = await response.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(json);

        var text = string.Empty;
        if (doc.RootElement.TryGetProperty("choices", out var choices) &&
            choices.GetArrayLength() > 0 &&
            choices[0].TryGetProperty("message", out var msg) &&
            msg.TryGetProperty("content", out var contentElem))
        {
            text = contentElem.GetString() ?? string.Empty;
        }

        var promptTokens = 0;
        var completionTokens = 0;
        var totalTokens = 0;
        if (doc.RootElement.TryGetProperty("usage", out var usage))
        {
            if (usage.TryGetProperty("prompt_tokens", out var pt)) promptTokens = pt.GetInt32();
            if (usage.TryGetProperty("completion_tokens", out var ctElem)) completionTokens = ctElem.GetInt32();
            if (usage.TryGetProperty("total_tokens", out var tt)) totalTokens = tt.GetInt32();
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

    public virtual async Task<AiHealthCheckResult> TestConnectionAsync(
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
