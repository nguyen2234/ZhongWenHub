using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace ZhongWenHub.Business.AITutor;

public sealed class GeminiProvider : IAIProvider
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);

    private readonly HttpClient _httpClient;
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiProvider> _logger;

    public GeminiProvider(
        HttpClient httpClient,
        IOptions<GeminiOptions> options,
        ILogger<GeminiProvider> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<AIProviderResponse> GenerateContentAsync(
        AIProviderRequest request,
        CancellationToken cancellationToken = default)
    {
        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogWarning("Gemini AI call blocked: Gemini API key is not configured.");
            throw AITutorException.MissingConfiguration();
        }

        var model = string.IsNullOrWhiteSpace(_options.Model) ? "gemini-3-flash-preview" : _options.Model.Trim();
        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl)
            ? "https://generativelanguage.googleapis.com/v1beta"
            : _options.BaseUrl.TrimEnd('/');
        var endpoint = $"{baseUrl}/models/{Uri.EscapeDataString(model)}:generateContent";

        var timeoutSeconds = Math.Clamp(_options.TimeoutSeconds, 5, 120);
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(timeoutSeconds));

        var payload = BuildRequestPayload(request);
        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(JsonSerializer.Serialize(payload, JsonOptions), Encoding.UTF8, "application/json")
        };
        // Send API key via request header instead of URL query string so it never appears in HTTP/proxy logs.
        httpRequest.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);

        HttpResponseMessage httpResponse;
        try
        {
            httpResponse = await _httpClient.SendAsync(httpRequest, HttpCompletionOption.ResponseHeadersRead, timeoutCts.Token);
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (OperationCanceledException ex)
        {
            _logger.LogWarning(ex, "Gemini AI request timed out after {TimeoutSeconds}s for model {Model}.", timeoutSeconds, model);
            throw AITutorException.Timeout();
        }
        catch (HttpRequestException ex)
        {
            _logger.LogWarning(ex, "Gemini AI network failure for model {Model}.", model);
            throw AITutorException.ProviderUnavailable();
        }

        using (httpResponse)
        {
            if (!httpResponse.IsSuccessStatusCode)
            {
                throw MapProviderError(httpResponse.StatusCode, model);
            }

            string responseBody;
            try
            {
                responseBody = await httpResponse.Content.ReadAsStringAsync(timeoutCts.Token);
            }
            catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
            {
                throw;
            }
            catch (OperationCanceledException ex)
            {
                _logger.LogWarning(ex, "Gemini AI response read timed out for model {Model}.", model);
                throw AITutorException.Timeout();
            }

            var rawText = ExtractCandidateText(responseBody);
            if (string.IsNullOrWhiteSpace(rawText))
            {
                _logger.LogWarning("Gemini AI returned empty candidate content for model {Model}.", model);
                throw AITutorException.ProviderUnavailable("Trợ giảng AI không trả về nội dung hợp lệ. Vui lòng thử đặt câu hỏi khác.");
            }

            return new AIProviderResponse
            {
                RawText = rawText,
                Model = model
            };
        }
    }

    private string ResolveApiKey()
    {
        if (!string.IsNullOrWhiteSpace(_options.ApiKey))
        {
            return _options.ApiKey.Trim();
        }

        return Environment.GetEnvironmentVariable("GEMINI_API_KEY")?.Trim() ?? string.Empty;
    }

    private object BuildRequestPayload(AIProviderRequest request)
    {
        var generationConfig = new Dictionary<string, object>
        {
            ["temperature"] = request.Temperature,
            ["maxOutputTokens"] = request.MaxOutputTokens
        };

        if (request.ExpectJson)
        {
            generationConfig["responseMimeType"] = "application/json";
        }

        var contents = new List<object>();
        if (request.History is { Count: > 0 })
        {
            foreach (var turn in request.History)
            {
                if (string.IsNullOrWhiteSpace(turn.Content)) continue;
                var normalizedRole = string.Equals(turn.Role, "model", StringComparison.OrdinalIgnoreCase)
                    ? "model"
                    : "user";
                contents.Add(new
                {
                    role = normalizedRole,
                    parts = new[]
                    {
                        new { text = turn.Content }
                    }
                });
            }
        }

        contents.Add(new
        {
            role = "user",
            parts = new[]
            {
                new { text = request.UserPrompt }
            }
        });

        return new Dictionary<string, object>
        {
            ["systemInstruction"] = new
            {
                parts = new[]
                {
                    new { text = request.SystemInstruction }
                }
            },
            ["contents"] = contents,
            ["generationConfig"] = generationConfig
        };
    }

    private AITutorException MapProviderError(HttpStatusCode statusCode, string model)
    {
        var numericCode = (int)statusCode;
        _logger.LogWarning("Gemini AI returned HTTP {StatusCode} for model {Model}.", numericCode, model);

        return statusCode switch
        {
            HttpStatusCode.TooManyRequests => AITutorException.QuotaExceeded(),
            HttpStatusCode.RequestTimeout or HttpStatusCode.GatewayTimeout => AITutorException.Timeout(),
            HttpStatusCode.Unauthorized or HttpStatusCode.Forbidden => AITutorException.ProviderUnavailable(
                "Không thể xác thực với dịch vụ AI. Vui lòng kiểm tra cấu hình máy chủ."),
            _ => AITutorException.ProviderUnavailable()
        };
    }

    public static string ExtractCandidateText(string responseBody)
    {
        if (string.IsNullOrWhiteSpace(responseBody))
        {
            return string.Empty;
        }

        try
        {
            using var doc = JsonDocument.Parse(responseBody);
            if (!doc.RootElement.TryGetProperty("candidates", out var candidates) ||
                candidates.ValueKind != JsonValueKind.Array ||
                candidates.GetArrayLength() == 0)
            {
                return string.Empty;
            }

            var firstCandidate = candidates[0];
            if (!firstCandidate.TryGetProperty("content", out var content) ||
                !content.TryGetProperty("parts", out var parts) ||
                parts.ValueKind != JsonValueKind.Array)
            {
                return string.Empty;
            }

            var sb = new StringBuilder();
            foreach (var part in parts.EnumerateArray())
            {
                if (part.TryGetProperty("thought", out var thoughtProp) && thoughtProp.ValueKind == JsonValueKind.True)
                {
                    continue;
                }

                if (part.TryGetProperty("text", out var textProp) && textProp.ValueKind == JsonValueKind.String)
                {
                    var fragment = textProp.GetString();
                    if (!string.IsNullOrEmpty(fragment))
                    {
                        if (sb.Length > 0) sb.Append('\n');
                        sb.Append(fragment);
                    }
                }
            }

            return sb.ToString().Trim();
        }
        catch (JsonException)
        {
            return string.Empty;
        }
    }
}
