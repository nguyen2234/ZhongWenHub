using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace ZhongWenHub.Business.Admin.DTOs;

public class AiProviderConfigDto
{
    public Guid Id { get; set; }
    public string ProviderCode { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = string.Empty;
    public List<string> ModelNames { get; set; } = new();
    public bool IsEnabled { get; set; }
    public bool IsDefault { get; set; }
    public string MaskedApiKey { get; set; } = string.Empty;
    public decimal MonthlyBudgetUsd { get; set; }
    public decimal CurrentUsageUsd { get; set; }
    public int RateLimitPerMinute { get; set; }
    public string HealthStatus { get; set; } = "ONLINE";
    public int? LatencyMs { get; set; }
    public DateTime? LastCheckedAt { get; set; }
    public string? LastError { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
}

public class CreateAiProviderDto
{
    [Required(ErrorMessage = "Mã provider không được để trống")]
    [MaxLength(50)]
    [RegularExpression("^[a-z0-9_-]+$", ErrorMessage = "Mã provider chỉ gồm chữ thường, số, dấu gạch nối")]
    public string ProviderCode { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên hiển thị không được để trống")]
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Base URL không được để trống")]
    [MaxLength(500)]
    [Url(ErrorMessage = "Base URL phải là một URL hợp lệ")]
    public string BaseUrl { get; set; } = string.Empty;

    public List<string> ModelNames { get; set; } = new();

    [Required(ErrorMessage = "API Key không được để trống")]
    [MinLength(8, ErrorMessage = "API Key tối thiểu 8 ký tự")]
    [MaxLength(500)]
    public string ApiKey { get; set; } = string.Empty;

    public decimal MonthlyBudgetUsd { get; set; } = 100.00m;
    public int RateLimitPerMinute { get; set; } = 60;
    public bool IsDefault { get; set; } = false;
}

public class UpdateAiProviderDto
{
    [Required(ErrorMessage = "Tên hiển thị không được để trống")]
    [MaxLength(100)]
    public string DisplayName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Base URL không được để trống")]
    [MaxLength(500)]
    [Url(ErrorMessage = "Base URL phải là một URL hợp lệ")]
    public string BaseUrl { get; set; } = string.Empty;

    public List<string> ModelNames { get; set; } = new();

    public string? ApiKey { get; set; } // Optional: only provided when rotating key

    public decimal MonthlyBudgetUsd { get; set; }
    public int RateLimitPerMinute { get; set; }
    public bool IsDefault { get; set; }
}

public class ToggleAiProviderDto
{
    public bool IsEnabled { get; set; }
}

public class TestAiProviderResultDto
{
    public bool Success { get; set; }
    public int? LatencyMs { get; set; }
    public string Message { get; set; } = string.Empty;
    public DateTime CheckedAt { get; set; }
}

public class ApiRegistryItemDto
{
    public string HttpMethod { get; set; } = string.Empty;
    public string RoutePath { get; set; } = string.Empty;
    public string ControllerName { get; set; } = string.Empty;
    public string ActionName { get; set; } = string.Empty;
    public string? RequiredRole { get; set; }
    public string? RequiredPolicy { get; set; }
    public bool RequiresAuth { get; set; }
}
