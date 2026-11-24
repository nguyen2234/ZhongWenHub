using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Features.admin.AiProviders.DTO;

public class CreateAiProviderRequest
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
    public string ApiKey { get; set; } = string.Empty;

    [Required]
    [MaxLength(100)]
    public string DefaultModel { get; set; } = string.Empty;

    public List<string> Capabilities { get; set; } = new() { "chat", "exercise", "evaluation" };

    public bool IsEnabled { get; set; } = true;

    public int Priority { get; set; } = 1;

    public int TimeoutSeconds { get; set; } = 30;

    public int MaxRetries { get; set; } = 2;

    public int? MaxTokens { get; set; } = 2048;

    public double? Temperature { get; set; } = 0.7;
}

public class UpdateAiProviderRequest
{
    [Required]
    [MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [MaxLength(50)]
    public string ProviderType { get; set; } = "GEMINI";

    [MaxLength(500)]
    public string? BaseUrl { get; set; }

    // If null/empty, keep existing encrypted key
    public string? ApiKey { get; set; }

    [Required]
    [MaxLength(100)]
    public string DefaultModel { get; set; } = string.Empty;

    public List<string> Capabilities { get; set; } = new();

    public bool IsEnabled { get; set; } = true;

    public int Priority { get; set; } = 1;

    public int TimeoutSeconds { get; set; } = 30;

    public int MaxRetries { get; set; } = 2;

    public int? MaxTokens { get; set; } = 2048;

    public double? Temperature { get; set; } = 0.7;
}

public class AiProviderResponse
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string ProviderType { get; set; } = string.Empty;
    public string? BaseUrl { get; set; }
    public string MaskedApiKey { get; set; } = string.Empty;
    public string DefaultModel { get; set; } = string.Empty;
    public List<string> Capabilities { get; set; } = new();
    public bool IsEnabled { get; set; }
    public int Priority { get; set; }
    public int TimeoutSeconds { get; set; }
    public int MaxRetries { get; set; }
    public int? MaxTokens { get; set; }
    public double? Temperature { get; set; }
    public string LastHealthStatus { get; set; } = "UNCHECKED";
    public string? LastHealthMessage { get; set; }
    public DateTime? LastCheckedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class UpdateProviderPriorityItem
{
    public Guid Id { get; set; }
    public int Priority { get; set; }
}

public class UpdateProviderPrioritiesRequest
{
    public List<UpdateProviderPriorityItem> Priorities { get; set; } = new();
}

public class ToggleEnabledRequest
{
    public bool IsEnabled { get; set; }
}

public class TestProviderResponse
{
    public bool IsSuccess { get; set; }
    public int StatusCode { get; set; }
    public long LatencyMs { get; set; }
    public string Message { get; set; } = string.Empty;
    public string Status { get; set; } = "HEALTHY";
    public DateTime TestedAt { get; set; }
}

public class AiUsageSummaryDto
{
    public int TotalRequests { get; set; }
    public int SuccessfulRequests { get; set; }
    public int FailedRequests { get; set; }
    public int TotalTokens { get; set; }
    public double AverageLatencyMs { get; set; }
    public List<ProviderUsageBreakdownDto> Providers { get; set; } = new();
}

public class ProviderUsageBreakdownDto
{
    public string Provider { get; set; } = string.Empty;
    public int Requests { get; set; }
    public int SuccessRequests { get; set; }
    public int TotalTokens { get; set; }
    public double AverageLatencyMs { get; set; }
}
