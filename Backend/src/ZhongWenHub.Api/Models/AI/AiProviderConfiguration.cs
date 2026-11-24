using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ZhongWenHub.Models.AI;

[Table("AiProviderConfigurations")]
public class AiProviderConfiguration : BaseEntity
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string ProviderType { get; set; } = "GEMINI"; // GEMINI, OPENAI, OPENAI_COMPATIBLE

    [MaxLength(500)]
    public string? BaseUrl { get; set; }

    [Required]
    public string EncryptedApiKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DefaultModel { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string CapabilitiesJson { get; set; } = "[\"chat\",\"exercise\",\"evaluation\"]";

    public bool IsEnabled { get; set; } = true;

    public int Priority { get; set; } = 1;

    public int TimeoutSeconds { get; set; } = 30;

    public int MaxRetries { get; set; } = 2;

    public int? MaxTokens { get; set; } = 2048;

    public double? Temperature { get; set; } = 0.7;

    [MaxLength(50)]
    public string LastHealthStatus { get; set; } = "UNCHECKED"; // HEALTHY, DEGRADED, UNHEALTHY, UNCHECKED

    [MaxLength(1000)]
    public string? LastHealthMessage { get; set; }

    public DateTime? LastCheckedAt { get; set; }
}
