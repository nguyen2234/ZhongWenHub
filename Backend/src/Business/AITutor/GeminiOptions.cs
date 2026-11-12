namespace ZhongWenHub.Business.AITutor;

public class GeminiOptions
{
    public const string SectionName = "Gemini";

    /// <summary>
    /// Gemini API Key. Loaded from .NET User Secrets ("Gemini:ApiKey") or environment variables
    /// ("Gemini__ApiKey" / "GEMINI_API_KEY"). Never store real keys in appsettings.json or source code.
    /// </summary>
    public string ApiKey { get; set; } = string.Empty;

    public string Model { get; set; } = "gemini-3-flash-preview";

    public string BaseUrl { get; set; } = "https://generativelanguage.googleapis.com/v1beta";

    public int TimeoutSeconds { get; set; } = 30;

    public int MaxInputLength { get; set; } = 1500;

    public int MaxOutputTokens { get; set; } = 4096;

    public int RateLimitPermitPerMinute { get; set; } = 20;
}

