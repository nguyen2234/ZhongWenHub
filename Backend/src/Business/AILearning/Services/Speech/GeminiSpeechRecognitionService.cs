using System;
using System.IO;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using ZhongWenHub.Business.AITutor;

namespace ZhongWenHub.Business.AILearning.Services.Speech;

public sealed class GeminiSpeechRecognitionService : ISpeechRecognitionService
{
    private static readonly JsonSerializerOptions JsonOptions = new(JsonSerializerDefaults.Web);
    private const int MaxAudioSizeBytes = 10 * 1024 * 1024; // 10 MB

    private readonly HttpClient _httpClient;
    private readonly GeminiOptions _options;
    private readonly ILogger<GeminiSpeechRecognitionService> _logger;

    public GeminiSpeechRecognitionService(
        HttpClient httpClient,
        IOptions<GeminiOptions> options,
        ILogger<GeminiSpeechRecognitionService> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public string ProviderName => "GeminiMultimodalAudioSTT";

    public bool IsAvailable
    {
        get
        {
            var key = ResolveApiKey();
            return !string.IsNullOrWhiteSpace(key);
        }
    }

    public async Task<SpeechRecognitionResult> RecognizeSpeechAsync(
        Stream audioStream,
        string contentType,
        string targetLanguage = "zh-CN",
        CancellationToken cancellationToken = default)
    {
        if (audioStream == null || audioStream.Length == 0)
        {
            return new SpeechRecognitionResult
            {
                IsSuccess = false,
                ErrorCode = "EMPTY_AUDIO",
                ErrorMessage = "Dữ liệu âm thanh trống, vui lòng thử ghi âm lại.",
                Provider = ProviderName
            };
        }

        if (audioStream.Length > MaxAudioSizeBytes)
        {
            return new SpeechRecognitionResult
            {
                IsSuccess = false,
                ErrorCode = "AUDIO_TOO_LARGE",
                ErrorMessage = "Tệp âm thanh vượt quá giới hạn cho phép (10MB).",
                Provider = ProviderName
            };
        }

        var apiKey = ResolveApiKey();
        if (string.IsNullOrWhiteSpace(apiKey))
        {
            _logger.LogInformation("Gemini STT called but Gemini API Key is not configured.");
            return new SpeechRecognitionResult
            {
                IsSuccess = false,
                ErrorCode = "STT_UNAVAILABLE",
                ErrorMessage = "Dịch vụ nhận diện giọng nói (STT Provider) chưa sẵn sàng hoặc chưa được cấu hình trên máy chủ.",
                Provider = "None"
            };
        }

        // Clean content-type (e.g. "audio/webm;codecs=opus" -> "audio/webm")
        var normalizedMime = NormalizeMimeType(contentType);

        byte[] audioBytes;
        if (audioStream is MemoryStream ms)
        {
            audioBytes = ms.ToArray();
        }
        else
        {
            using var mem = new MemoryStream();
            await audioStream.CopyToAsync(mem, cancellationToken);
            audioBytes = mem.ToArray();
        }

        var base64Audio = Convert.ToBase64String(audioBytes);

        var model = string.IsNullOrWhiteSpace(_options.Model) ? "gemini-1.5-flash" : _options.Model.Trim();
        var baseUrl = string.IsNullOrWhiteSpace(_options.BaseUrl)
            ? "https://generativelanguage.googleapis.com/v1beta"
            : _options.BaseUrl.TrimEnd('/');
        var endpoint = $"{baseUrl}/models/{Uri.EscapeDataString(model)}:generateContent";

        var payload = new
        {
            contents = new object[]
            {
                new
                {
                    parts = new object[]
                    {
                        new
                        {
                            inlineData = new
                            {
                                mimeType = normalizedMime,
                                data = base64Audio
                            }
                        },
                        new
                        {
                            text = "You are a specialized Chinese Speech-to-Text transcriber. Transcribe the spoken Chinese audio verbatim into simplified Chinese characters. Output ONLY the raw transcribed Chinese characters, without pinyin, without punctuation, and without explanations."
                        }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0.0,
                maxOutputTokens = 300
            }
        };

        var payloadJson = JsonSerializer.Serialize(payload, JsonOptions);

        using var httpRequest = new HttpRequestMessage(HttpMethod.Post, endpoint)
        {
            Content = new StringContent(payloadJson, Encoding.UTF8, "application/json")
        };
        httpRequest.Headers.TryAddWithoutValidation("x-goog-api-key", apiKey);

        try
        {
            using var response = await _httpClient.SendAsync(httpRequest, cancellationToken);
            var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);

            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Gemini STT request failed with HTTP {StatusCode}: {Body}", (int)response.StatusCode, responseBody);
                return new SpeechRecognitionResult
                {
                    IsSuccess = false,
                    ErrorCode = "STT_PROVIDER_ERROR",
                    ErrorMessage = "Máy chủ STT trả về lỗi trong quá trình xử lý âm thanh.",
                    Provider = ProviderName
                };
            }

            using var doc = JsonDocument.Parse(responseBody);
            var root = doc.RootElement;
            if (root.TryGetProperty("candidates", out var candidates) &&
                candidates.GetArrayLength() > 0 &&
                candidates[0].TryGetProperty("content", out var content) &&
                content.TryGetProperty("parts", out var parts) &&
                parts.GetArrayLength() > 0 &&
                parts[0].TryGetProperty("text", out var textElem))
            {
                var recognized = textElem.GetString()?.Trim() ?? string.Empty;
                return new SpeechRecognitionResult
                {
                    IsSuccess = true,
                    RecognizedText = recognized,
                    Confidence = null, // Gemini multimodal generateContent does not provide acoustic confidence
                    ConfidenceStatus = "UNAVAILABLE",
                    Provider = ProviderName
                };
            }

            return new SpeechRecognitionResult
            {
                IsSuccess = false,
                ErrorCode = "EMPTY_TRANSCRIPT",
                ErrorMessage = "Không thể nhận diện âm thanh được phát ra. Vui lòng phát âm to và rõ hơn.",
                Provider = ProviderName
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unexpected error in Gemini STT transcription.");
            return new SpeechRecognitionResult
            {
                IsSuccess = false,
                ErrorCode = "STT_EXCEPTION",
                ErrorMessage = "Lỗi kết nối khi gửi âm thanh tới nhà cung cấp STT.",
                Provider = ProviderName
            };
        }
    }

    private string? ResolveApiKey()
    {
        return !string.IsNullOrWhiteSpace(_options.ApiKey)
            ? _options.ApiKey
            : Environment.GetEnvironmentVariable("GEMINI_API_KEY");
    }

    private static string NormalizeMimeType(string contentType)
    {
        if (string.IsNullOrWhiteSpace(contentType)) return "audio/webm";
        var parts = contentType.Split(';');
        var primary = parts[0].Trim().ToLowerInvariant();
        return primary switch
        {
            "audio/webm" => "audio/webm",
            "audio/wav" or "audio/x-wav" => "audio/wav",
            "audio/mp3" or "audio/mpeg" => "audio/mp3",
            "audio/mp4" or "audio/m4a" or "audio/x-m4a" => "audio/mp4",
            "audio/ogg" => "audio/ogg",
            _ => "audio/webm"
        };
    }
}

