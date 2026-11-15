using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace ZhongWenHub.Business.AILearning.Services.Speech;

public sealed class SpeechRecognitionResult
{
    public bool IsSuccess { get; init; }
    public string RecognizedText { get; init; } = string.Empty;
    public double Confidence { get; init; }
    public string Provider { get; init; } = string.Empty;
    public string? ErrorCode { get; init; }
    public string? ErrorMessage { get; init; }
    public int AudioDurationSeconds { get; init; }
}

public interface ISpeechRecognitionService
{
    bool IsAvailable { get; }
    string ProviderName { get; }
    Task<SpeechRecognitionResult> RecognizeSpeechAsync(
        Stream audioStream,
        string contentType,
        string targetLanguage = "zh-CN",
        CancellationToken cancellationToken = default);
}

