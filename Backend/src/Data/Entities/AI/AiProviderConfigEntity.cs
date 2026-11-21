using System;

namespace ZhongWenHub.Data.Entities.AI;

public class AiProviderConfigEntity : BaseEntity
{
    public string ProviderCode { get; set; } = string.Empty; // gemini, openai, deepseek, whisper, funasr
    public string DisplayName { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public string ModelNamesJson { get; set; } = "[]"; // JSON array of available model names
    public bool IsEnabled { get; set; } = true;
    public bool IsDefault { get; set; } = false;
    public string MaskedApiKey { get; set; } = string.Empty; // e.g. "AIzaSy...****"
    public string EncryptedApiKey { get; set; } = string.Empty;
    public decimal MonthlyBudgetUsd { get; set; } = 100.00m;
    public decimal CurrentUsageUsd { get; set; } = 0.00m;
    public int RateLimitPerMinute { get; set; } = 60;
    public string HealthStatus { get; set; } = "ONLINE"; // HEALTHY, DEGRADED, MAINTENANCE, IDLE, ONLINE, UNKNOWN
    public int? LatencyMs { get; set; }
    public DateTime? LastCheckedAt { get; set; }
    public string? LastError { get; set; }
}
